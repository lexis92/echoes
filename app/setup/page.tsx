import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfile } from "@/lib/supabase/server";
import { SetupFlow } from "@/components/setup/setup-flow";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: { index: false, follow: false },
};

export default async function SetupPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="relative grain min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] ember-bloom" aria-hidden />
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo href="/dashboard" />
        <ThemeToggle />
      </header>

      <main id="main" className="relative flex items-center justify-center px-6 py-10 sm:py-16">
        <Suspense fallback={null}>
          <SetupFlow profile={profile} />
        </Suspense>
      </main>
    </div>
  );
}
