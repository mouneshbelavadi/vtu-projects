-- Migration: 20261013000006_mentoring_bookings.sql
-- Prompt 9: Mentoring bookings, slots, tiers, hold flow, and payment approval integration

-- 1. mentor_slots additions: held_until and held_by
alter table public.mentor_slots
  add column if not exists held_until timestamptz default null,
  add column if not exists held_by uuid references auth.users(id) on delete set null default null;

create index if not exists mentor_slots_held_idx
  on public.mentor_slots (status, held_until)
  where (status = 'held');

-- 2. bookings additions: reminder_sent_at, cancelled_reason, and partial unique index
alter table public.bookings
  add column if not exists reminder_sent_at timestamptz default null,
  add column if not exists cancelled_reason text default null;

-- Drop original unique constraint on slot_id to allow re-booking after cancellation/refund
alter table public.bookings
  drop constraint if exists bookings_slot_id_key;

create unique index if not exists bookings_active_slot_idx
  on public.bookings (slot_id)
  where (status not in ('cancelled', 'refunded'));

-- 3. mentoring_tiers constraint & admin manage policies
alter table public.mentoring_tiers
  drop constraint if exists mentoring_tiers_session_count_single;

alter table public.mentoring_tiers
  add constraint mentoring_tiers_session_count_single check (session_count = 1);

grant insert, update, delete on public.mentoring_tiers to authenticated;

drop policy if exists "mentoring_tiers_insert_admin" on public.mentoring_tiers;
create policy "mentoring_tiers_insert_admin"
  on public.mentoring_tiers for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "mentoring_tiers_update_admin" on public.mentoring_tiers;
create policy "mentoring_tiers_update_admin"
  on public.mentoring_tiers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mentoring_tiers_delete_admin" on public.mentoring_tiers;
create policy "mentoring_tiers_delete_admin"
  on public.mentoring_tiers for delete
  to authenticated
  using (public.is_admin());

-- 4. Default site_settings key for mentoring min notice hours
insert into public.site_settings (key, value)
values ('mentoring_min_notice_hours', '12'::jsonb)
on conflict (key) do nothing;

