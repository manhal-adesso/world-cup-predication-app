"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { signUpSchema } from "@/lib/validations";

type FormValues = { email: string; password: string; displayName: string };

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const hydrated = useHydrated();

  const form = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${env.SITE_URL}/auth/callback`,
        data: { display_name: values.displayName },
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setInfo("Account created. Check your inbox to confirm your email before signing in.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" autoComplete="nickname" {...form.register("displayName")} />
          {form.formState.errors.displayName && (
            <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {info  && <Alert variant="success"><AlertDescription>{info}</AlertDescription></Alert>}

        <Button
          type="submit"
          className="w-full"
          disabled={!hydrated || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
