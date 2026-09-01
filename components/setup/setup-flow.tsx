"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { completeSetupAction } from "@/app/setup/actions";
import { initialSetupState } from "@/app/setup/setup-state";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { FormAlert } from "@/components/auth/form-shell";
import { AvatarPicker } from "./avatar-picker";
import { UsernameField } from "./username-field";
import { CopyField } from "@/components/ui/copy-field";
import { BIO_MAX_LENGTH } from "@/lib/constants";
import { profileUrl } from "@/lib/utils";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { ProfileRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/cn";

const STEPS = ["You", "Your photo", "Your page"] as const;

export function SetupFlow({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const params = useSearchParams();
  const isEditing = params.get("edit") === "1" && Boolean(profile.onboarded_at);

  const [state, formAction, pending] = useActionState(completeSetupAction, initialSetupState);
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState(profile.name);
  const [username, setUsername] = React.useState(profile.username);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(profile.avatar_url);
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [welcome, setWelcome] = React.useState(profile.welcome_note ?? "");

  React.useEffect(() => {
    if (!profile.onboarded_at) track(ANALYTICS_EVENTS.profileSetupStarted);
  }, [profile.onboarded_at]);

  // Jump the whole form to the server on the last step; earlier steps are
  // purely client-side so nothing is half-saved.
  const isLast = step === STEPS.length - 1;
  const canAdvance = step !== 0 || (name.trim().length > 0 && username.trim().length >= 3);

  if (state.status === "success") {
    return <SetupDone username={state.username ?? username} editing={isEditing} />;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {!isEditing && (
        <ol className="mb-10 flex items-center gap-2" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                  i < step
                    ? "bg-sage text-white"
                    : i === step
                      ? "bg-ember text-white"
                      : "bg-ink/[0.07] text-faint"
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  i === step ? "font-medium text-ink" : "text-faint"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-ink/[0.09]" aria-hidden />}
            </li>
          ))}
        </ol>
      )}

      <form action={formAction} className="space-y-6">
        {/* Everything travels with the final submit, whichever step it was set on. */}
        <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} />
        {step !== 0 && <input type="hidden" name="name" value={name} />}
        {step !== 0 && <input type="hidden" name="username" value={username} />}
        {step !== 2 && <input type="hidden" name="bio" value={bio} />}
        {step !== 2 && <input type="hidden" name="welcome_note" value={welcome} />}

        {state.status === "error" && state.message && (
          <FormAlert tone="error">{state.message}</FormAlert>
        )}

        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h1 className="font-display text-[2rem] leading-[1.1] tracking-tightest text-ink">
                {isEditing ? "Your profile" : "The basics"}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-quiet">
                Senders see your name. Your link is how they reach you.
              </p>
            </div>

            <Field label="Your name" htmlFor="name" error={state.fields?.name}>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoFocus
                placeholder="Maya Okonkwo"
              />
            </Field>

            <UsernameField
              value={username}
              onChange={setUsername}
              error={state.fields?.username}
              initial={profile.onboarded_at ? profile.username : undefined}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h1 className="font-display text-[2rem] leading-[1.1] tracking-tightest text-ink">
                Add a photo
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-quiet">
                Optional. You can change it any time.
              </p>
            </div>
            <AvatarPicker name={name} value={avatarUrl} onChange={setAvatarUrl} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h1 className="font-display text-[2rem] leading-[1.1] tracking-tightest text-ink">
                About you
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-quiet">
                Both of these show on your public page. Both are optional.
              </p>
            </div>

            <Field
              label="A line about you"
              htmlFor="bio"
              optional
              error={state.fields?.bio}
              hint={`${bio.length}/${BIO_MAX_LENGTH}`}
            >
              <Textarea
                name="bio"
                rows={3}
                maxLength={BIO_MAX_LENGTH}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceramicist in Lisbon. Collecting kind words like sea glass."
              />
            </Field>

            <Field
              label="A prompt for senders"
              htmlFor="welcome_note"
              optional
              hint="Ask for something specific. It makes a real difference to what you get."
            >
              <Input
                name="welcome_note"
                maxLength={200}
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
                placeholder="Tell me something you have never said out loud."
              />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : isEditing ? (
            <Button type="button" variant="ghost" onClick={() => router.push("/settings")}>
              Cancel
            </Button>
          ) : (
            <span />
          )}

          {isLast || isEditing ? (
            <Button type="submit" size="lg" loading={pending}>
              {isEditing ? "Save profile" : "Open my vault"}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        {!isEditing && !isLast && (
          <button
            type="button"
            onClick={() => setStep(STEPS.length - 1)}
            className="mx-auto block text-sm text-faint underline-offset-4 hover:text-quiet hover:underline"
          >
            Skip for now
          </button>
        )}
      </form>
    </div>
  );
}

/** The moment the link exists. Worth a beat of celebration. */
function SetupDone({ username, editing }: { username: string; editing: boolean }) {
  const router = useRouter();

  React.useEffect(() => {
    if (editing) {
      const t = setTimeout(() => router.push("/settings"), 900);
      return () => clearTimeout(t);
    }
  }, [editing, router]);

  return (
    <div className="mx-auto w-full max-w-lg text-center animate-fade-up">
      <div
        className="mx-auto mb-8 flex size-16 items-center justify-center rounded-full bg-ember text-white shadow-seal animate-seal-in"
        aria-hidden
      >
        <PartyPopper className="size-7" />
      </div>

      <h1 className="font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink">
        {editing ? "Saved" : "You're all set"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-pretty text-[15px] leading-relaxed text-quiet">
        {editing
          ? "Taking you back to settings."
          : "This is your link. Send it to someone and see what comes back."}
      </p>

      {!editing && (
        <>
          <CopyField
            value={profileUrl(username)}
            className="mt-8 text-left"
            onCopied={() => track(ANALYTICS_EVENTS.profileLinkCopied, { surface: "setup" })}
          />
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button size="lg" onClick={() => router.push("/dashboard")}>
              Go to my vault
              <ArrowRight className="size-4" />
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={profileUrl(username)} target="_blank" rel="noreferrer">
                See my page
              </a>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
