import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { getInboxCounts } from "@/lib/data/messages";
import { Sidebar, TabBar } from "@/components/app/sidebar";
import { MobileHeader } from "@/components/app/app-header";
import { profileUrl } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  // Middleware already guards these routes; this is the belt to its braces,
  // and it gives every child page a guaranteed profile.
  if (!profile) redirect("/login");
  if (!profile.onboarded_at) redirect("/setup");

  const counts = await getInboxCounts();

  return (
    <div className="min-h-dvh">
      <Sidebar
        counts={counts}
        name={profile.name}
        username={profile.username}
        email={profile.email}
        avatarUrl={profile.avatar_url}
      />

      <MobileHeader
        name={profile.name}
        avatarUrl={profile.avatar_url}
        shareUrl={profileUrl(profile.username)}
      />

      <main id="main" className="lg:pl-[16.5rem]">
        <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </div>
      </main>

      <TabBar counts={counts} />
    </div>
  );
}
