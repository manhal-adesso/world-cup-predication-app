import { format } from "date-fns";

export const PREDICTION_LOCK_MINUTES = 5;

export function lockTime(kickoffISO: string): Date {
  return new Date(new Date(kickoffISO).getTime() - PREDICTION_LOCK_MINUTES * 60_000);
}

export function isLocked(kickoffISO: string, now: Date = new Date()): boolean {
  return now.getTime() >= lockTime(kickoffISO).getTime();
}

export function formatKickoff(kickoffISO: string): string {
  return format(new Date(kickoffISO), "dd MMM yyyy HH:mm");
}

export function formatRelative(targetISO: string, now: Date = new Date()): string {
  const ms = new Date(targetISO).getTime() - now.getTime();
  const abs = Math.abs(ms);
  const sign = ms < 0 ? "ago" : "in";
  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (days   > 0) return `${sign === "in" ? "in " : ""}${days}d${sign === "ago" ? " ago" : ""}`;
  if (hours  > 0) return `${sign === "in" ? "in " : ""}${hours}h${sign === "ago" ? " ago" : ""}`;
  if (minutes > 0) return `${sign === "in" ? "in " : ""}${minutes}m${sign === "ago" ? " ago" : ""}`;
  return sign === "in" ? "starting now" : "just now";
}
