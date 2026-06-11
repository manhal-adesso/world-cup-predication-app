import { ZodError } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { joinLeagueSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorised", 401);

  let parsed;
  try {
    parsed = joinLeagueSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  // RLS hides leagues you don't belong to, but join-by-code needs a narrow
  // lookup. Use the service-role client *only* for that specific read; the
  // membership write still goes through the user-scoped client (RLS enforces
  // user_id = auth.uid()).
  const admin = createSupabaseAdminClient();

  const { data: league, error: lookupErr } = await admin
    .from("leagues")
    .select("id, name, invite_code")
    .eq("invite_code", parsed.inviteCode)
    .maybeSingle();

  if (lookupErr) return jsonError(lookupErr.message, 400);
  if (!league)   return jsonError("Invalid invite code", 404);

  const { error: insertErr } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (insertErr) {
    if (insertErr.message.includes("duplicate")) {
      return jsonOk({ league, alreadyMember: true });
    }
    return jsonError(insertErr.message, 400);
  }

  return jsonOk({ league, alreadyMember: false });
}
