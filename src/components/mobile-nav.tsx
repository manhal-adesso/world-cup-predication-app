"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden bg-secondary text-secondary-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

     {open && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 z-[9998] bg-black/50 md:hidden"
      onClick={() => setOpen(false)}
    />

    {/* Mobile Sidebar */}
    <div className="fixed top-0 right-0 z-[9999] h-screen w-72 bg-white text-slate-900 shadow-2xl md:hidden">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-end border-b border-slate-200 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-3 text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-200 p-4">
          {profile ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mb-4 flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100"
              >
                <Avatar className="h-10 w-10">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {profile.display_name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {email}
                  </p>
                </div>
              </Link>

              <div className="flex gap-2">
                <Button
                  asChild
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="text-white"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>

                <Button
                  onClick={handleSignOut}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-white"
                >
                  Log in
                </Link>
              </Button>

              <Button
                asChild
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-white"
                >
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
)}
    </div>
  );
}
