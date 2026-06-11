import { ZodError, z } from "zod";

import { handleZodError, jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  isAdmin: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorised", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return jsonError("Forbidden", 403);

  const { id } = await params;
  if (id === user.id) return jsonError("You cannot change your own admin status", 400);

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    return jsonError("Invalid JSON body");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ is_admin: parsed.isAdmin })
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk({ profile: data });
}
