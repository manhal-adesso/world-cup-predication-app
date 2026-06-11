import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatKickoff } from "@/lib/time";

export const metadata = { title: "My predictions" };
export const dynamic = "force-dynamic";

export default async function MyPredictionsPage() {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      id,
      predicted_winner,
      predicted_home_score,
      predicted_away_score,
      points_awarded,
      matches (
        id,
        home_team,
        away_team,
        kickoff_time,
        actual_home_score,
        actual_away_score,
        status
      )
    `)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>My predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {!predictions || predictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t made any predictions yet.{" "}
              <Link href="/matches" className="text-primary hover:underline">Find a match →</Link>
            </p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Match</Th>
                  <Th>Kickoff</Th>
                  <Th>Prediction</Th>
                  <Th>Result</Th>
                  <Th className="text-right">Points</Th>
                </Tr>
              </THead>
              <TBody>
                {predictions.map((p) => {
                  const match = Array.isArray(p.matches) ? p.matches[0] : p.matches;
                  if (!match) return null;
                  const hasResult = match.actual_home_score !== null && match.actual_away_score !== null;
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <Link href={`/matches/${match.id}`} className="font-medium hover:underline">
                          {match.home_team} vs {match.away_team}
                        </Link>
                      </Td>
                      <Td className="text-sm text-muted-foreground">{formatKickoff(match.kickoff_time)}</Td>
                      <Td className="tabular-nums">{p.predicted_home_score}-{p.predicted_away_score}</Td>
                      <Td className="tabular-nums">
                        {hasResult ? `${match.actual_home_score}-${match.actual_away_score}` : "—"}
                      </Td>
                      <Td className="text-right">
                        {hasResult ? (
                          <Badge variant={p.points_awarded > 0 ? "success" : "secondary"}>
                            {p.points_awarded}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
