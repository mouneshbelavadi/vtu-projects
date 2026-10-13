-- Migration: 20261013000003_checkout_and_orders.sql
-- Description: Atomic transaction functions for checkout kit order creation and payment proof submission

-- 1. Atomic Kit Order Creation Function
create or replace function public.create_kit_order(
  p_user_id uuid,
  p_project_id uuid,
  p_order_code text,
  p_subtotal_inr int,
  p_discount_inr int,
  p_total_inr int,
  p_coupon_id uuid,
  p_expires_at timestamptz
)
returns table (
  order_id uuid,
  order_code text,
  is_existing boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project record;
  v_active_sales_count int;
  v_existing_order record;
  v_new_order_id uuid;
begin
  -- 1. Check if user already owns a paid kit order
  select o.id, o.order_code into v_existing_order
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.user_id = p_user_id
    and oi.project_id = p_project_id
    and o.status = 'paid'
  limit 1;

  if found then
    raise exception 'ALREADY_PAID';
  end if;

  -- 2. Check if user already has an open order (awaiting_payment or pending_verification)
  select o.id, o.order_code into v_existing_order
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.user_id = p_user_id
    and oi.project_id = p_project_id
    and o.status in ('awaiting_payment', 'pending_verification')
    and o.expires_at > now()
  order by o.created_at desc
  limit 1;

  if found then
    return query select v_existing_order.id, v_existing_order.order_code, true;
    return;
  end if;

  -- 3. Lock the project row for update to serialize sales quota checks
  select id, title, status, sales_limit, sales_window_start
  into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found or v_project.status <> 'live' then
    raise exception 'PROJECT_NOT_AVAILABLE';
  end if;

  -- 4. Check sales quota
  if v_project.sales_limit is not null then
    select count(*)
    into v_active_sales_count
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where oi.project_id = p_project_id
      and o.status in ('awaiting_payment', 'pending_verification', 'paid')
      and o.created_at >= v_project.sales_window_start;

    if v_active_sales_count >= v_project.sales_limit then
      raise exception 'SALES_LIMIT_REACHED';
    end if;
  end if;

  -- 5. Insert order
  insert into public.orders (
    order_code,
    user_id,
    type,
    status,
    subtotal_inr,
    discount_inr,
    total_inr,
    coupon_id,
    ack_integrity,
    expires_at,
    created_at,
    updated_at
  )
  values (
    p_order_code,
    p_user_id,
    'kit',
    'awaiting_payment',
    p_subtotal_inr,
    p_discount_inr,
    p_total_inr,
    p_coupon_id,
    true,
    p_expires_at,
    now(),
    now()
  )
  returning id into v_new_order_id;

  -- 6. Insert order item
  insert into public.order_items (
    order_id,
    project_id,
    label,
    price_inr,
    created_at
  )
  values (
    v_new_order_id,
    p_project_id,
    v_project.title,
    p_total_inr,
    now()
  );

  return query select v_new_order_id, p_order_code, false;
end;
$$;

revoke execute on function public.create_kit_order(uuid, uuid, text, int, int, int, uuid, timestamptz) from public, anon, authenticated;

-- 2. Atomic Payment Proof Submission Function
create or replace function public.submit_payment_proof(
  p_order_id uuid,
  p_user_id uuid,
  p_utr text,
  p_proof_path text default null
)
returns table (
  payment_id uuid,
  order_code text,
  total_inr int,
  kit_title text
)
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
  -- 1. Lock the order row for update
  select id, order_code, user_id, status, total_inr, expires_at
  into v_order
  from public.orders
  where id = p_order_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- 2. Check expiry
  if v_order.expires_at <= now() or v_order.status = 'expired' then
    raise exception 'ORDER_EXPIRED';
  end if;

  -- 3. Check status is awaiting_payment or rejected
  if v_order.status not in ('awaiting_payment', 'rejected') then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  -- 4. Check attempts count for rejected orders
  select count(*)
  into v_attempts_count
  from public.payments
  where order_id = p_order_id;

  if v_order.status = 'rejected' and v_attempts_count >= 3 then
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

  -- 8. Fetch kit title
  select coalesce(oi.label, 'Project Kit')
  into v_kit_title
  from public.order_items oi
  where oi.order_id = p_order_id
  limit 1;

  return query select v_new_payment_id, v_order.order_code, v_order.total_inr, v_kit_title;
end;
$$;

revoke execute on function public.submit_payment_proof(uuid, uuid, text, text) from public, anon, authenticated;
