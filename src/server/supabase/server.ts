import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/server/env";
import { isMockSupabase, mockSupabaseFetch } from "./mock-fetch";

export async function createClient() {
  const cookieStore = await cookies();
  const isMock = isMockSupabase(env.NEXT_PUBLIC_SUPABASE_URL);

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: isMock ? { fetch: mockSupabaseFetch } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored when middleware refreshes user sessions.
          }
        },
      },
    }
  );
}
