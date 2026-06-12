import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatKickoff } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminPredictionsPage() {
  const admin = createSupabaseAdminClient();

  const { data: predictions } = await admin
    .from("predictions")
    .select(`
      id,
      predicted_winner,
      predicted_home_score,
      predicted_away_score,
      points_awarded,
      created_at,
      user_id,
      match_id,
      profiles!predictions_user_id_fkey(display_name),
      matches!predictions_match_id_fkey(home_team, away_team, kickoff_time, actual_home_score, actual_away_score, status)
    `)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Predictions ({predictions?.length ?? 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {!predictions || predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No predictions have been submitted yet.</p>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>User</Th>
                <Th>Match</Th>
                <Th>Prediction</Th>
                <Th>Result</Th>
                <Th className="text-right">Points</Th>
              </Tr>
            </THead>
            <TBody>
              {predictions.map((p) => {
                const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                const match = Array.isArray(p.matches) ? p.matches[0] : p.matches;
                if (!profile || !match) return null;
                const hasResult = match.actual_home_score !== null && match.actual_away_score !== null;
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium">{profile.display_name}</Td>
                    <Td>
                      <div className="text-sm">
                        {match.home_team} vs {match.away_team}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatKickoff(match.kickoff_time)}</div>
                    </Td>
                    <Td className="tabular-nums">
                      {p.predicted_home_score}-{p.predicted_away_score}
                    </Td>
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
  );
}
