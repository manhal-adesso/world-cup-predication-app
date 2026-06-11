"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";

interface MobileNavProps {
  profile?: ProfileRow | null;
  email?: string | null;
  isAdmin: boolean;
}

export function MobileNav({ profile, email, isAdmin }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const initials = profile
    ? (profile.display_name || email || "?")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const links = profile
    ? [
        { href: "/matches", label: "Matches" },
        { href: "/leaderboard", label: "Leaderboard" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/my-predictions", label: "My predictions" },
        { href: "/leagues", label: "Leagues" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/matches", label: "Matches" },
        { href: "/leaderboard", label: "Leaderboard" },
      ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col bg-background shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b px-4 h-14">
              <span className="text-sm font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {links.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => setOpen(false)}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>

            <div className="border-t p-3 space-y-3">
              {profile ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted -mx-1"
                    onClick={() => setOpen(false)}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt="" />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/profile">
                        <User className="h-4 w-4 mr-1" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Sign out"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