-- 5. hold_slot SQL function: atomic lock, availability check, hold & order creation
create or replace function public.hold_slot(
  p_slot_id uuid,
  p_user_id uuid,
  p_tier_id uuid,
  p_order_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot record;
  v_tier record;
  v_order_id uuid;
  v_order_code text;
  v_booking_id uuid;
  v_min_notice_hours int := 12;
  v_settings_val jsonb;
  v_held_until timestamptz;
begin
  -- A. Read mentoring_min_notice_hours from site_settings (default 12)
  select value into v_settings_val
  from public.site_settings
  where key = 'mentoring_min_notice_hours';

  if v_settings_val is not null and (v_settings_val #>> '{}') ~ '^[0-9]+$' then
    v_min_notice_hours := (v_settings_val #>> '{}')::int;
  end if;

  -- B. Lock the slot row
  select id, mentor_id, starts_at, ends_at, status, held_until
  into v_slot
  from public.mentor_slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'SLOT_NOT_FOUND';
  end if;

  -- C. Verify slot is open
  if v_slot.status <> 'open' then
    raise exception 'SLOT_NOT_AVAILABLE';
  end if;

  -- D. Verify slot starts in the future and meets minimum notice
  if v_slot.starts_at <= now() or v_slot.starts_at < (now() + (v_min_notice_hours || ' hours')::interval) then
    raise exception 'MIN_NOTICE_VIOLATION';
  end if;

  -- E. Lock tier and verify active
  select id, name, price_inr
  into v_tier
  from public.mentoring_tiers
  where id = p_tier_id and active = true
  for share;

  if not found then
    raise exception 'INVALID_TIER';
  end if;

  -- F. Calculate held_until (2 hours ahead)
  v_held_until := now() + interval '2 hours';

  -- G. Determine order code
  if p_order_code is not null and length(trim(p_order_code)) > 0 then
    v_order_code := trim(p_order_code);
  else
    v_order_code := 'VPH-' || upper(substr(md5(random()::text), 1, 8));
  end if;

  -- H. Create Order
  insert into public.orders (
    user_id,
    order_code,
    type,
    status,
    subtotal_inr,
    discount_inr,
    total_inr,
    ack_integrity,
    expires_at,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    v_order_code,
    'mentoring',
    'awaiting_payment',
    v_tier.price_inr,
    0,
    v_tier.price_inr,
    true,
    v_held_until,
    now(),
    now()
  )
  returning id into v_order_id;

  -- I. Create Order Item
  insert into public.order_items (
    order_id,
    mentoring_tier_id,
    label,
    price_inr,
    created_at
  )
  values (
    v_order_id,
    p_tier_id,
    v_tier.name,
    v_tier.price_inr,
    now()
  );

  -- J. Create Booking
  insert into public.bookings (
    user_id,
    tier_id,
    slot_id,
    order_id,
    status,
    created_at
  )
  values (
    p_user_id,
    p_tier_id,
    p_slot_id,
    v_order_id,
    'awaiting_payment',
    now()
  )
  returning id into v_booking_id;

  -- K. Update slot to held
  update public.mentor_slots
  set status = 'held',
      held_until = v_held_until,
      held_by = p_user_id
  where id = p_slot_id;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'booking_id', v_booking_id,
    'order_code', v_order_code
  );
end;
$$;

revoke execute on function public.hold_slot(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.hold_slot(uuid, uuid, uuid, text) to authenticated, service_role;

-- 6. expire_held_slots SQL function: releases overdue held slots
create or replace function public.expire_held_slots()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot record;
  v_count int := 0;
begin
  for v_slot in
    select id, held_by
    from public.mentor_slots
    where status = 'held'
      and held_until <= now()
    for update
  loop
    -- Cancel related bookings that are awaiting_payment
    update public.bookings
    set status = 'cancelled',
        cancelled_reason = 'Hold expired'
    where slot_id = v_slot.id
      and status = 'awaiting_payment';

    -- Release slot back to open
    update public.mentor_slots
    set status = 'open',
        held_until = null,
        held_by = null
    where id = v_slot.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.expire_held_slots() from public, anon;
grant execute on function public.expire_held_slots() to authenticated, service_role;

-- 7. Update approve_payment function to advance mentoring bookings
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
  v_booking record;
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

  -- 7. Mentoring booking confirmation:
  for v_booking in
    select id, slot_id, status
    from public.bookings
    where order_id = v_order.id
  loop
    update public.bookings
    set status = 'confirmed'
    where id = v_booking.id
      and status in ('awaiting_payment', 'pending_verification');

    update public.mentor_slots
    set status = 'booked'
    where id = v_booking.slot_id
      and status in ('open', 'held');
  end loop;

  -- 8. Record coupon redemption if a coupon was used
  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, created_at)
    values (v_order.coupon_id, v_order.id, now())
    on conflict (order_id) do nothing;

    update public.coupons
    set redeemed_count = redeemed_count + 1
    where id = v_order.coupon_id;
  end if;

  -- 9. Write audit log entry
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

-- 8. Update submit_payment_proof function to advance booking status
create or replace function public.submit_payment_proof(
  p_order_id uuid,
  p_user_id uuid,
  p_utr text,
  p_proof_path text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_attempts_count int;
  v_new_payment_id uuid;
  v_kit_title text;
begin
  -- 1. Lock the order row and verify ownership
  select id, user_id, order_code, status, total_inr, expires_at
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.user_id <> p_user_id then
    raise exception 'ORDER_NOT_OWNED';
  end if;

  -- 2. Verify order status allows payment proof
  if v_order.status not in ('awaiting_payment', 'rejected') then
    raise exception 'ORDER_STATUS_INVALID';
  end if;

  -- 3. Verify order has not expired
  if v_order.expires_at is not null and v_order.expires_at < now() then
    raise exception 'ORDER_EXPIRED';
  end if;

  -- 4. Count prior payment attempts for this order
  select coalesce(max(attempt), 0)
  into v_attempts_count
  from public.payments
  where order_id = p_order_id;

  if v_attempts_count >= 3 then
    raise exception 'MAX_ATTEMPTS_EXCEEDED';
  end if;

  -- 5. Check UTR uniqueness across active payments
  if exists (
    select 1
    from public.payments
    where utr = p_utr
      and status in ('pending_verification', 'paid')
      and order_id <> p_order_id
  ) then
    raise exception 'UTR_ALREADY_USED';
  end if;

  -- 6. Insert payment row
  insert into public.payments (
    order_id,
    method,
    amount_inr,
    status,
    utr,
    proof_path,
    submitted_at,
    attempt,
    created_at
  )
  values (
    p_order_id,
    'manual_upi',
    v_order.total_inr,
    'pending_verification',
    p_utr,
    p_proof_path,
    now(),
    v_attempts_count + 1,
    now()
  )
  returning id into v_new_payment_id;

  -- 7. Update order status to pending_verification
  update public.orders
  set status = 'pending_verification',
      updated_at = now()
  where id = p_order_id;

  -- 8. If order has a booking, advance booking status to pending_verification
  update public.bookings
  set status = 'pending_verification'
  where order_id = p_order_id
    and status = 'awaiting_payment';

  -- 9. Fetch kit/item title
  select coalesce(oi.label, 'Project Kit')
  into v_kit_title
  from public.order_items oi
  where oi.order_id = p_order_id
  limit 1;

  return v_new_payment_id::text;
end;
$$;

revoke execute on function public.submit_payment_proof(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_payment_proof(uuid, uuid, text, text) to service_role;

-- 9. Update refund_payment function to cancel related bookings and release slots
create or replace function public.refund_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_amount_inr int,
  p_reference text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
  v_order record;
  v_booking record;
begin
  -- 1. Lock payment row
  select id, order_id, status, amount_inr
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_payment.status <> 'paid' then
    return 'not_paid';
  end if;

  if p_amount_inr > v_payment.amount_inr then
    return 'amount_exceeds_paid';
  end if;

  -- 2. Lock order row
  select id, order_code
  into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  -- 3. Set payment to refunded
  update public.payments
  set status = 'refunded',
      refund_amount_inr = p_amount_inr,
      refund_reference = p_reference,
      refunded_at = now()
  where id = p_payment_id;

  -- 4. Set order to refunded
  update public.orders
  set status = 'refunded',
      updated_at = now()
  where id = v_payment.order_id;

  -- 5. Revoke all active download grants for this order
  update public.download_grants
  set revoked_at = now()
  where order_id = v_payment.order_id
    and revoked_at is null;

  -- 6. Cancel/refund any booking on this order and free the slot
  for v_booking in
    select id, slot_id
    from public.bookings
    where order_id = v_payment.order_id
  loop
    update public.bookings
    set status = 'refunded'
    where id = v_booking.id;

    update public.mentor_slots
    set status = 'open',
        held_until = null,
        held_by = null
    where id = v_booking.slot_id;
  end loop;

  -- 7. Write audit row
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
    'refund_payment',
    'payments',
    p_payment_id::text,
    jsonb_build_object(
      'order_id', v_payment.order_id,
      'order_code', v_order.order_code,
      'refund_amount_inr', p_amount_inr,
      'reference', p_reference
    ),
    now()
  );

  return 'ok';
end;
$$;

revoke execute on function public.refund_payment(uuid, uuid, int, text) from public, anon, authenticated;
grant execute on function public.refund_payment(uuid, uuid, int, text) to service_role;

