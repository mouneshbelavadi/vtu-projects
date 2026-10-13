-- Migration: 20261013000004_payment_verification_and_downloads.sql
-- Description: Database functions for payment approval, rejection, refunds, proof purging, and atomic file download consumption

-- 1. approve_payment function
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
  select id, user_id, order_code, coupon_id, status
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

  -- 6. Create download grants for each project in the order
  for v_item in
    select project_id
    from public.order_items
    where order_id = v_order.id
      and project_id is not null
  loop
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
      'order_code', v_order.order_code
    ),
    now()
  );

  return 'ok';
end;
$$;

revoke execute on function public.approve_payment(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_payment(uuid, uuid) to service_role;

-- 2. reject_payment function
create or replace function public.reject_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_reason text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
  v_order record;
  v_full_reason text;
begin
  -- 1. Lock payment row
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

  -- 2. Lock order row
  select id, order_code
  into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  v_full_reason := p_reason;
  if p_note is not null and length(trim(p_note)) > 0 then
    v_full_reason := p_reason || ': ' || trim(p_note);
  end if;

  -- 3. Update payment to rejected
  update public.payments
  set status = 'rejected',
      reject_reason = v_full_reason,
      verified_by = p_admin_id,
      verified_at = now()
  where id = p_payment_id;

  -- 4. Update order to rejected
  update public.orders
  set status = 'rejected',
      updated_at = now()
  where id = v_payment.order_id;

  -- 5. Write audit row
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
    'reject_payment',
    'payments',
    p_payment_id::text,
    jsonb_build_object(
      'order_id', v_payment.order_id,
      'order_code', v_order.order_code,
      'reason', p_reason,
      'note', p_note
    ),
    now()
  );

  return 'ok';
end;
$$;

revoke execute on function public.reject_payment(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.reject_payment(uuid, uuid, text, text) to service_role;

-- 3. refund_payment function
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

  -- 6. Write audit row
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

-- 4. purge_expired_proofs function
create or replace function public.purge_expired_proofs(
  p_batch_size int default 50
)
returns table (
  payment_id uuid,
  proof_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retention_days int;
  v_settings_val jsonb;
begin
  select value into v_settings_val
  from public.site_settings
  where key = 'proof_retention_days';

  if v_settings_val is null or not ((v_settings_val #>> '{}') ~ '^[0-9]+$') then
    return;
  end if;

  v_retention_days := (v_settings_val #>> '{}')::int;
  if v_retention_days is null or v_retention_days <= 0 then
    return;
  end if;

  return query
  select p.id, p.proof_path
  from public.payments p
  where p.proof_path is not null
    and p.proof_deleted_at is null
    and p.status <> 'pending_verification'
    and p.verified_at is not null
    and p.verified_at < (now() - (v_retention_days || ' days')::interval)
  limit p_batch_size;
end;
$$;

revoke execute on function public.purge_expired_proofs(int) from public, anon, authenticated;
grant execute on function public.purge_expired_proofs(int) to service_role;

-- 5. consume_download function
create or replace function public.consume_download(
  p_grant_id uuid,
  p_file_id uuid,
  p_ip_hash text
)
returns table (
  storage_path text,
  file_name text,
  content_type text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grant record;
  v_order record;
  v_file record;
begin
  -- 1. Lock the grant row
  select id, order_id, user_id, project_id, max_downloads, download_count, expires_at, revoked_at
  into v_grant
  from public.download_grants
  where id = p_grant_id
  for update;

  if not found then
    raise exception 'GRANT_NOT_FOUND';
  end if;

  if v_grant.revoked_at is not null then
    raise exception 'GRANT_REVOKED';
  end if;

  if v_grant.expires_at is not null and v_grant.expires_at <= now() then
    raise exception 'GRANT_EXPIRED';
  end if;

  if v_grant.download_count >= v_grant.max_downloads then
    raise exception 'DOWNLOAD_LIMIT_REACHED';
  end if;

  -- 2. Verify order status is paid
  select id, status
  into v_order
  from public.orders
  where id = v_grant.order_id;

  if not found or v_order.status <> 'paid' then
    raise exception 'ORDER_NOT_PAID';
  end if;

  -- 3. Verify file belongs to project
  select id, project_id, storage_path, original_name, content_type
  into v_file
  from public.project_files
  where id = p_file_id
    and project_id = v_grant.project_id;

  if not found then
    raise exception 'FILE_NOT_FOUND';
  end if;

  -- 4. Atomically increment download count
  update public.download_grants
  set download_count = download_count + 1
  where id = p_grant_id;

  -- 5. Insert download log row
  insert into public.download_log (
    grant_id,
    file_id,
    ip_hash,
    created_at
  )
  values (
    p_grant_id,
    p_file_id,
    p_ip_hash,
    now()
  );

  return query select v_file.storage_path, v_file.original_name, v_file.content_type;
end;
$$;

revoke execute on function public.consume_download(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.consume_download(uuid, uuid, text) to service_role;
