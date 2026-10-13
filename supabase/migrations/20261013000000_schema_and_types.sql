-- Migration: 20261013000000_schema_and_types.sql
-- Description: Core schema, types, constraints, and security helper functions for VTU Adda Project Hub

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- Helper Functions
create or replace function public.is_admin()
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
        and role = 'admin'
    )
  );
end;
$$;

create or replace function public.is_builder()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = 'builder'
  );
end;
$$;

create or replace function public.is_staff()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return (public.is_admin() or public.is_builder());
end;
$$;

-- Atomic rate limiter function
create or replace function public.rate_limit_hit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count int;
begin
  loop
    select window_start, count
    into v_window_start, v_count
    from public.rate_limits
    where key = p_key
    for update;

    if not found then
      begin
        insert into public.rate_limits (key, window_start, count)
        values (p_key, v_now, 1);
        return false;
      exception when unique_violation then
        continue;
      end;
    else
      if v_now - v_window_start > (p_window_seconds || ' seconds')::interval then
        update public.rate_limits
        set window_start = v_now, count = 1
        where key = p_key;
        return false;
      else
        if v_count >= p_limit then
          return true;
        else
          update public.rate_limits
          set count = count + 1
          where key = p_key;
          return false;
        end if;
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

-- 1. profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0 and length(display_name) <= 60),
  phone text check (phone is null or phone ~ '^\+[1-9]\d{1,14}$'),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. user_roles
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'builder', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Trigger to create profile and default student role on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(new.email, 'student'), '@', 1),
    'Student'
  );

  if length(v_display_name) > 60 then
    v_display_name := substr(v_display_name, 1, 60);
  end if;

  insert into public.profiles (id, display_name, phone, created_at, updated_at)
  values (new.id, v_display_name, null, now(), now())
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, created_at)
  values (new.id, 'student', now())
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('branch', 'domain', 'tech', 'semester', 'scheme')),
  name text not null check (length(trim(name)) > 0 and length(name) <= 100),
  slug text not null check (length(trim(slug)) > 0 and length(slug) <= 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, slug)
);

-- 4. projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(trim(slug)) > 0 and length(slug) <= 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0 and length(title) <= 200),
  summary text not null check (length(trim(summary)) > 0 and length(summary) <= 300),
  description text not null,
  course_type text not null check (course_type in ('mini_project', 'project_phase_1', 'major_project_phase_2', 'capstone', 'hackathon_project', 'other')),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  tech_stack text[] not null default '{}' check (cardinality(tech_stack) <= 12),
  price_inr integer not null check (price_inr >= 0),
  sales_limit integer check (sales_limit is null or sales_limit > 0),
  sales_window_start timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'live', 'hidden')),
  cover_path text,
  demo_video_url text check (demo_video_url is null or demo_video_url like 'https://www.youtube.com/%' or demo_video_url like 'https://youtu.be/%'),
  syllabus_note text,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      array_to_string(tech_stack, ' ')
    )
  ) stored
);

create index if not exists projects_search_gin_idx on public.projects using gin(search);
create index if not exists projects_status_idx on public.projects (status);

-- 5. project_categories
create table if not exists public.project_categories (
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, category_id)
);

-- 6. project_files
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('code', 'report', 'ppt', 'setup_guide', 'viva_qa', 'other')),
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  original_name text not null check (length(trim(original_name)) > 0),
  size_bytes bigint not null check (size_bytes > 0),
  content_type text not null check (length(trim(content_type)) > 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now()
);

-- 7. project_media
create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null check (length(trim(storage_path)) > 0),
  alt_text text not null check (length(trim(alt_text)) > 0 and length(alt_text) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 8. coupons (defined before orders so orders can reference coupons)
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(trim(code)) > 0 and length(code) <= 50),
  percent_off integer check (percent_off is null or (percent_off >= 1 and percent_off <= 100)),
  amount_off_inr integer check (amount_off_inr is null or amount_off_inr >= 1),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (percent_off is not null and amount_off_inr is null) or
    (percent_off is null and amount_off_inr is not null)
  )
);

create unique index if not exists coupons_code_lower_idx on public.coupons (lower(code));

-- 9. orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique check (order_code ~ '^VPH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  type text not null check (type in ('kit', 'custom', 'mentoring')),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'pending_verification', 'paid', 'rejected', 'expired', 'refunded', 'cancelled')),
  subtotal_inr integer not null check (subtotal_inr >= 0),
  discount_inr integer not null default 0 check (discount_inr >= 0),
  total_inr integer not null check (total_inr >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  ack_integrity boolean not null check (ack_integrity = true),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

-- 10. custom_requests (defined before order_items so order_items can reference it)
create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (length(trim(title)) > 0 and length(title) <= 200),
  brief text not null check (length(trim(brief)) > 0 and length(brief) <= 5000),
  branch text not null check (length(trim(branch)) > 0 and length(branch) <= 60),
  semester integer not null check (semester >= 1 and semester <= 8),
  scheme text not null check (length(trim(scheme)) > 0 and length(scheme) <= 20),
  course_type text not null check (course_type in ('mini_project', 'project_phase_1', 'major_project_phase_2', 'capstone', 'hackathon_project', 'other')),
  tech_pref text check (tech_pref is null or length(tech_pref) <= 500),
  deadline date not null,
  budget_inr integer check (budget_inr is null or budget_inr >= 0),
  team_size integer not null default 1 check (team_size >= 1 and team_size <= 4),
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'quoted', 'accepted', 'in_progress', 'delivered', 'completed', 'declined', 'cancelled')),
  assigned_builder_id uuid references auth.users(id) on delete set null,
  quote_total_inr integer check (quote_total_inr is null or quote_total_inr >= 0),
  quote_deposit_inr integer check (quote_deposit_inr is null or quote_deposit_inr >= 0),
  quote_note text,
  quote_valid_until timestamptz,
  declined_reason text,
  ack_integrity boolean not null check (ack_integrity = true),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists custom_requests_user_id_idx on public.custom_requests (user_id);
