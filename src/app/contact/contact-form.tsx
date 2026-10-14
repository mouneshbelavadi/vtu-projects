"use client";

import { useState, useEffect } from "react";
import { submitSupportTicketAction } from "@/server/tickets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

interface ContactFormProps {
  initialEmail?: string;
  initialName?: string;
}

export function ContactForm({ initialEmail = "", initialName = "" }: ContactFormProps) {
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
        setErrorMessage(result.errorMessage || "Failed to submit support request.");
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
      <Card className="p-6 border-rule bg-surface">
        <div className="space-y-4">
          <Alert variant="success" title="Message Received">
            Your support request has been logged. We have sent a confirmation email to {email}.
          </Alert>
          <div className="bg-paper p-4 rounded-md border border-rule text-sm space-y-1">
            <p>
              <strong>Ticket ID:</strong> <span className="font-mono text-xs">{ticketId}</span>
            </p>
            <p className="text-ink-2 text-xs">
              Our support team reviews tickets during business hours and typically replies within 24 to 48 hours.
            </p>
          </div>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              setTicketId(null);
              setRenderedAt(Date.now());
            }}
          >
            Send another message
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-rule bg-surface">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="contact-name" label="Your name">
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              maxLength={100}
              required
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
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <FormField id="contact-subject" label="Subject">
              <Input
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question regarding Python IoT kit installation"
                maxLength={120}
                required
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
            rows={5}
            maxLength={3000}
            required
          />
        </FormField>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Send support request
          </Button>
        </div>
      </form>
    </Card>
  );
}
