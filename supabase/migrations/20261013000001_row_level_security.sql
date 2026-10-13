-- Migration: 20261013000001_row_level_security.sql
-- Description: Row Level Security (RLS) enforcement and policy matrix for VTU Adda Project Hub

-- 1. Enable RLS and Force RLS on all public schema tables
do $$
declare
  t text;
  tables text[] := array[
    'profiles', 'user_roles', 'categories', 'projects', 'project_categories',
    'project_files', 'project_media', 'orders', 'order_items', 'payments',
    'download_grants', 'download_log', 'custom_requests', 'request_files',
    'milestones', 'messages', 'mentoring_tiers', 'mentor_slots', 'bookings',
    'reviews', 'coupons', 'coupon_redemptions', 'tickets', 'audit_log',
    'site_settings', 'rate_limits'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('revoke all on table public.%I from public, anon, authenticated;', t);
  end loop;
end;
$$;

-- 2. profiles
grant select on public.profiles to authenticated;
grant update (display_name, phone, updated_at) on public.profiles to authenticated;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. user_roles
grant select on public.user_roles to authenticated;

create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- 4. categories
grant select on public.categories to anon, authenticated;

create policy "categories_select_everyone"
  on public.categories for select
  to anon, authenticated
  using (true);

-- 5. mentoring_tiers
grant select on public.mentoring_tiers to anon, authenticated;

create policy "mentoring_tiers_select_active_or_admin"
  on public.mentoring_tiers for select
  to anon, authenticated
  using (active = true or public.is_admin());

-- 6. projects
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

create policy "projects_select_live_or_admin"
  on public.projects for select
  to anon, authenticated
  using (status = 'live' or public.is_admin());

create policy "projects_insert_admin"
  on public.projects for insert
  to authenticated
  with check (public.is_admin());

create policy "projects_update_admin"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- 7. project_categories
grant select on public.project_categories to anon, authenticated;
grant insert, update, delete on public.project_categories to authenticated;

create policy "project_categories_select_live_or_admin"
  on public.project_categories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_categories.project_id
        and (p.status = 'live' or public.is_admin())
    )
  );

create policy "project_categories_admin_manage"
  on public.project_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 8. project_media
grant select on public.project_media to anon, authenticated;
grant insert, update, delete on public.project_media to authenticated;

create policy "project_media_select_live_or_admin"
  on public.project_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and (p.status = 'live' or public.is_admin())
    )
  );

create policy "project_media_admin_manage"
  on public.project_media for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 9. project_files (view project_file_summaries is granted to anon, authenticated)
grant select on public.project_file_summaries to anon, authenticated;
grant all on public.project_files to authenticated;

create policy "project_files_admin_only"
  on public.project_files for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 10. orders
grant select on public.orders to authenticated;

create policy "orders_select_own_or_admin"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- 11. order_items
grant select on public.order_items to authenticated;

create policy "order_items_select_own_or_admin"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- 12. payments
grant select on public.payments to authenticated;

create policy "payments_select_own_or_admin"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- 13. download_grants
grant select on public.download_grants to authenticated;

create policy "download_grants_select_own_or_admin"
  on public.download_grants for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- 14. Admin-only tables: download_log, audit_log, rate_limits, site_settings, coupons, coupon_redemptions
grant select on public.download_log to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.rate_limits to authenticated;
grant select on public.site_settings to authenticated;
grant select on public.coupons to authenticated;
grant select on public.coupon_redemptions to authenticated;

create policy "download_log_admin_select"
  on public.download_log for select
  to authenticated
  using (public.is_admin());

create policy "audit_log_admin_select"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

create policy "rate_limits_admin_select"
  on public.rate_limits for select
  to authenticated
  using (public.is_admin());

create policy "site_settings_admin_select"
  on public.site_settings for select
  to authenticated
  using (public.is_admin());

create policy "coupons_admin_select"
  on public.coupons for select
  to authenticated
  using (public.is_admin());

create policy "coupon_redemptions_admin_select"
  on public.coupon_redemptions for select
  to authenticated
  using (public.is_admin());

-- 15. custom_requests
grant select, insert, update on public.custom_requests to authenticated;
grant delete on public.custom_requests to authenticated;

create policy "custom_requests_select"
  on public.custom_requests for select
  to authenticated
  using (
    auth.uid() = user_id or
    (public.is_builder() and assigned_builder_id = auth.uid()) or
    public.is_admin()
  );

create policy "custom_requests_insert"
  on public.custom_requests for insert
  to authenticated
  with check (
    (auth.uid() = user_id and status = 'submitted') or
    public.is_admin()
  );

