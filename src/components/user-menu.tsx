"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";

interface UserMenuProps {
  profile: ProfileRow;
  email: string | null;
}

export function UserMenu({ profile, email }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const initials = (profile.display_name || email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <Button variant="ghost" size="icon" aria-label="Profile" asChild>
        <Link href="/profile"><User className="h-4 w-4" /></Link>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
