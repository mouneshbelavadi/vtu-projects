# VTU Adda Project Hub: Architecture

2026-10-12 · @Vinayak

VTU Adda Project Hub is a store on vtuadda.com where a VTU student in any semester or branch can buy a ready project kit, request a custom project for a quote, or book guided mentoring, all paid by UPI QR and verified by us.

## 1. Product definition

The free notes and question papers on vtuadda.com bring the traffic; the Project Hub turns a small share of it into paying customers. It has three paths, and every path ends in the same order, payment and delivery system.

| Path | What the student gets | Pricing | Who delivers |
| --- | --- | --- | --- |
| Project kit (pre-built) | Source code, setup guide, report template, PPT template, demo video, viva Q&A for that project | Fixed price per kit, set by admin | Download after we verify the payment |
| Custom project request | A project built or adapted to the student's topic, branch and scheme, with a written scope | Quote per request, paid in two parts | Our builder team, with milestones |
| Guided mentoring | Plan review, code walkthrough, report and presentation coaching, mock viva | Fixed tiers (hypotheses in the research report) | Our mentors, booked by slot |

Two design decisions come from the market research:

1. **Every kit is a learning pack, not just a zip.** It ships with a walkthrough and viva questions so the student can explain the work. This is our difference from vtuprojectshub.in, which looks like a plain download store, and it reduces the misconduct and brand risk the research flagged.
2. **Semester-aware catalogue.** Projects are tagged by branch, scheme (2018/2021/2022/2025), semester and course type (Mini Project, Project Phase I, Major Project Phase II, Capstone), so a 5th-sem student sees mini-project fit and a 7th-sem student sees major-project fit.

Prices are never hard-coded. The admin sets them per kit, per request and per mentoring tier, so we can test the research report's price hypotheses and change them without a new build.

## 2. Users and roles

Four roles are enough for the first release. Guests can browse; everything involving money or files needs a student account.

| Role | Who | Can do | Cannot do |
| --- | --- | --- | --- |
| Guest | Any visitor | Browse the catalogue, read kit pages and previews, read the blog | Buy, download, request |
| Student | Signed-up customer (email or Google login) | Buy kits, download purchased files, submit custom requests, accept quotes, pay, book mentoring, chat on an order, leave a review, see order history | See other students' orders |
| Builder / mentor | Our freelancers or team | See assigned requests and bookings, upload deliverables, update milestone status, message the student | Change prices, see all revenue |
| Admin | You | Everything: catalogue, pricing, quotes, orders, refunds, users, builders, content, settings | (none) |

A student account stores only an email, a display name and an optional phone number. Branch, semester and scheme are filters in the page address, so the site never asks for a student's college.

## 3. Site map and pages

The site has about 15 public and student pages and one admin area. Pages marked MVP ship in the first build.

| Page | URL | Purpose | Phase |
| --- | --- | --- | --- |
| Home | / | Value pitch, three paths, featured kits, how it works, trust strip, FAQ teaser | MVP |
| Catalogue | /projects | All kits with filters: branch, semester, scheme, course type, tech stack, price, difficulty; search and sort | MVP |
| Kit detail | /projects/[slug] | Description, what is included, tech stack, screenshots, demo video, syllabus fit, price, reviews, Buy and Ask buttons | MVP |
| Custom request | /request | Multi-step form: topic, branch, semester, scheme, tech preference, deadline, budget, team size, reference files | MVP |
| Mentoring | /mentoring | Tiers, what is covered, slot booking | MVP |
| Cart and checkout | /checkout | UPI QR with the exact amount, UTR and optional screenshot, coupon | MVP |
| Sign up and login | /login | Email OTP or Google | MVP |
| My account | /account | Profile with a display name and an optional phone number | MVP |
| My purchases | /account/purchases | Re-download files, invoices, setup help link | MVP |
| My requests | /account/requests | Status, quote, milestones, order chat, payment buttons | MVP |
| How it works and integrity policy | /how-it-works | The three paths, what we do and do not do, refund terms | MVP |
| Contact and support | /contact | WhatsApp button, email, ticket form | MVP |
| Policies | /terms, /privacy, /refund | Legal pages | MVP |
| Blog and guides | /blog | Project topic ideas, report format, viva tips; also feeds SEO | Phase 2 |
| Link to notes and papers | vtuadda.com | Existing free content, cross-linked both ways | MVP |
| Admin | /admin | See section 9 | MVP |

