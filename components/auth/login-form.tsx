"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInAction } from "@/app/(auth)/actions";
import { initialAuthState } from "@/app/(auth)/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { FormAlert, FormHeading } from "./form-shell";

const LINK_ERRORS: Record<string, string> = {
  link_expired: "That link expired. Sign in and we\u2019ll send a new one.",
  invalid_link: "We couldn\u2019t read that link. Try signing in instead.",
  missing_code: "That link was incomplete. Try signing in instead.",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState);
  const [visible, setVisible] = React.useState(false);
  const params = useSearchParams();

  const next = params.get("next") ?? "";
  const linkError = params.get("error");

  return (
    <>
      <FormHeading
        eyebrow="Welcome back"
        title="Open your vault"
        description="Everything people have sent you is still here."
      />

      <form action={formAction} className="space-y-5">
        {linkError && LINK_ERRORS[linkError] && (
          <FormAlert tone="error">{LINK_ERRORS[linkError]}</FormAlert>
        )}
        {state.status === "error" && state.message && (
          <FormAlert tone="error">{state.message}</FormAlert>
        )}

        <input type="hidden" name="next" value={next} />

        <Field label="Email" htmlFor="email" error={state.fields?.email}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="you@example.com"
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-xs text-quiet underline-offset-4 hover:text-ember hover:underline"
            >
              Forgotten it?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-11"
              placeholder="••••••••"
              aria-invalid={state.fields?.password ? true : undefined}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-faint transition-colors hover:text-ink"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {state.fields?.password && (
            <p role="alert" className="text-xs font-medium text-danger">
              {state.fields.password}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 border-t border-ink/[0.08] pt-6 text-center text-sm text-quiet">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ember underline-offset-4 hover:underline">
          Create your vault
        </Link>
      </p>
    </>
  );
}
