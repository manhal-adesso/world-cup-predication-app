"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { MatchTime } from "@/components/match-time";
import type { MatchRow } from "@/types/database";

interface Props {
  matches: MatchRow[];
}

export function ResultsTable({ matches }: Props) {
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Kickoff</Th>
          <Th>Match</Th>
          <Th className="w-24">Home</Th>
          <Th className="w-24">Away</Th>
          <Th className="w-32 text-right">Action</Th>
        </Tr>
      </THead>
      <TBody>
        {matches.map((m) => (
          <ResultRow key={m.id} match={m} />
        ))}
      </TBody>
    </Table>
  );
}

function ResultRow({ match }: { match: MatchRow }) {
  const router = useRouter();
  const [home, setHome] = React.useState<string>(match.actual_home_score?.toString() ?? "");
  const [away, setAway] = React.useState<string>(match.actual_away_score?.toString() ?? "");
  const [penaltyHome, setPenaltyHome] = React.useState<string>(match.penalty_home_score?.toString() ?? "");
  const [penaltyAway, setPenaltyAway] = React.useState<string>(match.penalty_away_score?.toString() ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const finished = match.status === "finished";
  const scoresEqual = home !== "" && away !== "" && Number(home) === Number(away);
  const showPenaltyInputs = !finished && scoresEqual;

  async function save() {
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        matchId: match.id,
        homeScore: Number(home),
        awayScore: Number(away),
      };
      if (showPenaltyInputs) {
        body.penaltyHomeScore = Number(penaltyHome);
        body.penaltyAwayScore = Number(penaltyAway);
      }
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const bodyRes = await res.json();
      if (!res.ok) throw new Error(bodyRes.error ?? "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Tr>
      <Td className="text-sm text-muted-foreground"><MatchTime kickoffTime={match.kickoff_time} /></Td>
      <Td>
        <div className="font-medium">{match.home_team} vs {match.away_team}</div>
        <div className="flex items-center gap-2 mt-1">
          {finished && <Badge variant="success" className="gap-1"><Check className="h-3 w-3" />Scored</Badge>}
          {finished && match.penalty_home_score != null && match.penalty_away_score != null && (
            <span className="text-xs text-muted-foreground">
              (Penalties: {match.penalty_home_score}-{match.penalty_away_score})
            </span>
          )}
        </div>
        {error && <div className="text-xs text-destructive mt-1">{error}</div>}
      </Td>
      <Td>
        <div className="space-y-1">
          <Input type="number" min={0} max={30} value={home} onChange={(e) => setHome(e.target.value)} />
          {showPenaltyInputs && (
            <div className="pt-1 border-t border-dashed">
              <Label className="text-[10px] text-muted-foreground">Penalty</Label>
              <Input type="number" min={0} max={30} value={penaltyHome} onChange={(e) => setPenaltyHome(e.target.value)} className="h-8 text-xs" />
            </div>
          )}
        </div>
      </Td>
      <Td>
        <div className="space-y-1">
          <Input type="number" min={0} max={30} value={away} onChange={(e) => setAway(e.target.value)} />
          {showPenaltyInputs && (
            <div className="pt-1 border-t border-dashed">
              <Label className="text-[10px] text-muted-foreground">Penalty</Label>
              <Input type="number" min={0} max={30} value={penaltyAway} onChange={(e) => setPenaltyAway(e.target.value)} className="h-8 text-xs" />
            </div>
          )}
        </div>
      </Td>
      <Td className="text-right">
        <Button size="sm" onClick={save} disabled={submitting || home === "" || away === "" || (showPenaltyInputs && (penaltyHome === "" || penaltyAway === ""))}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </Td>
    </Tr>
  );
}
