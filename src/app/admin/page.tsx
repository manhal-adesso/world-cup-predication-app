import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = createSupabaseAdminClient();

  const [
    { count: userCount },
    { count: matchCount },
    { count: predictionCount },
    { count: pendingMatches },
    { count: leagueCount },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("matches").select("*", { count: "exact", head: true }),
    admin.from("predictions").select("*", { count: "exact", head: true }),
    admin.from("matches").select("*", { count: "exact", head: true }).neq("status", "finished"),
    admin.from("leagues").select("*", { count: "exact", head: true }),
  ]);

  const items = [
    { label: "Users",                value: userCount ?? 0 },
    { label: "Matches",              value: matchCount ?? 0 },
    { label: "Pending matches",      value: pendingMatches ?? 0 },
    { label: "Predictions submitted", value: predictionCount ?? 0 },
    { label: "Leagues",              value: leagueCount ?? 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">{it.label}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{it.value}</div></CardContent>
        </Card>
      ))}
    </div>
  );
}