create policy "custom_requests_update"
  on public.custom_requests for update
  to authenticated
  using (
    (public.is_builder() and assigned_builder_id = auth.uid()) or
    public.is_admin()
  )
  with check (
    (public.is_builder() and assigned_builder_id = auth.uid()) or
    public.is_admin()
  );

create policy "custom_requests_delete"
  on public.custom_requests for delete
  to authenticated
  using (public.is_admin());

-- 16. request_files
grant select on public.request_files to authenticated;
grant all on public.request_files to authenticated;

create policy "request_files_select"
  on public.request_files for select
  to authenticated
  using (
    exists (
      select 1 from public.custom_requests r
      where r.id = request_files.request_id
        and (
          r.user_id = auth.uid() or
          (public.is_builder() and r.assigned_builder_id = auth.uid()) or
          public.is_admin()
        )
    )
  );

create policy "request_files_admin_manage"
  on public.request_files for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 17. milestones
grant select, update on public.milestones to authenticated;
grant insert, delete on public.milestones to authenticated;

create policy "milestones_select"
  on public.milestones for select
  to authenticated
  using (
    exists (
      select 1 from public.custom_requests r
      where r.id = milestones.request_id
        and (
          r.user_id = auth.uid() or
          (public.is_builder() and r.assigned_builder_id = auth.uid()) or
          public.is_admin()
        )
    )
  );

create policy "milestones_update"
  on public.milestones for update
  to authenticated
  using (
    (public.is_builder() and exists (
      select 1 from public.custom_requests r
      where r.id = milestones.request_id and r.assigned_builder_id = auth.uid()
    )) or
    public.is_admin()
  )
  with check (
    (public.is_builder() and exists (
      select 1 from public.custom_requests r
      where r.id = milestones.request_id and r.assigned_builder_id = auth.uid()
    )) or
    public.is_admin()
  );

create policy "milestones_admin_manage"
  on public.milestones for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 18. messages
grant select, insert on public.messages to authenticated;
grant update, delete on public.messages to authenticated;

create policy "messages_select"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.custom_requests r
      where r.id = messages.request_id
        and (
          r.user_id = auth.uid() or
          (public.is_builder() and r.assigned_builder_id = auth.uid()) or
          public.is_admin()
        )
    )
  );

create policy "messages_insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.custom_requests r
      where r.id = messages.request_id
        and (
          r.user_id = auth.uid() or
          (public.is_builder() and r.assigned_builder_id = auth.uid()) or
          public.is_admin()
        )
    )
  );

create policy "messages_admin_manage"
  on public.messages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 19. mentor_slots
grant select, insert, update, delete on public.mentor_slots to authenticated;

create policy "mentor_slots_select"
  on public.mentor_slots for select
  to authenticated
  using (
    status = 'open' or
    (public.is_builder() and mentor_id = auth.uid()) or
    public.is_admin()
  );

create policy "mentor_slots_builder_insert"
  on public.mentor_slots for insert
  to authenticated
  with check (
    (public.is_builder() and mentor_id = auth.uid()) or
    public.is_admin()
  );

create policy "mentor_slots_builder_update"
  on public.mentor_slots for update
  to authenticated
  using (
    (public.is_builder() and mentor_id = auth.uid()) or
    public.is_admin()
  )
  with check (
    (public.is_builder() and mentor_id = auth.uid()) or
    public.is_admin()
  );

create policy "mentor_slots_builder_delete"
  on public.mentor_slots for delete
  to authenticated
  using (
    (public.is_builder() and mentor_id = auth.uid()) or
    public.is_admin()
  );

-- 20. bookings
grant select on public.bookings to authenticated;
grant all on public.bookings to authenticated;

create policy "bookings_select"
  on public.bookings for select
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.mentor_slots s
      where s.id = bookings.slot_id and s.mentor_id = auth.uid()
    ) or
    public.is_admin()
  );

create policy "bookings_admin_manage"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 21. reviews
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

create policy "reviews_select"
  on public.reviews for select
  to anon, authenticated
  using (
    status = 'approved' or
    auth.uid() = user_id or
    public.is_admin()
  );

create policy "reviews_insert"
  on public.reviews for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id and
      status = 'pending' and
      exists (
        select 1 from public.orders o
        join public.order_items oi on oi.order_id = o.id
        where o.user_id = auth.uid()
          and o.status = 'paid'
          and oi.project_id = reviews.project_id
      )
    ) or
    public.is_admin()
  );

create policy "reviews_admin_manage"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 22. tickets
grant select, insert on public.tickets to authenticated;
grant all on public.tickets to authenticated;

create policy "tickets_select"
  on public.tickets for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "tickets_insert"
  on public.tickets for insert
  to authenticated
  with check (
    (user_id is null or user_id = auth.uid()) or
    public.is_admin()
  );

create policy "tickets_admin_manage"
  on public.tickets for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
