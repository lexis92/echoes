"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signUpAction, initialAuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { FormAlert, FormHeading } from "./form-shell";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/** Live, non-judgemental password strength. Four ticks, no red shaming. */
function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ["Too short", "Getting there", "Good", "Strong", "Excellent"];

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialAuthState);
  const params = useSearchParams();
  const claimedHandle = (params.get("handle") ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  const [password, setPassword] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const started = React.useRef(false);

  const score = strengthOf(password);

  function onFirstInput() {
    if (started.current) return;
    started.current = true;
    track(ANALYTICS_EVENTS.signupStarted);
  }

  return (
    <>
      <FormHeading
        eyebrow="Create your vault"
        title="Start keeping the good ones"
        description="Two minutes to set up. Then share one link and let people write to you."
      />

      <form action={formAction} className="space-y-5" onInput={onFirstInput}>
        {/* Carried from the landing page so /setup can offer it back. */}
        <input type="hidden" name="handle" value={claimedHandle} />

        {claimedHandle && (
          <FormAlert tone="info">
            We will try to reserve{" "}
            <strong className="font-medium">echoes.app/u/{claimedHandle}</strong> for you.
          </FormAlert>
        )}

        {state.status === "error" && state.message && (
          <FormAlert tone="error">{state.message}</FormAlert>
        )}

        <Field
          label="Your name"
          htmlFor="name"
          error={state.fields?.name}
          hint="This is what senders see at the top of your page."
        >
          <Input
            name="name"
            autoComplete="name"
            required
            maxLength={60}
            placeholder="Maya Okonkwo"
          />
        </Field>

        <Field label="Email" htmlFor="email" error={state.fields?.email}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={state.fields?.password}
          hint="At least 8 characters, with a letter and a number."
        >
          <div className="relative">
            <Input
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
              placeholder="••••••••"
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
        </Field>

        {password.length > 0 && (
          <div className="-mt-2 flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < score ? "bg-ember" : "bg-ink/10"
                  }`}
                />
              ))}
            </div>
            <span className="w-24 text-right text-xs text-faint">{STRENGTH_LABELS[score]}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Create my vault
        </Button>

        <p className="text-center text-xs leading-relaxed text-faint">
          By creating an account you agree that messages sent to you are yours to
          keep, and that you will not use Echoes to harass anyone.
        </p>
      </form>

      <p className="mt-8 border-t border-ink/[0.08] pt-6 text-center text-sm text-quiet">
        Already have a vault?{" "}
        <Link href="/login" className="font-medium text-ember underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
