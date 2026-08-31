import { getUser } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhatYouCanSend } from "@/components/marketing/what-you-can-send";
import { VaultPreview } from "@/components/marketing/vault-preview";
import { Wall } from "@/components/marketing/wall";
import { Privacy } from "@/components/marketing/privacy";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/cta";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function LandingPage() {
  const user = await getUser();
  const signedIn = Boolean(user);

  return (
    <>
      <MarketingNav signedIn={signedIn} />
      <main id="main">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <WhatYouCanSend />
        <VaultPreview />
        <Wall />
        <Privacy />
        <FAQ />
        <FinalCTA signedIn={signedIn} />
      </main>
      <MarketingFooter />
    </>
  );
}
