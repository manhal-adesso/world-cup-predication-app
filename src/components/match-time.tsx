"use client";

import { useEffect, useState } from "react";

interface MatchTimeProps {
  kickoffTime: string;
}

export function MatchTime({ kickoffTime }: MatchTimeProps) {
  const [display, setDisplay] = useState(() => {
    const date = new Date(kickoffTime);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  });

  useEffect(() => {
    const date = new Date(kickoffTime);
    const formatted = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
    setDisplay(formatted);
  }, [kickoffTime]);

  return <>{display}</>;
}
