import { redirect } from "next/navigation";
import { getUserOrNull } from "@/server/auth";
import { validateSafeRedirect } from "@/server/security/redirect";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your VTU Adda Project Hub account.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const safeNext = validateSafeRedirect(next, "/");

  const authUser = await getUserOrNull();
  if (authUser) {
    redirect(safeNext);
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-surface-2/40 via-surface to-surface-2/30 overflow-hidden">
      {/* Ambient gradient mesh background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-10 -z-10 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl"
      />

      <div className="w-full max-w-md sm:max-w-lg">
        <LoginForm nextTarget={safeNext} />
      </div>
    </div>
  );
}
