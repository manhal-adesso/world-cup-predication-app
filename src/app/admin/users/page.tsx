import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "./users-table";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({users?.length ?? 0})</CardTitle>
        <CardDescription>Toggle admin role for other users.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable users={users ?? []} currentUserId={session.userId} />
      </CardContent>
    </Card>
  );
}
