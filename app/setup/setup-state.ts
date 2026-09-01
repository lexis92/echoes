/**
 * Shared shape for the profile setup action. Kept out of `actions.ts` for the
 * same reason as `auth-state.ts`: a `"use server"` file may only export async
 * functions.
 */
export type SetupState = {
  status: "idle" | "error" | "success";
  message?: string;
  fields?: Record<string, string>;
  username?: string;
};

export const initialSetupState: SetupState = { status: "idle" };
