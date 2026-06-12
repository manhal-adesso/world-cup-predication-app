/**
 * Admin endpoint to record a match result.
 * The route explicitly sets winner/status and recomputes scores,
 * so the leaderboard updates immediately without relying solely on DB triggers.
 */
import { ZodError } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { matchResultSchema } from "@/lib/validations";
import { deriveWinner } from "@/lib/scoring";

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

  // Derive winner and status explicitly so the result is correct even if
  // the BEFORE trigger on matches is not installed. DB triggers will also
  // set these, but being explicit ensures correctness.
  const winner = deriveWinner(parsed.homeScore, parsed.awayScore);

  const { data: match, error } = await admin
    .from("matches")
    .update({
      actual_home_score: parsed.homeScore,
      actual_away_score: parsed.awayScore,
      winner,
      status: "finished",
    })
    .eq("id", parsed.matchId)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  if (!match) return jsonError("Match not found", 404);

  // Explicitly recompute scores. The DB trigger should also do this, but
  // calling directly ensures the leaderboard updates even if the trigger
  // is not installed or fails silently.
  const { error: rpcError } = await admin.rpc("recompute_match_scores", {
    p_match_id: parsed.matchId,
  });
  if (rpcError) {
    console.error("recompute_match_scores RPC error:", rpcError);
  }

  return jsonOk({ match });
}
