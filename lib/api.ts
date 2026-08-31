import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldErrors } from "./validation";

export type ApiError = {
  error: string;
  message: string;
  fields?: Record<string, string>;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(
  status: number,
  error: string,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, ...extra } satisfies ApiError, { status });
}

export function invalid(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "validation_failed",
      message: "Some of that needs another look.",
      fields: fieldErrors(error),
    } satisfies ApiError,
    { status: 422 }
  );
}

export function unauthorized() {
  return fail(401, "unauthorized", "You need to be signed in to do that.");
}

export function notFound(what = "That could not be found.") {
  return fail(404, "not_found", what);
}

export function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "rate_limited",
      message: "That is a lot of messages in a short while. Try again in a few minutes.",
    } satisfies ApiError,
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export function serverError(message = "Something went wrong on our side.") {
  return fail(500, "server_error", message);
}

/** Parses a JSON body, returning null when it is missing or malformed. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
