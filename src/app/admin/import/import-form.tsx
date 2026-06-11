"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ImportForm() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) return setError("Select an ICS file first");
    setSubmitting(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/import-ics", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Import failed");
      setSuccess(`Imported ${body.imported} of ${body.total} matches.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        type="file"
        accept=".ics,text/calendar"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono">{file.name}</span> ({Math.ceil(file.size / 1024)} KB)
        </p>
      )}

      {error   && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

      <Button type="submit" disabled={submitting || !file}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import
      </Button>
    </form>
  );
}
