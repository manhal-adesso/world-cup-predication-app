import { Trophy } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Global leaderboard" };
export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("global_leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(200);

  return (
    <div className="container py-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <CardTitle>Global Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">Failed to load leaderboard.</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players yet. Be the first!</p>
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
                {data.map((row) => {
                  const initials = (row.display_name || "?")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <Tr key={row.id}>
                      <Td className="font-semibold tabular-nums">#{row.rank}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {row.avatar_url ? <AvatarImage src={row.avatar_url} alt="" /> : null}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{row.display_name}</span>
                        </div>
                      </Td>
                      <Td className="text-right font-semibold tabular-nums">{row.total_points}</Td>
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
