"use client";

import * as React from "react";
import { Clock, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PREDICTION_LOCK_MINUTES } from "@/lib/time";

interface CountdownProps {
  kickoffISO: string;
}

function formatDelta(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days  = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const mins  = Math.floor((total % 3600) / 60);
  const secs  = total % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function Countdown({ kickoffISO }: CountdownProps) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const kickoff = new Date(kickoffISO).getTime();
  const lockMs  = kickoff - PREDICTION_LOCK_MINUTES * 60_000;
  const locked  = now >= lockMs;
  const started = now >= kickoff;

  if (started) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Clock className="h-3 w-3" /> Match started
      </Badge>
    );
  }

  if (locked) {
    return (
      <Badge variant="warning" className="gap-1">
        <Lock className="h-3 w-3" /> Predictions locked
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <span className="text-xs text-muted-foreground">Locks in</span>
      <span className="text-lg font-bold tabular-nums">{formatDelta(lockMs - now)}</span>
    </div>
  );
}
