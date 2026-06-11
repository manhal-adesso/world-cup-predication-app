import { ZodError } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLeagueSchema } from "@/lib/validations";

async function generateUniqueInviteCode(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<string> {
  // Use the SQL helper and retry on the (very unlikely) collision.
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.rpc("gen_invite_code");
    if (error || !data) throw new Error(error?.message ?? "Failed to generate code");
    const code = data as unknown as string;
    const { data: existing } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();
    if (!existing) return code;
  }
  throw new Error("Could not generate unique invite code");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorised", 401);

  // Only admins can create leagues.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return jsonError("Only admins can create leagues", 403);
  }

  let parsed;
  try {
    parsed = createLeagueSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  const inviteCode = await generateUniqueInviteCode(supabase);

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({ name: parsed.name, owner_id: user.id, invite_code: inviteCode })
    .select()
    .single();

  if (error || !league) return jsonError(error?.message ?? "Could not create league", 400);

  // Auto-join the owner.
  const { error: joinErr } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });
  if (joinErr && !joinErr.message.includes("duplicate")) {
    return jsonError(joinErr.message, 400);
  }

  return jsonOk({ league });
}
