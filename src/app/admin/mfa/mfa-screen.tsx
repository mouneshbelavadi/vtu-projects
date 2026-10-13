"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClientInstance } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export function MfaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function initMfa() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserClientInstance();

      try {
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === "aal2") {
          router.push("/admin");
          return;
        }

        const { data: factors, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          setError(factorsError.message);
          setLoading(false);
          return;
        }

        const verifiedFactor = factors?.totp?.find(
          (f) => f.status === "verified"
        );

        if (verifiedFactor) {
          // Existing factor: challenge it
          setFactorId(verifiedFactor.id);
          setIsEnrolling(false);
        } else {
          // No factor: enroll new TOTP
          setIsEnrolling(true);
          const { data: enrollData, error: enrollError } =
            await supabase.auth.mfa.enroll({
              factorType: "totp",
              issuer: "VTU Adda Projects",
            });

          if (enrollError) {
            setError(enrollError.message);
            setLoading(false);
            return;
          }

          setFactorId(enrollData.id);
          setQrCodeSvg(enrollData.totp.qr_code);
          setSecret(enrollData.totp.secret);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during MFA initialization."
        );
      } finally {
        setLoading(false);
      }
    }

    initMfa();
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;

    setSubmitting(true);
    setError(null);

    const supabase = createBrowserClientInstance();
    try {
      const { error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code,
        });

      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Try again."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-2">Checking two-factor status...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink font-serif">
            {isEnrolling
              ? "Enrol Two-Factor Authenticator"
              : "Two-Factor Verification"}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {isEnrolling
              ? "Scan the QR code with your authenticator app (Google Authenticator, 1Password, etc.) and enter the code."
              : "Enter the 6-digit code from your authenticator app to access the admin panel."}
          </p>
        </div>

        {error && (
          <Alert variant="error" title="Authentication error">
            {error}
          </Alert>
        )}

        {isEnrolling && (
          <div className="space-y-4">
            {qrCodeSvg && (
              <div className="flex justify-center p-4 bg-surface border border-rule">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSvg)}`}
                  alt="Two-factor authentication QR code"
                  width={200}
                  height={200}
                  className="h-48 w-48"
                />
              </div>
            )}

            {secret && (
              <div className="bg-paper p-3 border border-rule">
                <span className="block text-xs uppercase tracking-wider text-ink-3 font-mono">
                  Setup key (Secret)
                </span>
                <span className="font-mono text-sm font-medium text-ink break-all select-all">
                  {secret}
                </span>
                <p className="mt-1 text-xs text-ink-2">
                  Store this secret key securely in your password manager for recovery.
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <FormField
            id="mfa-code"
            label="Verification code"
            helpText="Enter the 6-digit code from your authenticator app"
          >
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              className="font-mono text-center tracking-widest text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={submitting}
            disabled={code.length !== 6}
          >
            {isEnrolling ? "Verify and save factor" : "Verify code"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
