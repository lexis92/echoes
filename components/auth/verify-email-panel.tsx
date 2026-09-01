"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { initialAuthState } from "@/app/(auth)/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert, FormHeading } from "./form-shell";

export function VerifyEmailPanel() {
  const params = useSearchParams();
  const emailParam = params.get("email") ?? "";
  const expired = params.get("error") === "link_expired";

  const [state, formAction, pending] = useActionState(
    resendVerificationAction,
    initialAuthState
  );
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (state.status === "success") setCooldown(45);
  }, [state]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <>
      <div
        className="mb-8 flex size-14 items-center justify-center rounded-full bg-ember-soft text-ember-ink animate-seal-in"
        aria-hidden
      >
        <MailCheck className="size-6" />
      </div>

      <FormHeading
        eyebrow="One more step"
        title="Check your inbox"
        description={
          emailParam ? (
            <>
              We sent a confirmation link to{" "}
              <strong className="font-medium text-ink">{emailParam}</strong>. Open it
              and your vault is ready.
            </>
          ) : (
            "We sent you a confirmation link. Open it and your vault is ready."
          )
        }
      />

      {expired && (
        <FormAlert tone="error" className="mb-5">
          That link had expired. Send yourself a new one below.
        </FormAlert>
      )}

      <div className="rounded-xl border border-ink/[0.08] bg-raised p-5">
        <p className="text-sm font-medium text-ink">Nothing arrived?</p>
        <p className="mt-1 text-sm leading-relaxed text-quiet">
          Check spam and promotions first — it comes from a new address, so it
          sometimes lands there.
        </p>

        <form action={formAction} className="mt-4 space-y-3">
          {state.message && (
            <FormAlert tone={state.status === "error" ? "error" : "success"}>
              {state.message}
            </FormAlert>
          )}
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={emailParam}
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            loading={pending}
            disabled={cooldown > 0}
          >
            <RefreshCw className="size-4" />
            {cooldown > 0 ? `Send again in ${cooldown}s` : "Send the link again"}
          </Button>
        </form>
      </div>

      <p className="mt-8 border-t border-ink/[0.08] pt-6 text-center text-sm text-quiet">
        Wrong address?{" "}
        <Link href="/signup" className="font-medium text-ember underline-offset-4 hover:underline">
          Start again
        </Link>
      </p>
    </>
  );
}
