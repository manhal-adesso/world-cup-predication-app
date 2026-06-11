/**
 * Admin endpoint to record a match result.
 * The DB triggers automatically:
 *   - derive `winner` from the scores
 *   - mark `status = finished`
 *   - recompute `points_awarded` on every prediction
 *   - recompute `total_points` on affected profiles
 *
 * So this route is intentionally thin.
 */
import { ZodError } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { matchResultSchema } from "@/lib/validations";

async function ensureAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: jsonError("Unauthorised", 401) } as const;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { error: jsonError("Forbidden", 403) } as const;
  return { user } as const;
}

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  let parsed;
  try {
    parsed = matchResultSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  const admin = createSupabaseAdminClient();
  const { data: match, error } = await admin
    .from("matches")
    .update({
      actual_home_score: parsed.homeScore,
      actual_away_score: parsed.awayScore,
    })
    .eq("id", parsed.matchId)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  if (!match) return jsonError("Match not found", 404);

  return jsonOk({ match });
}
