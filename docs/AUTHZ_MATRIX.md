# Authorization Matrix: VTU Adda Project Hub

This document defines the exact access control matrix for every page route, route handler, and server action in the project.

### Caller Roles
1. **Signed-out Visitor (`GUEST`)**: Unauthenticated user.
2. **Student A (`OWNER`)**: Authenticated student who owns the specific record/order/request.
3. **Student B (`OTHER`)**: Authenticated student attempting to access Student A's record/order/request.
4. **Builder Assigned (`BUILDER_ASSIGNED`)**: Authenticated builder assigned to the request or session.
5. **Builder Not Assigned (`BUILDER_UNASSIGNED`)**: Authenticated builder not assigned to the specific item.
6. **Admin without MFA (`ADMIN_NO_MFA`)**: Authenticated user with `admin` role at AAL1 (no TOTP verified).
7. **Admin with MFA (`ADMIN_MFA`)**: Authenticated user with `admin` role at AAL2 (TOTP verified).

---

## 1. Page Routes

| Route | GUEST | OWNER | OTHER | BUILDER_ASSIGNED | BUILDER_UNASSIGNED | ADMIN_NO_MFA | ADMIN_MFA |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/projects` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/projects/[slug]` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/projects/branch/[slug]` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/projects/semester/[number]` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/projects/type/[slug]` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/mentoring` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/mentoring/book/[tierId]` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/how-it-works` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/contact` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/academic-integrity` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/refund` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/privacy` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/terms` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/login` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/logout` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` |
| `/auth/callback` | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 |
| `/checkout/start` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/checkout/[orderId]` | 302 -> `/login` | 200 | 404 | 404 | 404 | 200 | 200 |
| `/request` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/account` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/account/orders` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/account/orders/[id]` | 302 -> `/login` | 200 | 404 | 404 | 404 | 200 | 200 |
| `/account/orders/[id]/slip` | 302 -> `/login` | 200 | 404 | 404 | 404 | 200 | 200 |
| `/account/requests` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/account/requests/[id]` | 302 -> `/login` | 200 | 404 | 404 | 404 | 200 | 200 |
| `/account/bookings` | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| `/builder` | 302 -> `/login` | 403 / 302 | 403 / 302 | 200 | 200 | 200 | 200 |
| `/builder/sessions` | 302 -> `/login` | 403 / 302 | 403 / 302 | 200 | 200 | 200 | 200 |
| `/builder/requests/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 200 | 403 / 404 | 200 | 200 |
| `/admin` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/mfa` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 200 (enroll) | 200 |
| `/admin/projects` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/projects/new` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/projects/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/categories` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/orders` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/orders/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/payments` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/payments/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/requests` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/requests/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/mentoring` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/tickets` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/reviews` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/users/[id]` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/settings` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |
| `/admin/audit` | 302 -> `/login` | 403 / 302 | 403 / 302 | 403 / 302 | 403 / 302 | 302 -> `/admin/mfa` | 200 |

---

## 2. API Route Handlers

| Route Handler | GUEST | OWNER | OTHER | BUILDER_ASSIGNED | BUILDER_UNASSIGNED | ADMIN_NO_MFA | ADMIN_MFA |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET /api/orders/[id]/download/[fileId]` | 401 | 200 / 302 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 200 / 302 |
| `GET /api/orders/[id]/licence` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 200 |
| `GET /api/requests/[id]/download/[fileId]` | 401 | 200 / 302 | 404 / 403 | 200 / 302 | 404 / 403 | 403 | 200 / 302 |
| `GET /api/account/export` | 401 | 200 (Self) | 200 (Self) | 200 (Self) | 200 (Self) | 200 (Self) | 200 (Self) |
| `GET /api/cron/expire-orders` | 401* | 401* | 401* | 401* | 401* | 401* | 401* |
| `GET /api/cron/session-reminders` | 401* | 401* | 401* | 401* | 401* | 401* | 401* |
| `GET /api/cron/purge-proofs` | 401* | 401* | 401* | 401* | 401* | 401* | 401* |

*\*Requires `Authorization: Bearer <CRON_SECRET>` header.*

---

## 3. Server Actions

| Server Action | GUEST | OWNER | OTHER | BUILDER_ASSIGNED | BUILDER_UNASSIGNED | ADMIN_NO_MFA | ADMIN_MFA |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `createOrderAction` | 401 | 200 | 200 | 200 | 200 | 200 | 200 |
| `submitPaymentAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `resubmitPaymentAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `createCustomRequestAction` | 401 | 200 | 200 | 200 | 200 | 200 | 200 |
| `acceptQuoteAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `submitRequestMessageAction` | 401 | 200 | 404 / 403 | 200 | 404 / 403 | 403 | 200 |
| `uploadMilestoneFileAction` | 401 | 403 | 403 | 200 | 404 / 403 | 403 | 200 |
| `approveMilestoneAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `holdSlotAction` | 401 | 200 | 200 | 200 | 200 | 200 | 200 |
| `confirmBookingAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `cancelBookingStudentAction` | 401 | 200 | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `updateMentorMeetingLinkAction` | 401 | 403 | 403 | 200 | 404 / 403 | 403 | 200 |
| `submitSupportTicketAction` | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `submitReviewAction` | 401 | 200 (Paid & dl) | 404 / 403 | 404 / 403 | 404 / 403 | 403 | 404 / 403 |
| `requestAccountDeletionAction` | 401 | 200 | 200 | 200 | 200 | 200 | 200 |
| `approvePaymentAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `rejectPaymentAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `recordRefundAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `updateTicketAdminAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `moderateReviewAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `anonymiseAccountAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `generateSlotsAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `updateBookingMeetingLinkAdminAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `cancelBookingAdminAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
| `updateSiteSettingsAction` | 401 | 403 | 403 | 403 | 403 | 403 (MFA req) | 200 |
