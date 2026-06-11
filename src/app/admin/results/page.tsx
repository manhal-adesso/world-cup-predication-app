import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsTable } from "./results-table";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const admin = createSupabaseAdminClient();
  const { data: matches } = await admin
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter results</CardTitle>
        <CardDescription>
          Saving a result automatically scores every prediction and updates user totals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResultsTable matches={matches ?? []} />
      </CardContent>
    </Card>
  );
}
