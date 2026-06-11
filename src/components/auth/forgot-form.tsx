"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { resetRequestSchema } from "@/lib/validations";

export function ForgotForm() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hydrated = useHydrated();

  const form = useForm<{ email: string }>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: { email: string }) {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${env.SITE_URL}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <Alert variant="success">
        <AlertDescription>
          If an account exists for that email, a reset link has been sent.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Button
        type="submit"
        className="w-full"
        disabled={!hydrated || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
    </form>
  );
}
