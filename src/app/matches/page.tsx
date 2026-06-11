import { MatchCard } from "@/components/match-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocked } from "@/lib/time";

export const metadata = { title: "Matches" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("match_id, predicted_home_score, predicted_away_score, points_awarded")
    .eq("user_id", session.userId);

  const predByMatch = new Map((predictions ?? []).map((p) => [p.match_id, p]));

  const now = new Date();
  const upcoming = (matches ?? []).filter((m) => new Date(m.kickoff_time) > now);
  const past     = (matches ?? []).filter((m) => new Date(m.kickoff_time) <= now);

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming matches.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((m) => {
                    const p = predByMatch.get(m.id);
                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        locked={isLocked(m.kickoff_time)}
                        prediction={p ? { home: p.predicted_home_score, away: p.predicted_away_score, points: p.points_awarded } : null}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="past">
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past matches yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {past.map((m) => {
                    const p = predByMatch.get(m.id);
                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        locked
                        prediction={p ? { home: p.predicted_home_score, away: p.predicted_away_score, points: p.points_awarded } : null}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
