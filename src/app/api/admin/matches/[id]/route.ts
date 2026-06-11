import { ZodError, z } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const matchUpdateSchema = z.object({
  homeTeam: z.string().trim().min(2).max(60).optional(),
  awayTeam: z.string().trim().min(2).max(60).optional(),
  kickoffTime: z.string().datetime().optional(),
  status: z.enum(["scheduled", "live", "finished", "cancelled"]).optional(),
});

async function ensureAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: jsonError("Unauthorised", 401) } as const;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { error: jsonError("Forbidden", 403) } as const;
  return { user } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  let parsed;
  try {
    parsed = matchUpdateSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("matches")
    .update({
      ...(parsed.homeTeam   ? { home_team: parsed.homeTeam } : {}),
      ...(parsed.awayTeam   ? { away_team: parsed.awayTeam } : {}),
      ...(parsed.kickoffTime ? { kickoff_time: parsed.kickoffTime } : {}),
      ...(parsed.status     ? { status: parsed.status } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk({ match: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("matches").delete().eq("id", id);
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}
