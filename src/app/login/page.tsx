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
    <div className="mx-auto max-w-md py-12 px-4 sm:px-6">
      <LoginForm nextTarget={safeNext} />
    </div>
  );
}
