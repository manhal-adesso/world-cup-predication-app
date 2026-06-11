import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeagueForms } from "./league-forms";
import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Leagues" };
export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code, owner_id)")
    .eq("user_id", session.userId);

  return (
    <div className="container space-y-6 py-8">
      <h1 className="text-2xl font-bold">Leagues</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your leagues</CardTitle>
            <CardDescription>Private mini-leaderboards you&apos;re part of.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!memberships || memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You aren&apos;t a member of any league yet. Create one or join with a code.
              </p>
            ) : (
              memberships.map((row) => {
                const league = Array.isArray(row.leagues) ? row.leagues[0] : row.leagues;
                if (!league) return null;
                const isOwner = league.owner_id === session.userId;
                return (
                  <div key={row.league_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">
                        {league.name}{" "}
                        {isOwner && <Badge variant="outline" className="ml-1 text-[10px]">Owner</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Invite code: <span className="font-mono">{league.invite_code}</span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/leagues/${league.id}`}>Open</Link>
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <LeagueForms isAdmin={!!session.profile.is_admin} />
        </div>
      </div>
    </div>
  );
}
