"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (!confirm("Leave this league?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/leave`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? "Failed to leave league");
        return;
      }
      router.push("/leagues");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Leave league
    </Button>
  );
}