Category landing pages such as /projects/cse, /projects/mini-projects and /projects/5th-sem are generated from the catalogue filters, so they cost nothing extra and give us search pages for each semester.

## 4. Core user flows

A kit is bought in three steps and delivered at once; a custom request takes five steps over days; mentoring is booked and paid like a kit and held on a slot.

Only the custom-request path has two payments (deposit, then balance) and a back-and-forth with a builder. Each milestone in that path needs something from the student, which is how the guided build mode in section 10 is enforced.

## 5. Features by phase

The MVP is the smallest site that can take real money for all three paths. Anything that does not help a first paying student waits.

| Area | MVP | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| Catalogue | Filters by branch, semester, scheme, type, stack, price; search; kit pages with media | Compare kits, wishlist, "students also bought", bundle deals | Personalised recommendations from profile |
| Checkout | UPI QR with the exact amount, UTR and optional screenshot, admin approval, coupon codes, order slip | A payment gateway such as Razorpay behind the same payment interface, instant unlock, installments for large requests | Referral rewards paid as credit |
| Delivery | Protected download links that expire, re-download from account, purchase log | Versioned updates to a kit with email notice | In-browser preview of code and report |
| Custom requests | Form, admin quote, accept and pay deposit, milestone status, order chat, file uploads, final payment | Builder bidding, auto-estimates from past quotes | Fixed-price request templates |
| Mentoring | Tier pages, slot booking, payment, meeting link by email | Calendar sync, recorded session library | Group workshops by semester |
| Accounts | Email OTP and Google login, profile with a display name and an optional phone number | Team accounts for project groups | A parent view of order status, only when the student chooses to share it |
| Communication | Email receipts, WhatsApp click-to-chat, status emails | WhatsApp notifications through an official API | In-app notifications |
| Trust | Reviews after delivery, integrity policy, refund policy, FAQ | Verified-buyer badges, testimonials shown only with the student's permission | Public project showcases with student consent |
| Admin | Catalogue CRUD, payment verification queue, orders, quotes, builders, manual refunds, coupons, CSV export | Revenue and funnel dashboard, builder payouts | Role-based sub-admins |
| Growth | SEO landing pages, sitemap, schema markup, links from vtuadda.com | Blog, email newsletter, abandoned-cart email | Affiliate programme for student referrers |

## 6. Data model

The database is relational (PostgreSQL), because orders, payments and refunds must stay consistent. There are about 26 tables; the first five carry profiles and the catalogue and the rest carry money and work.

| Table | Key fields | Relates to |
| --- | --- | --- |
| profiles | id, display_name, phone (optional), created_at; roles sit in a separate user_roles table | one per auth user |
| projects | id, slug, title, summary, description, branch, semester_tags, scheme_tags, course_type, tech_stack, difficulty, price_inr, sales_limit, sales_window_start, status (draft, live, hidden), cover_url, demo_video_url | has many project_files, project_media, reviews |
| project_files | id, project_id, kind (code, report, ppt, setup_guide, viva_qa), storage_path, version | belongs to projects; private storage |
| project_media | id, project_id, type (screenshot, video), url, sort_order | belongs to projects |
| categories | id, name, slug, type (branch, domain, course_type) | tags on projects |
| orders | id, user_id, type (kit, custom, mentoring), status, subtotal_inr, discount_inr, gst_inr, total_inr, coupon_id, created_at | has many order_items, payments |
| order_items | id, order_id, project_id or mentoring_tier_id, price_inr | belongs to orders |
| payments | id, order_id, method (manual_upi), amount_inr, status, utr, proof_path (optional), proof_deleted_at, attempt, verified_by, verified_at, reject_reason, refund_amount_inr, refund_reference | belongs to orders |
| download_grants | id, user_id, project_id, order_id, expires_at, download_count, max_downloads, revoked_at | gates every file download |
| custom_requests | id, user_id, title, brief, branch, semester, scheme, tech_pref, deadline, budget_inr, team_size, status, assigned_builder_id, quote_inr, quote_note, deposit_paid | links to orders when quote accepted |
| milestones | id, request_id, title, due_date, status, deliverable_url, payment_share_pct | belongs to custom_requests |
| messages | id, request_id or order_id, sender_id, body, attachment_url, created_at | order chat |
| mentoring_tiers and bookings | tier: name, price_inr, sessions, scope; booking: user_id, tier_id, slot_start, slot_end, mentor_id, meet_link, status | tiers have many bookings |
| reviews, coupons, tickets, audit_log, site_settings, rate_limits | reviews: user_id, project_id, rating, text, verified_purchase; coupons: code, percent or amount, limits, expiry; tickets: user_id, subject, status | belong to users and projects |

