-- Migration: 20261013000002_storage_buckets.sql
-- Description: Storage buckets configuration and policies for VTU Adda Project Hub

-- 1. Create or update storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'project-files',
    'project-files',
    false,
    209715200, -- 200 MB
    array[
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
  ),
  (
    'payment-proofs',
    'payment-proofs',
    false,
    3145728, -- 3 MB
    array[
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
  ),
  (
    'request-files',
    'request-files',
    false,
    209715200, -- 200 MB
    array[
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'text/plain'
    ]
  ),
  (
    'public-media',
    'public-media',
    true,
    2097152, -- 2 MB
    array[
      'image/webp'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage policies
-- Private buckets (project-files, payment-proofs, request-files):
-- No policies granted to anon or authenticated. Access is strictly via service role signed URLs.

-- public-media bucket allows public read only; writes strictly by service role
drop policy if exists "public_media_read" on storage.objects;
create policy "public_media_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'public-media');
