import Link from "next/link";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";
import { getOptionalSession } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getOptionalSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="truncate">
            <span className="lowercase">adesso</span> World Cup Prediction
          </span>
        </Link>

        <nav className="ml-auto hidden md:flex items-center gap-1 text-sm">
          <Button asChild variant="ghost" size="sm">
            <Link href="/matches">Matches</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leaderboard">Leaderboard</Link>
          </Button>

          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leagues">Leagues</Link>
              </Button>
              {session.profile.is_admin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <ThemeToggle />
              <UserMenu profile={session.profile} email={session.email} />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>

        <div className="md:hidden ml-auto flex items-center gap-1">
          <ThemeToggle />
          <MobileNav
            profile={session?.profile ?? null}
            email={session?.email ?? null}
            isAdmin={session?.profile.is_admin ?? false}
          />
        </div>
      </div>
    </header>
  );
}
