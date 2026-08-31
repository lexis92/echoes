import Link from "next/link";
import { ArrowRight, Camera, PenLine, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProfileRow } from "@/lib/supabase/database.types";

/**
 * A short, finite checklist. It disappears entirely once done — a permanent
 * "complete your profile" nag in a keepsake app would be grim.
 */
export function DashboardNudges({
  profile,
  totalMessages,
}: {
  profile: ProfileRow;
  totalMessages: number;
}) {
  const steps = [
    {
      done: Boolean(profile.avatar_url),
      href: "/setup?edit=1",
      Icon: Camera,
      title: "Add a photo",
      body: "People are far more likely to write when they can see who they are writing to.",
    },
    {
      done: Boolean(profile.bio?.trim()),
      href: "/setup?edit=1",
      Icon: PenLine,
      title: "Write a line about yourself",
      body: "One sentence is plenty. It sets the tone for what people send.",
    },
    {
      done: totalMessages > 0,
      href: "#share",
      Icon: Send,
      title: "Share your link",
      body: "Nothing arrives until somebody has it. A story or a group chat is the usual first move.",
    },
  ];

  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  return (
    <section aria-labelledby="setup-heading">
      <h2 id="setup-heading" className="label mb-3 text-faint">
        Finish setting up · {steps.length - remaining.length} of {steps.length} done
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {remaining.map(({ href, Icon, title, body }) => (
          <Card key={title} as={Link} {...{ href }} className="group block p-5 transition-all duration-300 ease-paper hover:-translate-y-0.5 hover:shadow-lift">
            <Icon className="size-5 text-ember" aria-hidden />
            <h3 className="mt-4 flex items-center gap-1.5 font-display text-lg tracking-tightest text-ink">
              {title}
              <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-quiet">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
