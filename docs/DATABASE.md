# Database Schema and Security Matrix

VTU Adda Project Hub uses Supabase (PostgreSQL) with Row Level Security (RLS) enforced across all tables in the `public` schema.

## 1. Tables Overview

| Table | Primary Key | Description | Special Constraints |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` (references `auth.users`) | User profile information | Max 60 char `display_name`, E.164 `phone`, no college/branch stored |
| `user_roles` | `(user_id, role)` | System roles (`student`, `builder`, `admin`) | Managed strictly by service role; users cannot modify |
| `categories` | `id` (uuid) | Categorisation tags (branch, domain, tech, semester, scheme) | Unique `(kind, slug)` |
| `projects` | `id` (uuid) | Ready project kits sold in the catalogue | Slugs, course type check, prices in whole INR, tsvector GIN search |
| `project_categories` | `(project_id, category_id)` | Many-to-many relationship between projects and categories | Cascades on delete |
| `project_files` | `id` (uuid) | Deliverable files for kits (code, report, guide, viva, PPT) | Unique `storage_path`, size check, SHA-256 hash |
| `project_media` | `id` (uuid) | Screenshots and previews of kits | Required `alt_text`, display order |
| `orders` | `id` (uuid) | Kit purchases, custom requests, and mentoring orders | Unique `VPH-` 8-character code, integrity ack required |
| `order_items` | `id` (uuid) | Line items linked to orders | Exactly one of project, mentoring tier, or custom request |
| `payments` | `id` (uuid) | Manual UPI payment submissions and receipts | 12-digit UTR check, unique index on pending/paid UTRs |
| `download_grants` | `id` (uuid) | Entitlement records authorizing file downloads | Download count tracking with configurable ceiling |
| `download_log` | `id` (uuid) | Audit trail of downloaded files | Hashed IP (HMAC-SHA256) and timestamp |
| `custom_requests` | `id` (uuid) | Custom project build enquiries from students | Branch, semester, scheme, deadline, team size 1 to 4 |
| `request_files` | `id` (uuid) | Reference materials and deliverables for custom requests | Size limits, kind check |
| `milestones` | `id` (uuid) | Stepped deliverables for accepted custom requests | Position ordering, student input flags |
| `messages` | `id` (uuid) | In-context conversation between student, builder, and admin | Max 4000 chars, sender validation |
| `mentoring_tiers` | `id` (uuid) | Mentorship packages and session durations | Whole INR price, positive session count and minutes |
| `mentor_slots` | `id` (uuid) | Availability calendar slots for builders/mentors | PostgreSQL `btree_gist` exclusion constraint prevents overlap |
| `bookings` | `id` (uuid) | Scheduled mentoring sessions | Unique slot binding, validated meeting URL |
| `reviews` | `id` (uuid) | Verified student feedback on purchased projects | Unique `(user_id, project_id)`, rating 1 to 5, max 2000 chars |
| `coupons` | `id` (uuid) | Promotional discount codes | Either percent off or fixed amount off; case-insensitive unique code |
| `coupon_redemptions`| `id` (uuid) | Single-use coupon redemption records | Unique `order_id` |
| `tickets` | `id` (uuid) | Support, deletion requests, and general tickets | Validated email, kind checks, max 5000 chars |
| `audit_log` | `id` (bigint identity) | Administrative audit log | Actor ID, action, entity name and id; no sensitive customer data |
| `site_settings` | `key` (text) | Key-value store for application settings (UPI details, timeouts) | Managed strictly by admin or service role |
| `rate_limits` | `key` (text) | Shared rate limiter storage | Window start timestamp, atomic request counter |

## 2. Row Level Security (RLS) Policy Matrix

All public schema tables have Row Level Security enabled and forced. Privileges are revoked by default from `anon` and `authenticated` and granted back strictly according to this matrix:

| Table | Anon | Authenticated (Student) | Builder | Admin (AAL2 Verified) | Service Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `profiles` | Denied | Select own, Update own (display_name, phone) | Select own, Update own | Select all | Full access |
| `user_roles` | Denied | Select own | Select own | Select all | Full access |
| `categories` | Select all | Select all | Select all | Select all | Full access |
| `projects` | Select `live` | Select `live` | Select `live` | Full access | Full access |
| `project_categories` | Select `live` | Select `live` | Select `live` | Full access | Full access |
| `project_media` | Select `live` | Select `live` | Select `live` | Full access | Full access |
| `project_files` | Denied | Denied (access via `project_file_summaries` view) | Denied | Full access | Full access |
| `orders` | Denied | Select own | Select own | Select all | Full access (writes via server) |
| `order_items` | Denied | Select own | Select own | Select all | Full access |
| `payments` | Denied | Select own | Select own | Select all | Full access (writes via server) |
| `download_grants` | Denied | Select own | Select own | Select all | Full access |
| `download_log` | Denied | Denied | Denied | Select all | Full access |
| `custom_requests` | Denied | Select own, Insert own (status `submitted`) | Select and Update assigned | Full access | Full access |
| `request_files` | Denied | Select own request files | Select assigned request files | Full access | Full access |
| `milestones` | Denied | Select own request milestones | Select and Update assigned | Full access | Full access |
| `messages` | Denied | Select and Insert own request | Select and Insert assigned | Full access | Full access |
| `mentoring_tiers` | Select `active`| Select `active` | Select `active` | Full access | Full access |
| `mentor_slots` | Denied | Select `open` | Manage own slots | Full access | Full access |
| `bookings` | Denied | Select own | Select mentored bookings | Full access | Full access |
| `reviews` | Select `approved`| Select `approved` & own; Insert if verified buyer | Select `approved` | Full access | Full access |
| `coupons` | Denied | Denied | Denied | Select all | Full access |
| `coupon_redemptions`| Denied | Denied | Denied | Select all | Full access |
| `tickets` | Denied | Select own, Insert own | Select own, Insert own | Full access | Full access |
| `audit_log` | Denied | Denied | Denied | Select all | Full access |
| `site_settings` | Denied | Denied | Denied | Select all | Full access |
| `rate_limits` | Denied | Denied | Denied | Select all | Full access |

## 3. Storage Buckets

| Bucket Name | Access | Max Size | Allowed Types | Delivery Route |
| :--- | :--- | :--- | :--- | :--- |
| `project-files` | Private | 200 MB | ZIP, PDF, PPTX, DOCX, TXT, MD | Short-lived signed URL generated after download grant verification |
| `payment-proofs`| Private | 3 MB | PNG, JPEG, WEBP | Short-lived signed URL for admin payment verification |
| `request-files` | Private | 200 MB | ZIP, PDF, DOCX, PPTX, PNG, JPEG, TXT | Short-lived signed URL for student/builder review |
| `public-media` | Public Read | 2 MB | WEBP | Direct CDN public URL |

Private buckets have no RLS policies for `anon` or `authenticated`. All access is mediated by the application server via the service role client and signed URLs with 60-second expiration.

## 4. Rate Limiting

The atomic PostgreSQL function `rate_limit_hit(p_key text, p_limit int, p_window_seconds int)` provides distributed rate limiting backed by the `public.rate_limits` table:
- Evaluates concurrency using row-level locking (`FOR UPDATE`).
- Automatically initializes or resets windows on expiry.
- Is executable strictly by the service role (`REVOKE` from `public, anon, authenticated`).