Three rules protect the data:

- Row-level security on every table: a student can read only their own orders, grants, requests and messages.
- File storage is private. A file is never public; the server issues a short-lived signed link only when a valid download_grant exists.
- Prices are copied into order_items at purchase time, so a later price change never alters past orders.

## 7. System architecture and tech stack

One Next.js web app serves the public site, the student area and the admin panel, backed by Supabase, Resend email and a manual UPI payment step. The stack is mainstream and well documented, which suits building in Google Antigravity.

The browser never decides anything that involves money or files: the server calculates prices, records the UTR and any screenshot, waits for an admin to approve the payment, and signs the download links.

| Layer | Choice (assumed) | Why |
| --- | --- | --- |
| Front end and server | Next.js with React, TypeScript and Tailwind CSS | Server-rendered pages for SEO; one codebase for site, account area and admin |
| Hosting | Vercel | Deploys from GitHub, preview link for every change |
| Database, login, files | Supabase (PostgreSQL, Auth, Storage) | Relational data, row-level security and private storage in one service |
| Payments | Manual UPI QR now, behind a payment provider interface | No gateway or business KYC needed for the pilot; a gateway such as Razorpay can be added later without changing orders |
| Email | Resend | Transactional receipts and status emails |
| Analytics and search | Vercel Web Analytics (cookieless, optional) and Search Console | Funnel tracking and SEO monitoring |
| Code | GitHub repository | Version history; Antigravity works on the repo |

The stack choices are assumptions until you answer question 5 in section 12.

## 8. Payments, delivery and security

A payment counts only when an admin approves it against the bank record, never because the student's browser says so, and files unlock only after that approval.

**Payment flow (****manual UPI****)**

1. The server creates an order with the amount calculated on the server, never taken from the browser.
2. The student scans the UPI QR, which carries the exact amount and the order code.
3. The student enters the 12-digit UTR and may upload a screenshot; the order moves to Pending verification.
4. An admin matches the UTR and amount with the bank record and approves; the server then creates the download grants, sends the receipt email and shows the files in My purchases.
5. Refunds are sent manually from your bank app, recorded in the admin panel with a reference, and the grant is revoked.

Custom requests use two payments: a deposit when the quote is accepted and the balance when the final deliverable is ready, and the final files are released after the balance is verified. Mentoring is paid up front per tier. Payments sit behind a provider interface, so a gateway such as Razorpay can be added later without changing orders or downloads.

**File delivery and anti-piracy**

- Files sit in private storage. Download links are signed and expire in 60 seconds.
- Each grant allows a limited number of downloads (for example 5) and logs IP and time.
- Each purchase includes a licence slip stamped with the order code, and every download is logged, which lets us trace a leak.
- Demo videos and previews are public; code, reports and viva files are not.

**Security basics**

- HTTPS everywhere, secrets only in server environment variables, never in front-end code.
- Row-level security in the database, role checks on every admin route.
- Rate limits on login, OTP and download endpoints; file-type and size checks on uploads.
- No card data is handled; students pay in their own UPI app. A UTR can pay for only one order, and unpaid orders expire after 24 hours.
- Backups of the database daily, and a restore test before launch.

India-specific: GST invoices need our GSTIN once turnover crosses the threshold, and a DPDP-Act-style privacy notice must say what student data we hold. Confirm both, and whether to receive UPI payments in a business account, with a chartered accountant and a lawyer before launch; this document does not give legal advice.

## 9. Admin panel

The admin panel lets you run the business from a phone without touching code. It opens on a to-do view: what needs a quote, what is overdue, what was paid today.

