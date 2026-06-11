import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { LeaveLeagueButton } from "./leave-button";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!league) notFound();

  // Fetch members + their profiles
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, display_name, avatar_url, total_points)")
    .eq("league_id", id);

  type Row = { id: string; display_name: string; avatar_url: string | null; total_points: number };
  const rows: Row[] = (members ?? [])
    .map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return p ? { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url, total_points: p.total_points } : null;
    })
    .filter((x): x is Row => Boolean(x))
    .sort((a, b) => b.total_points - a.total_points);

  const isOwner = league.owner_id === session.userId;

  return (
    <div className="container space-y-6 py-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/leagues"><ArrowLeft className="h-4 w-4" /> Back to leagues</Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {league.name}
            </CardTitle>
            <CardDescription>
              Invite code <Badge variant="outline" className="ml-1 font-mono">{league.invite_code}</Badge>
            </CardDescription>
          </div>
          {!isOwner && <LeaveLeagueButton leagueId={league.id} />}
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th className="w-16">Rank</Th>
                  <Th>Player</Th>
                  <Th className="w-24 text-right">Points</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.map((r, i) => {
                  const initials = r.display_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
                  const isMe = r.id === session.userId;
                  return (
                    <Tr key={r.id} className={isMe ? "bg-primary/5" : undefined}>
                      <Td className="font-semibold tabular-nums">#{i + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {r.avatar_url ? <AvatarImage src={r.avatar_url} alt="" /> : null}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{r.display_name}{isMe ? " (you)" : ""}</span>
                        </div>
                      </Td>
                      <Td className="text-right font-semibold tabular-nums">{r.total_points}</Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
