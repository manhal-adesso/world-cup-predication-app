"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfileSchema } from "@/lib/validations";
import type { ProfileRow } from "@/types/database";

type Values = { displayName: string; avatarUrl?: string };

export function ProfileForm({ profile, email }: { profile: ProfileRow; email: string | null }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url ?? "",
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    setSuccess(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: values.displayName,
        avatar_url: values.avatarUrl?.length ? values.avatarUrl : null,
      })
      .eq("id", profile.id);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email ?? ""} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" {...form.register("displayName")} />
        {form.formState.errors.displayName && (
          <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
        <Input id="avatarUrl" type="url" {...form.register("avatarUrl")} />
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
