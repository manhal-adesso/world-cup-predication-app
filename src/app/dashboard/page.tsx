import Link from "next/link";
import { ArrowRight, Trophy, Users, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocked } from "@/lib/time";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const nowIso = new Date().toISOString();

  const [
    { data: upcoming },
    { data: predictions },
    { data: leagues },
    { data: rankRow },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .gt("kickoff_time", nowIso)
      .order("kickoff_time", { ascending: true })
      .limit(5),
    supabase
      .from("predictions")
      .select("match_id, predicted_home_score, predicted_away_score, points_awarded")
      .eq("user_id", session.userId),
    supabase
      .from("league_members")
      .select("league_id, leagues(name, invite_code)")
      .eq("user_id", session.userId)
      .limit(5),
    supabase
      .from("global_leaderboard")
      .select("rank")
      .eq("id", session.userId)
      .maybeSingle(),
  ]);

  const predByMatch = new Map(
    (predictions ?? []).map((p) => [p.match_id, p])
  );

  return (
    <div className="container space-y-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Welcome back, {session.profile.display_name}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across the tournament.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Total points"
          value={session.profile.total_points.toString()}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Global rank"
          value={rankRow ? `#${rankRow.rank}` : "—"}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Leagues joined"
          value={(leagues?.length ?? 0).toString()}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming matches</h2>
          <Button asChild variant="link">
            <Link href="/matches">All matches <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {upcoming && upcoming.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming matches.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your leagues</h2>
          <Button asChild variant="link">
            <Link href="/leagues">Manage leagues <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {leagues && leagues.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((row) => {
              const league = Array.isArray(row.leagues) ? row.leagues[0] : row.leagues;
              if (!league) return null;
              return (
                <Card key={row.league_id}>
                  <CardHeader>
                    <CardTitle className="text-base">{league.name}</CardTitle>
                    <CardDescription>
                      Code <Badge variant="outline" className="ml-1 font-mono">{league.invite_code}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/leagues/${row.league_id}`}>Open</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t joined any leagues yet.{" "}
            <Link href="/leagues" className="text-primary hover:underline">Create or join one →</Link>
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
