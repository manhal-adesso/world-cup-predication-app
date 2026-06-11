import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk<T extends object>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleZodError(err: ZodError) {
  return jsonError("Invalid request body", 422, { issues: err.flatten() });
}
