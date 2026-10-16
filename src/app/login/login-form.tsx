"use client";

import { useActionState, useState } from "react";
import { requestLoginCode, verifyLoginCode, loginWithTestCredentials } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { createBrowserClientInstance } from "@/lib/supabase/browser";
import { GraduationCap, ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";

interface LoginFormProps {
  nextTarget: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
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

  const [testState, testAction, isTestPending] = useActionState(
    loginWithTestCredentials,
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
    <div className="rounded-3xl border border-rule/80 bg-surface/90 backdrop-blur-md p-6 sm:p-10 shadow-2xl shadow-indigo-500/5 transition-all">
      <div className="space-y-6">
        {/* Brand Mark and Title */}
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/10">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink font-heading">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-ink-2 leading-relaxed">
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
            className="w-full h-12 rounded-xl font-semibold gap-3 border border-rule/90 hover:border-rule-strong shadow-xs active:scale-[0.99] transition-all"
            isLoading={googleLoading}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </Button>
        </div>

        {/* Or Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-rule" />
          <span className="absolute bg-surface px-3 text-xs uppercase tracking-wider text-ink-3 font-semibold">
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
                className="h-12 rounded-xl px-4 text-sm sm:text-base focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold shadow-md hover:shadow-indigo-500/25 active:scale-[0.99] transition-all gap-2"
              isLoading={isRequestPending}
            >
              <Mail className="h-4 w-4" />
              <span>Send 6-digit code</span>
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
                className="h-14 font-mono text-center tracking-[0.4em] sm:tracking-[0.5em] text-2xl font-extrabold rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 shadow-xs"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold shadow-md hover:shadow-indigo-500/25 active:scale-[0.99] transition-all gap-2"
              isLoading={isVerifyPending}
            >
              <KeyRound className="h-4 w-4" />
              <span>Verify code and sign in</span>
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-semibold text-accent hover:text-indigo-800 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Use a different email address
              </button>
            </div>
          </form>
        )}

        {/* Or Test Account Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-rule" />
          <span className="absolute bg-surface px-3 text-xs uppercase tracking-wider text-ink-3 font-semibold">
            Or use test account
          </span>
        </div>

        {/* Hardcoded Test Admin Section */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Testing Credentials
            </span>
            <span className="text-[11px] font-mono font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              Hardcoded Ready
            </span>
          </div>

          <p className="text-xs text-ink-2 leading-relaxed">
            Ready for testing the admin panel without email setup. Sign in with the pre-filled admin credentials below.
          </p>

          {testState.status === "error" && (
            <Alert variant="error" title="Sign-in failed">
              {testState.message}
            </Alert>
          )}

          <form action={testAction} className="space-y-3">
            <input type="hidden" name="next" value={nextTarget} />

            <div className="space-y-1">
              <label htmlFor="test-email" className="block text-xs font-semibold text-ink">
                Admin Email
              </label>
              <Input
                id="test-email"
                name="email"
                type="email"
                required
                defaultValue="admin@vtuadda.com"
                className="h-10 rounded-xl px-3 font-mono text-xs focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="test-password" className="block text-xs font-semibold text-ink">
                Admin Password
              </label>
              <Input
                id="test-password"
                name="password"
                type="password"
                required
                defaultValue="admin123"
                className="h-10 rounded-xl px-3 font-mono text-xs focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full h-11 rounded-xl font-semibold shadow-md hover:shadow-indigo-500/25 active:scale-[0.99] transition-all gap-2"
              isLoading={isTestPending}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Sign in as Admin (Test Account)</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
