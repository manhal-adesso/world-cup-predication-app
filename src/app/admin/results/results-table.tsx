"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { formatKickoff } from "@/lib/time";
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
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: Number(home),
          awayScore: Number(away),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const finished = match.status === "finished";

  return (
    <Tr>
      <Td className="text-sm text-muted-foreground">{formatKickoff(match.kickoff_time)}</Td>
      <Td>
        <div className="font-medium">{match.home_team} vs {match.away_team}</div>
        {finished && <Badge variant="success" className="mt-1 gap-1"><Check className="h-3 w-3" />Scored</Badge>}
        {error && <div className="text-xs text-destructive">{error}</div>}
      </Td>
      <Td>
        <Input type="number" min={0} max={30} value={home} onChange={(e) => setHome(e.target.value)} />
      </Td>
      <Td>
        <Input type="number" min={0} max={30} value={away} onChange={(e) => setAway(e.target.value)} />
      </Td>
      <Td className="text-right">
        <Button size="sm" onClick={save} disabled={submitting || home === "" || away === ""}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </Td>
    </Tr>
  );
}
