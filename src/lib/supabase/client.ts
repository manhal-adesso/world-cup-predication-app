"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  return createBrowserClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  ) as unknown as SupabaseClient<Database>;
}
