import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/env";
import { isMockSupabase, mockSupabaseFetch } from "./mock-fetch";

export function createAdminClient() {
  const isMock = isMockSupabase(env.NEXT_PUBLIC_SUPABASE_URL);

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    global: isMock ? { fetch: mockSupabaseFetch } : undefined,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
