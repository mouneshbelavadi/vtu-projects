import * as React from "react";
import { notFound } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio";
import { FileInput } from "@/components/ui/file-input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type SystemStatus } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { DefinitionList } from "@/components/ui/definition-list";
import { Prose } from "@/components/ui/prose";
import { Toast } from "@/components/ui/toast";

export default function DesignPage() {
  // Production guard: strictly 404 in production environment
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const allStatuses: SystemStatus[] = [
    "awaiting_payment",
    "pending_verification",
    "paid",
    "rejected",
    "expired",
    "refunded",
    "cancelled",
    "submitted",
    "under_review",
    "quoted",
    "accepted",
    "in_progress",
    "awaiting_student",
    "delivered",
    "completed",
    "declined",
    "open",
    "held",
    "confirmed",
  ];

  return (
    <main id="main-content" className="mx-auto max-w-container px-4 py-12 sm:px-6">
      <header className="mb-12 border-b border-rule pb-6">
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
          Design System Showcase
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-2">
          Technical catalogue design system tokens and accessible primitives. Flat surfaces, 1 px
          rules, 6 px corner radius, and restricted motion transitions.
        </p>
      </header>

      {/* 1. BUTTONS */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">1. Buttons & Links</h2>
        <Card>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary (md)</Button>
            <Button variant="secondary">Secondary (md)</Button>
            <Button variant="quiet">Quiet (md)</Button>
            <Button variant="danger">Danger (md)</Button>
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Button variant="primary" size="sm">
              Primary (sm)
            </Button>
            <Button variant="secondary" size="sm">
              Secondary (sm)
            </Button>
            <Button variant="quiet" size="sm">
              Quiet (sm)
            </Button>
            <Button variant="danger" size="sm">
              Danger (sm)
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" isLoading loadingText="Saving order...">
              Loading
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <LinkButton href="#buttons" variant="primary">
              Link Button
            </LinkButton>
            <LinkButton href="#buttons" variant="secondary" size="sm">
              Link (sm)
            </LinkButton>
          </div>
        </Card>
      </section>

      {/* 2. FORM INPUTS */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">2. Form Controls</h2>
        <Card>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              id="demo-name"
              label="Student Name"
              helpText="Enter your display name or nickname"
              required
            >
              {(fieldProps) => <Input placeholder="e.g. Rahul Sharma" {...fieldProps} />}
            </FormField>

            <FormField
              id="demo-error"
              label="UPI Transaction Reference (UTR)"
              errorText="UTR must be exactly 12 digits"
              required
            >
              {(fieldProps) => <Input defaultValue="12345" {...fieldProps} />}
            </FormField>
          </div>

          <div className="mb-6">
            <FormField id="demo-textarea" label="Project Requirements Brief">
              {(fieldProps) => (
                <Textarea
                  placeholder="Describe the domain, scheme, and constraints..."
                  {...fieldProps}
                />
              )}
            </FormField>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField id="demo-select" label="Branch">
              {(fieldProps) => (
                <Select
                  id={fieldProps.id}
                  placeholder="Select engineering branch"
                  options={[
                    { value: "cse", label: "Computer Science & Engineering (CSE)" },
                    { value: "ise", label: "Information Science & Engineering (ISE)" },
                    { value: "aiml", label: "Artificial Intelligence & Machine Learning" },
                    { value: "ece", label: "Electronics & Communication Engineering" },
                  ]}
                />
              )}
            </FormField>

            <FileInput
              id="demo-file"
              label="Select payment screenshot"
              accept="image/png,image/jpeg,image/webp"
              maxSizeMb={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-rule pt-2 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">Checkboxes</span>
              <Checkbox
                id="check-terms"
                label="I agree to academic integrity terms"
                defaultChecked
              />
              <Checkbox id="check-disabled" label="Disabled option" disabled />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-ink">Course Type (Radio)</span>
              <RadioGroup
                name="courseType"
                defaultValue="mini"
                options={[
                  { value: "mini", label: "Mini Project (5th Sem)" },
                  { value: "major1", label: "Project Phase 1 (7th Sem)" },
                  { value: "major2", label: "Major Project Phase 2 (8th Sem)" },
                ]}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 3. BADGES & SYSTEM STATUS */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          3. Badges & System Statuses
        </h2>
        <Card>
          <div className="mb-6">
            <span className="mb-2 block text-sm font-medium text-ink">Base Badges</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="warn">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="success">Success</Badge>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">
              StatusBadges (All States)
            </span>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* 4. ALERTS */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">4. Alerts</h2>
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Information Notice">
            All kits include source code, setup guide, and viva questions for technical defence.
          </Alert>
          <Alert variant="warning" title="Payment Verification">
            Please allow up to 2 hours during business hours for UTR verification.
          </Alert>
          <Alert variant="error" title="Submission Rejected">
            The submitted UTR did not match the bank credit record. Please verify and resubmit.
          </Alert>
          <Alert variant="success" title="Payment Confirmed">
            Your order has been verified. Download grants are now active in your account.
          </Alert>
        </div>
      </section>

      {/* 5. TABLE */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">5. Responsive Table</h2>
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Code</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell label="Order Code" className="font-mono">
                  VPH-8K92L1M4
                </TableCell>
                <TableCell label="Item">Hospital Management System Kit</TableCell>
                <TableCell label="Amount">
                  <Price amountInr={4999} />
                </TableCell>
                <TableCell label="Status">
                  <StatusBadge status="paid" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell label="Order Code" className="font-mono">
                  VPH-3B77P9Q2
                </TableCell>
                <TableCell label="Item">IoT Smart Irrigation System</TableCell>
                <TableCell label="Amount">
                  <Price amountInr={6499} />
                </TableCell>
                <TableCell label="Status">
                  <StatusBadge status="pending_verification" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell label="Order Code" className="font-mono">
                  VPH-1X55R8T0
                </TableCell>
                <TableCell label="Item">Custom Deep Learning Classifier</TableCell>
                <TableCell label="Amount">
                  <Price amountInr={12000} />
                </TableCell>
                <TableCell label="Status">
                  <StatusBadge status="in_progress" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* 6. TABS & DIALOG */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">6. Tabs & Modal Dialog</h2>
        <Card>
          <div className="mb-8">
            <Tabs
              defaultValue="included"
              items={[
                {
                  value: "included",
                  label: "What is included",
                  content: (
                    <p className="text-sm text-ink-2">
                      Complete source code, step-by-step installation instructions, viva Q&A pack,
                      and project report format.
                    </p>
                  ),
                },
                {
                  value: "stack",
                  label: "Tech Stack",
                  content: (
                    <p className="text-sm text-ink-2">
                      Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Python backend
                      microservice.
                    </p>
                  ),
                },
                {
                  value: "viva",
                  label: "Viva Defence",
                  content: (
                    <p className="text-sm text-ink-2">
                      50 curated examiner questions with explanations covering architecture,
                      database indexing, and API security.
                    </p>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex items-center justify-between border-t border-rule pt-4">
            <span className="text-sm text-ink-2">Accessible modal dialogue trigger</span>
            <Dialog
              title="Academic Integrity Policy"
              description="Please review our policy on project usage and college compliance."
              trigger={<Button variant="secondary">Open Policy Dialog</Button>}
            >
              <div className="space-y-3 text-sm text-ink-2">
                <p>
                  All project kits and codebases are provided for reference, structured learning,
                  and guided customization.
                </p>
                <p>
                  Students are required to thoroughly understand the implementation and defend the
                  code during institutional viva examinations.
                </p>
              </div>
            </Dialog>
          </div>
        </Card>
      </section>

      {/* 7. DEFINITION LIST & PROSE */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          7. Specification List & Prose Scale
        </h2>
        <Card className="mb-6">
          <DefinitionList
            items={[
              { term: "Course Scheme", description: "VTU 2022 / 2021 Scheme" },
              { term: "Eligible Semesters", description: "5th, 6th, and 7th Semester" },
              {
                term: "Deliverable Format",
                description: "Zip Archive (.zip), Documentation (.pdf)",
              },
              { term: "Download Limit", description: "5 attempts per verified purchase" },
            ]}
          />
        </Card>

        <Card>
          <Prose>
            <h2>Sample Technical Documentation</h2>
            <p>
              The system utilizes role-based access control and strict parameter validation on all
              state-changing endpoints. Database operations execute under PostgreSQL Row Level
              Security policies.
            </p>
            <ul>
              <li>HMAC-SHA256 salted IP address hashing</li>
              <li>Per-request CSP nonces with strict script containment</li>
              <li>Transactional state machine transitions for payment verification</li>
            </ul>
          </Prose>
        </Card>
      </section>

      {/* 8. NAVIGATION, EMPTY STATE & PRICE */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          8. Breadcrumbs, Pagination, Empty State & Prices
        </h2>
        <Card className="space-y-8">
          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Breadcrumbs</span>
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Projects", href: "/projects" },
                { label: "Computer Science", href: "/projects?branch=cse" },
                { label: "Hospital Management Kit" },
              ]}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Price Formats</span>
            <div className="flex items-baseline gap-6">
              <Price amountInr={4999} />
              <Price amountInr={3999} originalAmountInr={5499} />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Pagination</span>
            <Pagination currentPage={2} totalPages={5} buildHref={(p) => `#page-${p}`} />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Empty State</span>
            <EmptyState
              message="No project kits match the selected semester filters."
              action={
                <Button variant="secondary" size="sm">
                  Reset filters
                </Button>
              }
            />
          </div>
        </Card>
      </section>

      {/* 9. CONFIRMATION TOAST */}
      <section className="mb-14">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          9. Confirmation Toast Notification
        </h2>
        <Card>
          <p className="mb-4 text-sm text-ink-2">
            Toast component anchored with role=&quot;status&quot;:
          </p>
          <Toast message="Order details copied to clipboard." />
        </Card>
      </section>
    </main>
  );
}