create index if not exists custom_requests_builder_id_idx on public.custom_requests (assigned_builder_id);

-- 11. mentoring_tiers (defined before order_items so order_items can reference it)
create table if not exists public.mentoring_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0 and length(name) <= 100),
  description text,
  price_inr integer not null check (price_inr >= 0),
  session_count integer not null check (session_count > 0),
  session_minutes integer not null check (session_minutes > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 12. order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  project_id uuid references public.projects(id) on delete restrict,
  mentoring_tier_id uuid references public.mentoring_tiers(id) on delete restrict,
  request_id uuid references public.custom_requests(id) on delete restrict,
  label text not null check (length(trim(label)) > 0),
  price_inr integer not null check (price_inr >= 0),
  created_at timestamptz not null default now(),
  check (
    ((project_id is not null)::int +
     (mentoring_tier_id is not null)::int +
     (request_id is not null)::int) = 1
  )
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- 13. payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'manual_upi' check (method in ('manual_upi')),
  amount_inr integer not null check (amount_inr >= 0),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'pending_verification', 'paid', 'rejected', 'expired', 'refunded')),
  utr text check (utr is null or utr ~ '^[0-9]{12}$'),
  proof_path text,
  proof_deleted_at timestamptz,
  submitted_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  reject_reason text,
  attempt integer not null default 1 check (attempt >= 1),
  refund_amount_inr integer check (refund_amount_inr is null or refund_amount_inr >= 0),
  refund_reference text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create unique index if not exists payments_utr_active_idx on public.payments (utr)
  where utr is not null and status in ('pending_verification', 'paid');

-- 14. download_grants
create table if not exists public.download_grants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  max_downloads integer not null default 5 check (max_downloads > 0),
  download_count integer not null default 0 check (download_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, project_id)
);

create index if not exists download_grants_user_project_idx on public.download_grants (user_id, project_id);

-- 15. download_log
create table if not exists public.download_log (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.download_grants(id) on delete cascade,
  file_id uuid not null references public.project_files(id) on delete cascade,
  ip_hash text not null check (length(trim(ip_hash)) > 0),
  created_at timestamptz not null default now()
);

-- 16. request_files
create table if not exists public.request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_requests(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  kind text not null check (kind in ('student_reference', 'deliverable')),
  storage_path text not null check (length(trim(storage_path)) > 0),
  original_name text not null check (length(trim(original_name)) > 0),
  size_bytes bigint not null check (size_bytes > 0),
  content_type text not null check (length(trim(content_type)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists request_files_request_id_idx on public.request_files (request_id);

-- 17. milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_requests(id) on delete cascade,
  position integer not null check (position >= 1),
  title text not null check (length(trim(title)) > 0 and length(title) <= 200),
  description text,
  due_date date,
  needs_student_input boolean not null default false,
  student_input_text text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'awaiting_student', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists milestones_request_id_idx on public.milestones (request_id, position);

-- 18. messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists messages_request_id_idx on public.messages (request_id, created_at);

-- 19. mentor_slots
create table if not exists public.mentor_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'open' check (status in ('open', 'held', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  exclude using gist (
    mentor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled')
);

create index if not exists mentor_slots_status_idx on public.mentor_slots (status, starts_at);

-- 20. bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  tier_id uuid not null references public.mentoring_tiers(id) on delete restrict,
  slot_id uuid not null unique references public.mentor_slots(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'pending_verification', 'confirmed', 'completed', 'cancelled', 'refunded')),
  meet_url text check (meet_url is null or meet_url like 'https://%'),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);

-- 21. reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists reviews_project_id_idx on public.reviews (project_id, status);

-- 22. coupon_redemptions
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 23. tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (length(trim(email)) > 0 and length(email) <= 255 and email ~* '^.+@.+\..+$'),
  kind text not null check (kind in ('support', 'deletion_request', 'other')),
  subject text not null check (length(trim(subject)) > 0 and length(subject) <= 200),
  body text not null check (length(trim(body)) > 0 and length(body) <= 5000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_id_idx on public.tickets (user_id);

-- 24. audit_log
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) > 0 and length(action) <= 100),
  entity text not null check (length(trim(entity)) > 0 and length(entity) <= 100),
  entity_id text check (entity_id is null or length(entity_id) <= 100),
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- 25. site_settings
create table if not exists public.site_settings (
  key text primary key check (length(trim(key)) > 0 and length(key) <= 100),
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 26. rate_limits
create table if not exists public.rate_limits (
  key text primary key check (length(trim(key)) > 0 and length(key) <= 255),
  window_start timestamptz not null default now(),
  count integer not null default 1 check (count >= 1)
);

-- Public summary view for project files (never exposes storage_path)
create or replace view public.project_file_summaries as
select
  pf.id,
  pf.project_id,
  pf.kind,
  pf.original_name,
  pf.size_bytes
from public.project_files pf
join public.projects p on p.id = pf.project_id
where p.status = 'live';
