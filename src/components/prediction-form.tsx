"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isLocked } from "@/lib/time";
import type { MatchRow, MatchWinner, PredictionRow } from "@/types/database";

interface PredictionFormProps {
  match: MatchRow;
  initial: PredictionRow | null;
}

export function PredictionForm({ match, initial }: PredictionFormProps) {
  const router = useRouter();

  const [home, setHome] = React.useState<number>(initial?.predicted_home_score ?? 1);
  const [away, setAway] = React.useState<number>(initial?.predicted_away_score ?? 0);
  const [winner, setWinner] = React.useState<MatchWinner>(initial?.predicted_winner ?? "home");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // keep winner consistent with score
  React.useEffect(() => {
    setWinner(() => {
      if (home > away) return "home";
      if (home < away) return "away";
      return "draw";
    });
  }, [home, away]);

  const locked = isLocked(match.kickoff_time);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          predictedWinner: winner,
          predictedHomeScore: home,
          predictedAwayScore: away,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      setSuccess("Prediction saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save prediction.");
    } finally {
      setSubmitting(false);
    }
  }

  if (locked) {
    return (
      <Alert>
        <AlertDescription>
          Predictions for this match are locked.
          {initial
            ? ` Your prediction: ${initial.predicted_home_score}-${initial.predicted_away_score}.`
            : " You did not submit a prediction."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>Winner</Label>
        <RadioGroup
          value={winner}
          onValueChange={(v) => setWinner(v as MatchWinner)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <WinnerOption value="home" label={match.home_team} current={winner} />
          <WinnerOption value="draw" label="Draw"           current={winner} />
          <WinnerOption value="away" label={match.away_team} current={winner} />
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="home">{match.home_team}</Label>
          <Input
            id="home"
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            value={home}
            onChange={(e) => setHome(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="away">{match.away_team}</Label>
          <Input
            id="away"
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            value={away}
            onChange={(e) => setAway(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {initial ? "Update Prediction" : "Save Prediction"}
      </Button>
    </form>
  );
}

function WinnerOption({
  value,
  label,
  current,
}: {
  value: MatchWinner;
  label: string;
  current: MatchWinner;
}) {
  const id = `winner-${value}`;
  const active = current === value;
  return (
    <Label
      htmlFor={id}
      className={[
        "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition",
        active ? "border-primary bg-primary/5" : "hover:bg-accent",
      ].join(" ")}
    >
      <RadioGroupItem id={id} value={value} />
      <span className="truncate">{label}</span>
    </Label>
  );
}
