import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { env, getServiceRoleKey } from "@/lib/env";

/**
 * Per-request Supabase client bound to the user's session cookie.
 * Use in Server Components, Route Handlers, and Server Actions.
 *
 * NOTE: We construct via @supabase/ssr (for cookie handling) but cast to
 * SupabaseClient<Database> so the typed `.from(...)` queries work correctly.
 * The ssr package's own generic is incompatible with the newer postgrest-js
 * shape installed transitively.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll() may be called from a Server Component during render where
          // mutating cookies is not allowed. Safe to ignore - middleware refreshes.
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Service-role client. Bypasses RLS — use only from trusted server code
 * (route handlers / server actions) after enforcing your own authz checks.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(env.SUPABASE_URL, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
