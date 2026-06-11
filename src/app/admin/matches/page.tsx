import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatKickoff } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const admin = createSupabaseAdminClient();
  const { data: matches } = await admin
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  return (
    <Card>
      <CardHeader><CardTitle>Matches ({matches?.length ?? 0})</CardTitle></CardHeader>
      <CardContent>
        {!matches || matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet. Import an ICS file to get started.</p>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Kickoff</Th>
                <Th>Match</Th>
                <Th>Status</Th>
                <Th className="text-right">Result</Th>
              </Tr>
            </THead>
            <TBody>
              {matches.map((m) => (
                <Tr key={m.id}>
                  <Td className="text-sm text-muted-foreground">{formatKickoff(m.kickoff_time)}</Td>
                  <Td className="font-medium">{m.home_team} vs {m.away_team}</Td>
                  <Td><Badge variant="outline" className="capitalize">{m.status}</Badge></Td>
                  <Td className="text-right tabular-nums">
                    {m.actual_home_score !== null && m.actual_away_score !== null
                      ? `${m.actual_home_score} - ${m.actual_away_score}`
                      : "—"}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
