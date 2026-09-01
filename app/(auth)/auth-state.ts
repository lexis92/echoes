/**
 * Shared shape for the auth form actions.
 *
 * Deliberately NOT in `actions.ts`: a `"use server"` file may only export
 * async functions. Exporting a plain object from one compiles cleanly but
 * throws at module evaluation on the server —
 * `A "use server" file can only export async functions, found object` —
 * taking down every route that imports it.
 */
export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  fields?: Record<string, string>;
};

export const initialAuthState: AuthState = { status: "idle" };
