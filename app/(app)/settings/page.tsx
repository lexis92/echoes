import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PencilLine } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { listFolders } from "@/lib/data/messages";
import { PageHeader } from "@/components/app/page-header";
import { SettingsSection } from "@/components/settings/settings-section";
import {
  DangerPanel,
  FoldersPanel,
  NotificationsPanel,
  PasswordPanel,
  ReceivingPanel,
  SafetyPanel,
} from "@/components/settings/settings-panels";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { profileUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const folders = await listFolders();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Your account"
        title="Settings"
        description="How your page behaves, what reaches your inbox, and what leaves it."
      />

      <SettingsSection
        id="profile"
        title="Profile"
        description="What people see when they open your link."
      >
        <div className="flex flex-wrap items-center gap-5 py-5">
          <Avatar src={profile.avatar_url} name={profile.name} size="lg" seal />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl tracking-tightest text-ink">{profile.name}</p>
            <p className="font-mono text-sm text-faint">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-quiet">{profile.bio}</p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href="/setup?edit=1">
              <PencilLine className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>

        <div className="border-t border-ink/[0.07] py-5">
          <CopyField label="Your link" value={profileUrl(profile.username)} />
        </div>
      </SettingsSection>

      <SettingsSection
        id="receiving"
        title="Receiving messages"
        description="Every switch here changes what senders see on your page, immediately."
      >
        <ReceivingPanel profile={profile} />
      </SettingsSection>

      <SettingsSection
        id="safety"
        title="Safety and privacy"
        description="Echoes always rate-limits senders and screens for spam. These are the parts you control."
      >
        <SafetyPanel profile={profile} />
      </SettingsSection>

      <SettingsSection
        id="notifications"
        title="Notifications"
        description="Sealed messages are always announced when they arrive and again when they open."
      >
        <NotificationsPanel profile={profile} />
      </SettingsSection>

      <SettingsSection
        id="collections"
        title="Collections"
        description="Optional shelves for your messages. Deleting a collection never deletes what is in it."
      >
        <FoldersPanel folders={folders} />
      </SettingsSection>

      <SettingsSection id="security" title="Sign-in">
        <PasswordPanel />
      </SettingsSection>

      <SettingsSection
        id="danger"
        title="Danger zone"
        description="The irreversible one."
      >
        <DangerPanel username={profile.username} />
      </SettingsSection>
    </div>
  );
}
