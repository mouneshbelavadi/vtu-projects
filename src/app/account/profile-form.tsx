"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { Profile } from "@/types/database";

interface ProfileFormProps {
  email: string;
  initialProfile: Profile | null;
}

export function ProfileForm({ email, initialProfile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, {
    status: "idle",
  });

  return (
    <Card className="p-6 md:p-8">
      <form action={formAction} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-ink font-display">Account Profile</h2>
          <p className="mt-1 text-sm text-ink-2">
            Update your display name and optional contact phone number.
          </p>
        </div>

        {state.status === "success" && (
          <Alert variant="success" title="Success">
            {state.message}
          </Alert>
        )}

        {state.status === "error" && (
          <Alert variant="error" title="Error">
            {state.message}
          </Alert>
        )}

        <FormField
          id="email"
          label="Email address"
          helpText="Your login email cannot be changed here."
        >
          <Input
            id="email"
            type="email"
            disabled
            value={email}
            className="bg-paper cursor-not-allowed opacity-80"
          />
        </FormField>

        <FormField
          id="display_name"
          label="Display name"
          helpText="A name or nickname (up to 60 characters)."
        >
          <Input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={60}
            defaultValue={initialProfile?.display_name || ""}
            placeholder="Your name"
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone number (optional)"
          helpText="Used only for urgent milestone updates. Format: +91 followed by 10 digits."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialProfile?.phone || ""}
            placeholder="+919876543210"
          />
        </FormField>

        <div className="pt-2">
          <Button type="submit" variant="primary" isLoading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
