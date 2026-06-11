import { ZodError } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { predictionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Unauthorised", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  let parsed;
  try {
    parsed = predictionSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    throw err;
  }

  // Upsert by (user_id, match_id). DB triggers enforce the 5-min lock and the
  // winner-score consistency constraint; RLS ensures user_id = auth.uid().
  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: parsed.matchId,
        predicted_winner: parsed.predictedWinner,
        predicted_home_score: parsed.predictedHomeScore,
        predicted_away_score: parsed.predictedAwayScore,
      },
      { onConflict: "user_id,match_id" }
    )
    .select()
    .single();

  if (error) {
    // Postgres lock trigger raises a friendly message.
    if (error.message?.includes("locked")) return jsonError(error.message, 423);
    if (error.message?.includes("Winner must match")) return jsonError(error.message, 422);
    return jsonError(error.message, 400);
  }

  return jsonOk({ prediction: data });
}
