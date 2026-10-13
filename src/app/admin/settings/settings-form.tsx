"use client";

import { useActionState } from "react";
import { updateGeneralSettings, updateUpiSettings } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { SystemSettings } from "@/server/settings";

interface SettingsFormProps {
  initialSettings: SystemSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [generalState, generalAction, isGeneralPending] = useActionState(
    updateGeneralSettings,
    { status: "idle" }
  );

  const [upiState, upiAction, isUpiPending] = useActionState(
    updateUpiSettings,
    { status: "idle" }
  );

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Card 1: UPI Details (TOTP Guarded) */}
      <Card className="p-6 md:p-8">
        <form action={upiAction} className="space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-ink">
              UPI Payment Details
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Customers scan this UPI VPA for payments. Any changes require two-factor confirmation.
            </p>
          </div>

          {upiState.status === "success" && (
            <Alert variant="success" title="Success">
              {upiState.message}
            </Alert>
          )}

          {upiState.status === "error" && (
            <Alert variant="error" title="Failed">
              {upiState.message}
            </Alert>
          )}

          <FormField
            id="upi_payee_name"
            label="UPI Payee Name"
            helpText="The legal name shown on the UPI bank account."
          >
            <Input
              id="upi_payee_name"
              name="upi_payee_name"
              type="text"
              required
              defaultValue={initialSettings.upi_payee_name}
              placeholder="VTU Adda Projects"
            />
          </FormField>

          <FormField
            id="upi_vpa"
            label="UPI VPA (Virtual Payment Address)"
            helpText="The UPI ID to receive customer payments (e.g. merchant@okaxis)."
          >
            <Input
              id="upi_vpa"
              name="upi_vpa"
              type="text"
              required
              defaultValue={initialSettings.upi_vpa}
              placeholder="merchant@handle"
            />
          </FormField>

          <div className="border-t border-rule pt-4 bg-paper p-4 rounded-md space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-warn-text block">
              Two-Factor Authorization Required
            </span>

            <FormField
              id="totp_code"
              label="Current TOTP Code"
              helpText="Enter the 6-digit code from your authenticator app to authorize this change."
            >
              <Input
                id="totp_code"
                name="totp_code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="123456"
                className="font-mono text-center tracking-widest text-lg max-w-[200px]"
              />
            </FormField>
          </div>

          <Button type="submit" variant="primary" isLoading={isUpiPending}>
            Save UPI details
          </Button>
        </form>
      </Card>

      {/* Card 2: Operational Settings */}
      <Card className="p-6 md:p-8">
        <form action={generalAction} className="space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-ink">
              Operational Defaults
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Order expiration, download entitlement limits, and payment screenshot retention.
            </p>
          </div>

          {generalState.status === "success" && (
            <Alert variant="success" title="Success">
              {generalState.message}
            </Alert>
          )}

          {generalState.status === "error" && (
            <Alert variant="error" title="Failed">
              {generalState.message}
            </Alert>
          )}

          <FormField
            id="order_expiry_hours"
            label="Order Expiry (Hours)"
            helpText="Time window for students to complete payment before order expires (1 to 72 hours, default 24)."
          >
            <Input
              id="order_expiry_hours"
              name="order_expiry_hours"
              type="number"
              min={1}
              max={72}
              required
              defaultValue={initialSettings.order_expiry_hours}
            />
          </FormField>

          <FormField
            id="max_downloads_default"
            label="Default Max Downloads"
            helpText="Maximum downloads permitted per purchased project grant (1 to 20, default 5)."
          >
            <Input
              id="max_downloads_default"
              name="max_downloads_default"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={initialSettings.max_downloads_default}
            />
          </FormField>

          <FormField
            id="proof_retention_days"
            label="Proof Retention Period (Days)"
            helpText="Number of days before payment screenshot images are automatically purged (1 to 365)."
          >
            <Input
              id="proof_retention_days"
              name="proof_retention_days"
              type="number"
              min={1}
              max={365}
              required
              defaultValue={initialSettings.proof_retention_days ?? ""}
              placeholder="e.g. 90"
            />
          </FormField>

          <Button type="submit" variant="secondary" isLoading={isGeneralPending}>
            Save operational settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
