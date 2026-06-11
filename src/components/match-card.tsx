import Link from "next/link";
import { Clock, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoff } from "@/lib/time";
import type { MatchRow } from "@/types/database";

interface MatchCardProps {
  match: MatchRow;
  locked: boolean;
  prediction?: { home: number; away: number; points?: number } | null;
}

export function MatchCard({ match, locked, prediction }: MatchCardProps) {
  const finished = match.status === "finished";

  return (
    <Card className="transition hover:border-primary/50">
      <Link href={`/matches/${match.id}`} className="block">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatKickoff(match.kickoff_time)}
            </span>
            <StatusBadge status={match.status} locked={locked} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 truncate font-medium">{match.home_team}</span>
            <span className="text-lg font-bold tabular-nums">
              {finished
                ? `${match.actual_home_score} - ${match.actual_away_score}`
                : "vs"}
            </span>
            <span className="flex-1 truncate text-right font-medium">{match.away_team}</span>
          </div>

          {prediction ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Your prediction:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {prediction.home}-{prediction.away}
                </span>
              </span>
              {typeof prediction.points === "number" && finished ? (
                <Badge variant={prediction.points > 0 ? "success" : "secondary"}>
                  {prediction.points} pts
                </Badge>
              ) : null}
            </div>
          ) : !locked ? (
            <span className="text-xs text-primary">Make a prediction →</span>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}

function StatusBadge({ status, locked }: { status: MatchRow["status"]; locked: boolean }) {
  if (status === "finished") return <Badge variant="secondary">Finished</Badge>;
  if (status === "live")     return <Badge variant="destructive">Live</Badge>;
  if (status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
  if (locked)                return <Badge variant="warning" className="gap-1"><Lock className="h-3 w-3" />Locked</Badge>;
  return <Badge>Open</Badge>;
}
