// Centralized database status unions and table interfaces for VTU Adda Project Hub

export const USER_ROLES = ["student", "builder", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CATEGORY_KINDS = ["branch", "domain", "tech", "semester", "scheme"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const COURSE_TYPES = [
  "mini_project",
  "project_phase_1",
  "major_project_phase_2",
  "capstone",
  "hackathon_project",
  "other",
] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PROJECT_STATUSES = ["draft", "live", "hidden"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_FILE_KINDS = [
  "code",
  "report",
  "ppt",
  "setup_guide",
  "viva_qa",
  "other",
] as const;
export type ProjectFileKind = (typeof PROJECT_FILE_KINDS)[number];

export const ORDER_TYPES = ["kit", "custom", "mentoring"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "awaiting_payment",
  "pending_verification",
  "paid",
  "rejected",
  "expired",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["manual_upi"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "awaiting_payment",
  "pending_verification",
  "paid",
  "rejected",
  "expired",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CUSTOM_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "quoted",
  "accepted",
  "in_progress",
  "delivered",
  "completed",
  "declined",
  "cancelled",
] as const;
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];

export const REQUEST_FILE_KINDS = ["student_reference", "deliverable"] as const;
export type RequestFileKind = (typeof REQUEST_FILE_KINDS)[number];

export const MILESTONE_STATUSES = [
  "pending",
  "in_progress",
  "awaiting_student",
  "done",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MENTOR_SLOT_STATUSES = ["open", "held", "booked", "cancelled"] as const;
export type MentorSlotStatus = (typeof MENTOR_SLOT_STATUSES)[number];

export const BOOKING_STATUSES = [
  "awaiting_payment",
  "pending_verification",
  "confirmed",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const TICKET_KINDS = ["support", "deletion_request", "other"] as const;
export type TicketKind = (typeof TICKET_KINDS)[number];

export const TICKET_STATUSES = ["open", "answered", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface Profile {
  id: string;
  display_name: string;
  phone: string | null;
  updated_at: string;
  created_at: string;
}

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  kind: CategoryKind;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  course_type: CourseType;
  difficulty: Difficulty;
  tech_stack: string[];
  price_inr: number;
  sales_limit: number | null;
  sales_window_start: string;
  status: ProjectStatus;
  cover_path: string | null;
  demo_video_url: string | null;
  syllabus_note: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface ProjectCategory {
  project_id: string;
  category_id: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  kind: ProjectFileKind;
  storage_path: string;
  original_name: string;
  size_bytes: number;
  content_type: string;
  sha256: string | null;
  version: number;
  created_at: string;
}

export interface ProjectFileSummary {
  id: string;
  project_id: string;
  kind: ProjectFileKind;
  original_name: string;
  size_bytes: number;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  user_id: string;
  type: OrderType;
  status: OrderStatus;
  subtotal_inr: number;
  discount_inr: number;
  total_inr: number;
  coupon_id: string | null;
  ack_integrity: boolean;
  expires_at: string;
  updated_at: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  project_id: string | null;
  mentoring_tier_id: string | null;
  request_id: string | null;
  label: string;
  price_inr: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount_inr: number;
  status: PaymentStatus;
  utr: string | null;
  proof_path: string | null;
  proof_deleted_at: string | null;
  submitted_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  reject_reason: string | null;
  attempt: number;
  refund_amount_inr: number | null;
  refund_reference: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface DownloadGrant {
  id: string;
  order_id: string;
  user_id: string;
  project_id: string;
  max_downloads: number;
  download_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface DownloadLog {
  id: string;
  grant_id: string;
  file_id: string;
  ip_hash: string;
  created_at: string;
}

export interface CustomRequest {
  id: string;
  user_id: string;
  title: string;
  brief: string;
  branch: string;
  semester: number;
  scheme: string;
  course_type: CourseType;
  tech_pref: string | null;
  deadline: string;
  budget_inr: number | null;
  team_size: number;
  status: CustomRequestStatus;
  assigned_builder_id: string | null;
  quote_total_inr: number | null;
  quote_deposit_inr: number | null;
  quote_note: string | null;
  quote_valid_until: string | null;
  declined_reason: string | null;
  ack_integrity: boolean;
  updated_at: string;
  created_at: string;
}

export interface RequestFile {
  id: string;
  request_id: string;
  uploaded_by: string;
  kind: RequestFileKind;
  storage_path: string;
  original_name: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  request_id: string;
  position: number;
  title: string;
  description: string | null;
  due_date: string | null;
  needs_student_input: boolean;
  student_input_text: string | null;
  status: MilestoneStatus;
  created_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface MentoringTier {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  session_count: number;
  session_minutes: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface MentorSlot {
  id: string;
  mentor_id: string;
  starts_at: string;
  ends_at: string;
  status: MentorSlotStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  tier_id: string;
  slot_id: string;
  order_id: string;
  status: BookingStatus;
  meet_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  project_id: string;
  order_id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off_inr: number | null;
  max_redemptions: number | null;
  redeemed_count: number;
  valid_from: string;
  valid_to: string | null;
  active: boolean;
  created_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string | null;
  email: string;
  kind: TicketKind;
  subject: string;
  body: string;
  status: TicketStatus;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
}

export interface RateLimit {
  key: string;
  window_start: string;
  count: number;
}
