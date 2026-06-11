import { ZodError, z } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const matchCreateSchema = z.object({
  homeTeam: z.string().trim().min(2).max(60),
  awayTeam: z.string().trim().min(2).max(60),
  kickoffTime: z.string().datetime({ message: "kickoffTime must be ISO-8601" }),
});

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
    parsed = matchCreateSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("matches")
    .insert({
      home_team: parsed.homeTeam,
      away_team: parsed.awayTeam,
      kickoff_time: parsed.kickoffTime,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk({ match: data });
}
