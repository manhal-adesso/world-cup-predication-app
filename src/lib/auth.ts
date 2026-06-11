import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: ProfileRow;
}

/**
 * Returns the current user + profile, or redirects to /login if unauthenticated.
 * Use from Server Components / route handlers that require an authed user.
 */
export async function requireSession(
  redirectTo: string = "/login"
): Promise<SessionContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectTo);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Profile should be created by the auth trigger; if not, sign the user out.
    await supabase.auth.signOut();
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? null, profile };
}

/** Like requireSession but also enforces admin role. */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.profile.is_admin) {
    redirect("/dashboard");
  }
  return session;
}

/** Soft variant: returns null if not authed. */
export async function getOptionalSession(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { userId: user.id, email: user.email ?? null, profile };
}
