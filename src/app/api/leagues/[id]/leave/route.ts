import { jsonError, jsonOk } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorised", 401);

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}
