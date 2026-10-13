import { createBrowserClient } from "@supabase/ssr";

// Browser client using public anon key - used only for MFA enrollment and client-side auth challenges
export function createBrowserClientInstance() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