| Module | What you do there |
| --- | --- |
| Dashboard | Today's orders and revenue, payments waiting for verification, pending quotes, overdue milestones, open tickets |
| Catalogue | Add or edit a kit: text, tags, price, cover, screenshots, demo video, upload code, report, PPT, setup guide, viva Q&A; draft, live or hidden |
| Custom requests | Review the brief, write the quote and note, assign a builder, track milestones, chat with the student |
| Orders and payments | Verification queue with the UTR and amount, and the screenshot when there is one; approve or reject with a reason; see every order; resend files; record manual refunds; print an order slip |
| Mentoring | Create tiers, set mentor availability, view bookings, add meeting links |
| Users | Search students, see their orders, block abusers, reset a download grant |
| Builders and mentors | Invite, assign roles, view workload, mark payouts done |
| Coupons and bundles | Create codes with limits and expiry |
| Reviews and tickets | Approve or hide reviews, answer support tickets |
| Content and settings | Home page blocks, FAQ, policy text, WhatsApp number, email templates, GST details |
| Export | CSV of orders, users and requests for accounting |

## 10. Academic integrity, legal and trust layer

The research report's verdict was PILOT with guided mentoring, and selling finished projects for direct submission was NO-GO. The site can still sell kits and take custom requests, but the product is built so it supports learning and not ghostwriting. The custom-request path carries the most risk, so it gets the strongest guardrails.

| Guardrail | How the product enforces it |
| --- | --- |
| Purpose statement | Home, kit pages and checkout say kits are for learning, reference and guided customisation, not for submission as one's own unmodified work |
| Acknowledgement at checkout | A required checkbox: the student will follow their college and VTU rules and will understand and explain the project |
| Understanding built in | Every kit includes a walkthrough, an architecture note, a viva Q&A set and a customisation checklist |
| Guided build mode | Custom requests run in milestones that need the student's input (topic approval, requirements, review sessions, a mock viva) before the final handover |
| No outcome promises | No "guaranteed marks" or "VTU approved" claims anywhere; the copy is reviewed before launch |
| Refusal rules | Admin can decline a request that is clearly an exam, lab-record or plagiarism job; the form says so up front |
| Licensing text | Terms state what the buyer may and may not do (no resale, no public re-upload), and the watermark supports this |
| Clean sources | Kits use original code or open-source code with its licence kept; no copied student or college projects |
| Student data | Optional phone numbers and order data are used only for service and support; we do not ask for a student's college; payment screenshots are optional and are deleted a set number of days after verification; a privacy notice and a deletion request route are live at launch |
| Refunds | A written policy: what is refundable (not delivered, not as described), what is not (file already downloaded and used) |

**SEO and the link to vtuadda.com.** Put the Project Hub on a sub-path or sub-domain of vtuadda.com (assumption, see open questions) so the free notes pages pass relevance and links to the project pages. Notes and question-paper pages show a "Projects for this semester" strip, and kit pages link back to the matching notes. Each category page gets its own title and description, and each kit gets Product structured data.

## 11. Build roadmap

I wrote twelve Antigravity prompts and one rules file in this order, one phase at a time; they are in the Antigravity Prompt Pack. You paste a prompt, test the result against the gate, and only then do I write the next prompt.

Each prompt will name the pages, tables, rules and edge cases it covers, and ends with a checklist you can test by hand. Phase 5 starts the pilot from the research report, so the 30-day validation runs on the real site.

## 12. Open questions

Ten answers would lock the architecture. For each one the default is what I will assume if you do not answer.

| # | Question | Default if unanswered |
| --- | --- | --- |
| 1 | Should the Project Hub live at a path like vtuadda.com/projects, a sub-domain like projects.vtuadda.com, or a new domain? | Sub-domain projects.vtuadda.com |
| 2 | What is vtuadda.com built on today (WordPress, Next.js, Blogger, other)? | Unknown; the Hub is a separate app linked from it |
| 3 | Who will make the kits and custom projects: you, a team, or freelancers? How many people at launch? | You plus 1 to 3 builders |
| 4 | How many kits can you list at launch, and in which branches first? | 15 to 20 kits, CSE, ISE and AI/ML first |
| 5 | Are you fine with this stack: Next.js, Supabase, Resend, hosted on Vercel, with manual UPI payments? | Yes |
| 6 | Which UPI ID and payee name will receive payments for now, and is it a personal or a business account? | Personal account for the pilot; move to a business account before volume grows |
| 7 | Custom requests: do you want guided build mode only (student takes part in milestones) or full build-for-hire? | Guided build mode, as the research advised |
| 8 | Should mentoring be in the first release, or after kits and custom requests work? | In the first release, simple tiers and manual slots |
| 9 | Login by email OTP and Google only, or also phone OTP (this costs SMS fees)? | Email OTP and Google only |
| 10 | Do you have a logo, colours and a look you want, or should the design match vtuadda.com? | Match vtuadda.com's current look |
