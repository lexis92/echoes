import { Quote } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LogoMark } from "@/components/logo";
import type { PublicProfile } from "@/lib/supabase/database.types";
import { pluralize } from "@/lib/utils";
import { format } from "date-fns";

export function PublicProfileHeader({ profile }: { profile: PublicProfile }) {
  return (
    <header className="relative text-center">
      <div className="mb-8 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-surface px-3.5 py-1.5 shadow-press">
          <LogoMark className="size-4" />
          <span className="font-display text-sm tracking-tightest text-ink">Echoes</span>
        </span>
      </div>

      <div className="flex justify-center">
        <Avatar
          src={profile.avatar_url}
          name={profile.name}
          size="xl"
          seal
          className="animate-seal-in"
        />
      </div>

      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-[2.75rem]">
        Write to {profile.name}
      </h1>

      {profile.bio && (
        <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-quiet">
          {profile.bio}
        </p>
      )}

      {profile.welcome_note && (
        <blockquote className="mx-auto mt-7 max-w-md rounded-xl bg-ember-soft/60 px-5 py-4">
          <Quote className="mx-auto mb-2 size-4 text-ember" aria-hidden />
          <p className="text-pretty font-display text-[1.0625rem] leading-relaxed text-ember-ink">
            {profile.welcome_note}
          </p>
        </blockquote>
      )}

      <p className="mt-6 font-mono text-xs text-faint">
        {profile.message_count > 0
          ? `${pluralize(profile.message_count, "message")} kept · on Echoes since ${format(
              new Date(profile.member_since),
              "MMMM yyyy"
            )}`
          : `On Echoes since ${format(new Date(profile.member_since), "MMMM yyyy")}`}
      </p>
    </header>
  );
}
