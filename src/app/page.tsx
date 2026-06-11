import Link from "next/link";
import { ArrowRight, Trophy, Users, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { getOptionalSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocked } from "@/lib/time";

export default async function HomePage() {
  const session = await getOptionalSession();
  const supabase = await createSupabaseServerClient();

  const { data: upcoming } = await supabase
    .from("matches")
    .select("*")
    .gt("kickoff_time", new Date().toISOString())
    .order("kickoff_time", { ascending: true })
    .limit(3);

  return (
    <div>
      <section className="pitch-gradient text-white">
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Predict the World Cup. Beat your friends.
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Make a pick for every fixture, earn points for correct results, and climb the global &
              private league leaderboards.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {session ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register">Get started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                    <Link href="/leaderboard">View leaderboard</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={<Target className="h-5 w-5" />} title="Simple scoring">
            +1 for correct winner. +3 for exact score. Max 4 per match.
          </Feature>
          <Feature icon={<Users className="h-5 w-5" />} title="Private leagues">
            Create a league, share the invite code, compete with friends.
          </Feature>
          <Feature icon={<Trophy className="h-5 w-5" />} title="Live leaderboard">
            Scores recompute automatically the moment results are posted.
          </Feature>
        </div>
      </section>

      {upcoming && upcoming.length > 0 && (
        <section className="container pb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming matches</h2>
            <Button variant="link" asChild>
              <Link href="/matches">See all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} locked={isLocked(m.kickoff_time)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{children}</CardDescription>
      </CardContent>
    </Card>
  );
}
