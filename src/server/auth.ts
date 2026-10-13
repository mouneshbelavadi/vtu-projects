import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import { AppError } from "@/server/errors";
import type { UserRole, Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  user: User;
  profile: Profile | null;
  roles: UserRole[];
}

/**
 * Retrieves the currently authenticated user safely using getUser().
 * Never trusts unverified client-side session data.
 */
export async function getUserOrNull(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch user profile and roles
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);

    const roles: UserRole[] = ["student"];
    if (rolesRes.data) {
      for (const r of rolesRes.data) {
        if (!roles.includes(r.role as UserRole)) {
          roles.push(r.role as UserRole);
        }
      }
    }

    return {
      user,
      profile: (profileRes.data as Profile) || null,
      roles,
    };
  } catch {
    return null;
  }
}

/**
 * Requires a signed-in user. Redirects to /login if unauthenticated.
 */
export async function requireUser(nextPath = "/"): Promise<AuthenticatedUser> {
  const authUser = await getUserOrNull();
  if (!authUser) {
    const safeNext = encodeURIComponent(nextPath);
    redirect(`/login?next=${safeNext}`);
  }
  return authUser;
}

/**
 * Requires a user with a specific role.
 */
export async function requireRole(
  requiredRole: UserRole,
  nextPath = "/"
): Promise<AuthenticatedUser> {
  const authUser = await requireUser(nextPath);

  if (requiredRole === "student") {
    return authUser;
  }

  if (!authUser.roles.includes(requiredRole)) {
    throw new AppError("Access denied: insufficient permissions", "FORBIDDEN", 403);
  }

  return authUser;
}

/**
 * Requires an admin user with verified Two-Factor Authentication (AAL2).
 * If the user is not admin, throws 403.
 * If the session is not at AAL2, redirects to /admin/mfa.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const authUser = await requireUser("/admin");

  if (!authUser.roles.includes("admin")) {
    throw new AppError("Access denied: administrator role required", "FORBIDDEN", 403);
  }

  const supabase = await createClient();
  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError || !aalData || aalData.currentLevel !== "aal2") {
    redirect("/admin/mfa");
  }

  return authUser;
}

/**
 * Requires a builder user with verified Two-Factor Authentication (AAL2).
 * If the user is not builder, throws 403.
 * If the session is not at AAL2, redirects to /admin/mfa.
 */
export async function requireBuilder(nextPath = "/builder"): Promise<AuthenticatedUser> {
  const authUser = await requireRole("builder", nextPath);

  const supabase = await createClient();
  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError || !aalData || aalData.currentLevel !== "aal2") {
    redirect("/admin/mfa");
  }

  return authUser;
}

