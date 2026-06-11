/**
 * Admin-only endpoint that ingests a FotMob (or compatible) .ics calendar
 * and creates / updates match rows.
 *
 * Accepts: multipart/form-data with field "file" (.ics)
 *       or text/calendar body.
 */
import { parseICS, type CalendarComponent } from "node-ical";

import { jsonError, jsonOk } from "@/lib/api";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ParsedMatch {
  external_id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
}

// Strip leading flag emoji + variant selectors from "🇲🇽 Mexico"
function cleanTeam(name: string): string {
  return name
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")  // regional indicator pairs
    .replace(/[\u{FE0F}\u{200D}]/gu, "")         // variation selectors / ZWJ
    .replace(/\s+/g, " ")
    .trim();
}

function parseSummary(summary: string): { home: string; away: string } | null {
  // SUMMARY example: "🇲🇽 Mexico - 🇿🇦 South Africa"
  // The separator is " - " (or " vs ", " v "). Try them in order.
  for (const sep of [" - ", " — ", " – ", " vs ", " v "]) {
    const idx = summary.indexOf(sep);
    if (idx > 0) {
      return {
        home: cleanTeam(summary.slice(0, idx)),
        away: cleanTeam(summary.slice(idx + sep.length)),
      };
    }
  }
  return null;
}

function extractMatches(calendar: Record<string, CalendarComponent>): ParsedMatch[] {
  const out: ParsedMatch[] = [];

  for (const value of Object.values(calendar)) {
    if (!value || value.type !== "VEVENT") continue;
    const ev = value;
    if (!ev.summary || !ev.start) continue;

    const parsed = parseSummary(String(ev.summary));
    if (!parsed || !parsed.home || !parsed.away) continue;

    const uid = String(ev.uid ?? `${ev.summary}-${ev.start.toString()}`);
    out.push({
      external_id: uid,
      home_team: parsed.home,
      away_team: parsed.away,
      kickoff_time: new Date(ev.start as unknown as string).toISOString(),
    });
  }

  // De-dupe on external_id (some ICS feeds duplicate events).
  const seen = new Set<string>();
  return out.filter((m) => {
    if (seen.has(m.external_id)) return false;
    seen.add(m.external_id);
    return true;
  });
}

export async function POST(request: Request) {
  // ---- authz: admin only ----
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorised", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return jsonError("Forbidden", 403);

  // ---- read ICS payload ----
  const contentType = request.headers.get("content-type") ?? "";
  let icsText: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Missing 'file' field");
    if (file.size > 5 * 1024 * 1024) return jsonError("File too large (max 5MB)");
    icsText = await file.text();
  } else {
    icsText = await request.text();
  }

  if (!icsText.trim()) return jsonError("Empty body");

  // ---- parse ----
  let calendar;
  try {
    calendar = parseICS(icsText);
  } catch (e) {
    return jsonError(`Failed to parse ICS: ${e instanceof Error ? e.message : "unknown"}`);
  }

  const matches = extractMatches(calendar);
  if (matches.length === 0) return jsonError("No valid VEVENTs found in calendar");

  // ---- upsert via service role (bypass RLS) ----
  const admin = createSupabaseAdminClient();
  const { error, count } = await admin
    .from("matches")
    .upsert(
      matches.map((m) => ({
        external_id: m.external_id,
        home_team: m.home_team,
        away_team: m.away_team,
        kickoff_time: m.kickoff_time,
        status: "scheduled" as const,
      })),
      { onConflict: "external_id", count: "exact", ignoreDuplicates: false }
    );

  if (error) return jsonError(error.message, 400);

  return jsonOk({ imported: count ?? matches.length, total: matches.length });
}
