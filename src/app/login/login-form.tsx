"use client";

import { useActionState, useState } from "react";
import { requestLoginCode, verifyLoginCode } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { createBrowserClientInstance } from "@/lib/supabase/browser";

interface LoginFormProps {
  nextTarget: string;
}

export function LoginForm({ nextTarget }: LoginFormProps) {
  const [requestState, requestAction, isRequestPending] = useActionState(
    requestLoginCode,
    { status: "idle" }
  );

  const [verifyState, verifyAction, isVerifyPending] = useActionState(
    verifyLoginCode,
    { status: "idle" }
  );

  const [manualEmail, setManualEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const activeEmail = requestState.email || manualEmail;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const supabase = createBrowserClientInstance();
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(
        nextTarget
      )}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setGoogleError("Unable to connect with Google. Try using an email code.");
        setGoogleLoading(false);
      }
    } catch {
      setGoogleError("Unable to start Google sign-in. Try using an email code.");
      setGoogleLoading(false);
    }
  }

  return (
    <Card className="p-6 md:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink font-serif">Sign in to your account</h1>
          <p className="mt-1 text-sm text-ink-2">
            Enter your email to receive a 6-digit access code, or continue with Google.
          </p>
        </div>

        {googleError && (
          <Alert variant="error" title="Sign-in failed">
            {googleError}
          </Alert>
        )}

        {/* Google OAuth Button */}
        <div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            isLoading={googleLoading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-rule" />
          <span className="absolute bg-surface px-3 text-xs uppercase tracking-wide text-ink-3">
            Or sign in with email
          </span>
        </div>

        {/* Step 1: Request OTP Code */}
        {requestState.status !== "success" ? (
          <form action={requestAction} className="space-y-4">
            {requestState.status === "error" && (
              <Alert variant="error" title="Request failed">
                {requestState.message}
              </Alert>
            )}

            <FormField
              id="email"
              label="Email address"
              helpText="We will send a 6-digit code to this address."
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isRequestPending}
            >
              Send 6-digit code
            </Button>
          </form>
        ) : (
          /* Step 2: Verify OTP Code */
          <form action={verifyAction} className="space-y-4">
            <Alert variant="success" title="Code sent">
              {requestState.message}
            </Alert>

            {verifyState.status === "error" && (
              <Alert variant="error" title="Verification failed">
                {verifyState.message}
              </Alert>
            )}

            <input type="hidden" name="email" value={activeEmail} />
            <input type="hidden" name="next" value={nextTarget} />

            <FormField
              id="code"
              label="6-digit code"
              helpText={`Enter the code sent to ${activeEmail}`}
            >
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                className="font-mono text-center tracking-widest text-lg"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isVerifyPending}
            >
              Verify code and sign in
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs text-ink-2 underline hover:text-ink"
              >
                Use a different email address
              </button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
