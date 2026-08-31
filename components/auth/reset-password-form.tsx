"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { requestPasswordResetAction, initialAuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { FormAlert, FormHeading } from "./form-shell";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState
  );

  return (
    <>
      <FormHeading
        eyebrow="Password reset"
        title="Let's get you back in"
        description="Enter the email you signed up with and we will send you a link to set a new password."
      />

      <form action={formAction} className="space-y-5">
        {state.message && (
          <FormAlert tone={state.status === "error" ? "error" : "success"}>
            {state.message}
          </FormAlert>
        )}

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

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Send the reset link
        </Button>
      </form>

      <p className="mt-8 border-t border-ink/[0.08] pt-6 text-center text-sm text-quiet">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-ember underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </p>
    </>
  );
}
