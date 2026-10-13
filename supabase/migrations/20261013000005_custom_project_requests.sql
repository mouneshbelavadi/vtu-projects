-- Migration: 20261013000005_custom_project_requests.sql
-- Description: Custom project request extensions: is_final flag, AAL2 builder MFA, state machine table & transition function, and custom request approval integration

-- 1. Add is_final to request_files
alter table public.request_files add column if not exists is_final boolean not null default false;

-- 2. Update is_builder() to require AAL2 MFA level
create or replace function public.is_builder()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return (
    (auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'builder'
    )
  );
end;
$$;

-- 3. Allowed status transitions table
create table if not exists public.custom_request_allowed_transitions (
  from_status text not null,
  to_status text not null,
  primary key (from_status, to_status)
);

insert into public.custom_request_allowed_transitions (from_status, to_status) values
  ('submitted', 'under_review'),
  ('submitted', 'declined'),
  ('submitted', 'cancelled'),
  ('under_review', 'quoted'),
  ('under_review', 'declined'),
  ('under_review', 'cancelled'),
  ('quoted', 'accepted'),
  ('quoted', 'declined'),
  ('quoted', 'cancelled'),
  ('accepted', 'in_progress'),
  ('accepted', 'cancelled'),
  ('in_progress', 'delivered'),
  ('in_progress', 'cancelled'),
  ('delivered', 'completed'),
  ('delivered', 'cancelled')
on conflict do nothing;

-- 4. SQL-backed transition function
create or replace function public.transition_custom_request(
  p_request_id uuid,
  p_target_status text,
  p_actor_id uuid,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req record;
  v_allowed boolean;
begin
  -- 1. Lock the request row
  select id, status, title, user_id
  into v_req
  from public.custom_requests
  where id = p_request_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_req.status = p_target_status then
    return 'already_in_status';
  end if;

  -- 2. Check transition table
  select exists (
    select 1
    from public.custom_request_allowed_transitions
    where from_status = v_req.status
      and to_status = p_target_status
  ) into v_allowed;

  if not v_allowed then
    raise exception 'INVALID_STATUS_TRANSITION: % to %', v_req.status, p_target_status;
  end if;

  -- 3. Update request status
  update public.custom_requests
  set status = p_target_status,
      declined_reason = case when p_target_status = 'declined' then coalesce(p_reason, declined_reason) else declined_reason end,
      updated_at = now()
  where id = p_request_id;

  -- 4. Record audit row
  insert into public.audit_log (
    actor_id,
    action,
    entity,
    entity_id,
    details,
    created_at
  )
  values (
    p_actor_id,
    'transition_custom_request',
    'custom_requests',
    p_request_id::text,
    jsonb_build_object(
      'from_status', v_req.status,
      'to_status', p_target_status,
      'reason', p_reason
    ),
    now()
  );

  return 'ok';
end;
$$;

revoke execute on function public.transition_custom_request(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.transition_custom_request(uuid, text, uuid, text) to service_role;

-- 5. Updated approve_payment() supporting custom deposit and balance transitions
create or replace function public.approve_payment(
  p_payment_id uuid,
  p_admin_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
  v_order record;
  v_max_downloads int := 5;
  v_settings_val jsonb;
  v_item record;
begin
  -- 1. Lock the payment row
  select id, order_id, status
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_payment.status <> 'pending_verification' then
    return 'already_processed';
  end if;

  -- 2. Lock the order row
  select id, user_id, order_code, coupon_id, status, type
  into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then
    return 'order_not_found';
  end if;

  -- 3. Read max_downloads_default from site_settings
  select value into v_settings_val
  from public.site_settings
  where key = 'max_downloads_default';

  if v_settings_val is not null and (v_settings_val #>> '{}') ~ '^[0-9]+$' then
    v_max_downloads := (v_settings_val #>> '{}')::int;
  end if;

  -- 4. Set payment to paid
  update public.payments
  set status = 'paid',
      verified_by = p_admin_id,
      verified_at = now()
  where id = p_payment_id;

  -- 5. Set order to paid
  update public.orders
  set status = 'paid',
      updated_at = now()
  where id = v_order.id;

  -- 6. Process order items: project kit grants & custom request transitions
  for v_item in
    select project_id, request_id, label
    from public.order_items
    where order_id = v_order.id
  loop
    -- A. Kit items: download grant
    if v_item.project_id is not null then
      insert into public.download_grants (
        order_id,
        user_id,
        project_id,
        max_downloads,
        download_count,
        created_at
      )
      values (
        v_order.id,
        v_order.user_id,
        v_item.project_id,
        v_max_downloads,
        0,
        now()
      )
      on conflict (order_id, project_id) do nothing;
    end if;

    -- B. Custom request items: Deposit or Balance
    if v_item.request_id is not null then
      if v_item.label = 'Deposit' then
        update public.custom_requests
        set status = 'in_progress',
            updated_at = now()
        where id = v_item.request_id
          and status = 'accepted';
      elsif v_item.label = 'Balance' then
        update public.custom_requests
        set status = 'completed',
            updated_at = now()
        where id = v_item.request_id
          and status = 'delivered';
      end if;
    end if;
  end loop;

  -- 7. Record coupon redemption if a coupon was used
  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, created_at)
    values (v_order.coupon_id, v_order.id, now())
    on conflict (order_id) do nothing;

    update public.coupons
    set redeemed_count = redeemed_count + 1
    where id = v_order.coupon_id;
  end if;

  -- 8. Write audit log entry
  insert into public.audit_log (
    actor_id,
    action,
    entity,
    entity_id,
    details,
    created_at
  )
  values (
    p_admin_id,
    'approve_payment',
    'payments',
    p_payment_id::text,
    jsonb_build_object(
      'order_id', v_order.id,
      'order_code', v_order.order_code,
      'order_type', v_order.type
    ),
    now()
  );

  return 'ok';
end;
$$;

revoke execute on function public.approve_payment(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_payment(uuid, uuid) to service_role;

-- 6. Direct status update guard trigger
create or replace function public.check_custom_request_status_transition()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.status is distinct from new.status and current_user not in ('postgres', 'service_role') then
    raise exception 'Direct status update is forbidden. Status must be updated via server actions.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_custom_request_status on public.custom_requests;
create trigger trg_check_custom_request_status
  before update of status on public.custom_requests
  for each row
  execute function public.check_custom_request_status_transition();

-- 7. Allowed transitions table RLS
alter table public.custom_request_allowed_transitions enable row level security;

create policy "custom_request_allowed_transitions_select"
  on public.custom_request_allowed_transitions for select
  to authenticated
  using (true);

-- 8. Milestone student input update policy
drop policy if exists "milestones_student_update_input" on public.milestones;
create policy "milestones_student_update_input"
  on public.milestones for update
  to authenticated
  using (
    exists (
      select 1 from public.custom_requests r
      where r.id = milestones.request_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.custom_requests r
      where r.id = milestones.request_id and r.user_id = auth.uid()
    )
  );
