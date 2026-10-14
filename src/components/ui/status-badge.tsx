import * as React from "react";
import { Badge, type BadgeVariant } from "./badge";

export type SystemStatus =
  // Payment & Order statuses
  | "awaiting_payment"
  | "pending_verification"
  | "paid"
  | "rejected"
  | "expired"
  | "refunded"
  | "cancelled"
  // Custom request statuses
  | "submitted"
  | "under_review"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "awaiting_student"
  | "delivered"
  | "completed"
  | "declined"
  // Mentoring & booking statuses
  | "open"
  | "held"
  | "booked"
  | "confirmed"
  // Project statuses
  | "draft"
  | "live"
  | "hidden";

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

const statusMap: Record<SystemStatus, StatusConfig> = {
  // Orders & payments
  awaiting_payment: { label: "Awaiting payment", variant: "warn" },
  pending_verification: { label: "Pending verification", variant: "warn" },
  paid: { label: "Paid", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  expired: { label: "Expired", variant: "default" },
  refunded: { label: "Refunded", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "default" },

  // Projects
  draft: { label: "Draft", variant: "default" },
  live: { label: "Live", variant: "success" },
  hidden: { label: "Hidden", variant: "warn" },

  // Custom requests
  submitted: { label: "Submitted", variant: "accent" },
  under_review: { label: "Under review", variant: "accent" },
  quoted: { label: "Quoted", variant: "accent" },
  accepted: { label: "Accepted", variant: "success" },
  in_progress: { label: "In progress", variant: "accent" },
  awaiting_student: { label: "Awaiting student", variant: "warn" },
  delivered: { label: "Delivered", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  declined: { label: "Declined", variant: "danger" },

  // Bookings & slots
  open: { label: "Open", variant: "default" },
  held: { label: "Held", variant: "warn" },
  booked: { label: "Booked", variant: "accent" },
  confirmed: { label: "Confirmed", variant: "success" },
};

export interface StatusBadgeProps {
  status: SystemStatus;
  className?: string;
}

/**
 * StatusBadge mapping all domain entity states into accessible typed tokens.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusMap[status] || { label: status, variant: "default" };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
