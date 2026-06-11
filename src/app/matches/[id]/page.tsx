import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/countdown";
import { PredictionForm } from "@/components/prediction-form";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatKickoff } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!match) notFound();

  const { data: prediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", session.userId)
    .eq("match_id", id)
    .maybeSingle();

  const finished = match.status === "finished";

  return (
    <div className="container max-w-2xl py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/matches"><ArrowLeft className="h-4 w-4" /> Back to matches</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                {match.home_team} <span className="text-muted-foreground">vs</span> {match.away_team}
              </CardTitle>
              <CardDescription>Kickoff: {formatKickoff(match.kickoff_time)}</CardDescription>
            </div>
            <Countdown kickoffISO={match.kickoff_time} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {finished && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Final result</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">
                {match.actual_home_score} - {match.actual_away_score}
              </div>
              {prediction && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span>You predicted {prediction.predicted_home_score}-{prediction.predicted_away_score}.</span>
                  <Badge variant={prediction.points_awarded > 0 ? "success" : "secondary"}>
                    {prediction.points_awarded} pts
                  </Badge>
                </div>
              )}
            </div>
          )}

          <PredictionForm match={match} initial={prediction ?? null} />

          <p className="text-xs text-muted-foreground">
            Predictions lock 5 minutes before kickoff. +1 for correct winner, +3 for exact score.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
