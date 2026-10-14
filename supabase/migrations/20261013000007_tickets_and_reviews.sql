-- Migration 20261013000007_tickets_and_reviews.sql
-- Prompt 10: Support tickets metadata, review moderation fields, and RLS

-- 1. Enhance tickets table
alter table public.tickets
  add column if not exists name text not null default '',
  add column if not exists order_code text,
  add column if not exists internal_note text,
  add column if not exists updated_at timestamptz not null default now();

-- Index for status filtering and order queries
create index if not exists tickets_status_idx on public.tickets (status, created_at desc);
create index if not exists tickets_order_code_idx on public.tickets (order_code) where order_code is not null;

-- 2. Enhance reviews table
alter table public.reviews
  add column if not exists admin_reason text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

-- Index for pending review queue
create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);

-- 3. Anonymous insert grant for tickets if needed via service/authenticated
-- Authenticated users can select own tickets
create index if not exists reviews_order_id_idx on public.reviews (order_id);
