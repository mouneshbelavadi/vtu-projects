"use client";

import { useState, useEffect } from "react";
import { submitSupportTicketAction } from "@/server/tickets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, Send, RotateCcw } from "lucide-react";

interface ContactFormProps {
  initialEmail?: string;
  initialName?: string;
}

export function ContactForm({
  initialEmail = "",
  initialName = "",
}: ContactFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [orderCode, setOrderCode] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [renderedAt, setRenderedAt] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    setRenderedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (subject.trim().length < 3) {
      setErrorMessage("Subject must be at least 3 characters long.");
      return;
    }
    if (message.trim().length < 10) {
      setErrorMessage("Message must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitSupportTicketAction({
        name,
        email,
        subject,
        message,
        orderCode: orderCode.trim() || undefined,
        renderedAt,
        honeypot,
      });

      if (!result.success) {
        setErrorMessage(
          result.errorMessage || "Failed to submit support request."
        );
      } else {
        setTicketId(result.ticketId || "submitted");
        setMessage("");
        setSubject("");
        setOrderCode("");
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticketId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div
          role="alert"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-950 shadow-xs flex items-start gap-3.5"
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-base text-emerald-950 font-heading">
              Message Received
            </h3>
            <p className="mt-1 leading-relaxed text-emerald-900 text-xs sm:text-sm">
              Your support request has been logged. We have sent a confirmation email to{" "}
              <span className="font-semibold">{email}</span>.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-paper p-5 sm:p-6 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <strong className="text-xs font-bold uppercase tracking-wider text-ink-3">
              Ticket ID:
            </strong>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
              {ticketId}
            </span>
          </div>
          <p className="text-xs text-ink-2 leading-relaxed">
            Our support team reviews tickets during business hours and typically replies within 24 to 48 hours.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setTicketId(null);
            setRenderedAt(Date.now());
          }}
          className="font-semibold gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Send another message</span>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <Alert variant="error" title="Could not submit">
          {errorMessage}
        </Alert>
      )}

      {/* Anti-bot Honeypot field (hidden off-screen) */}
      <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="hp_contact_url">Leave this empty</label>
        <input
          id="hp_contact_url"
          type="text"
          name="hp_contact_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField id="contact-name" label="Your name">
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            maxLength={100}
            required
            className="h-12"
          />
        </FormField>

        <FormField id="contact-email" label="Email address">
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. student@example.com"
            maxLength={255}
            required
            className="h-12"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <FormField id="contact-subject" label="Subject">
            <Input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question regarding Python IoT kit installation"
              maxLength={120}
              required
              className="h-12"
            />
          </FormField>
        </div>

        <div>
          <FormField
            id="contact-order-code"
            label="Order Code (optional)"
            helpText="If relating to a purchase"
          >
            <Input
              id="contact-order-code"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="e.g. VPH-ABCDEF12"
              maxLength={50}
              className="h-12 font-mono uppercase"
            />
          </FormField>
        </div>
      </div>

      <FormField
        id="contact-message"
        label="Message"
        helpText="Please describe your query in detail (maximum 3000 characters)."
      >
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          rows={6}
          maxLength={3000}
          required
          className="leading-relaxed"
        />
      </FormField>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full sm:w-auto font-semibold px-8 gap-2 shadow-md hover:shadow-indigo-500/25"
        >
          <Send className="h-4 w-4" />
          <span>Send support request</span>
        </Button>
      </div>
    </form>
  );
}
