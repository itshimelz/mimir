// FILE: page.tsx
// Purpose: Public marketing homepage for Mimir (M3E expressive rebuild).
// Layer: App Router page (server component)

import Navbar from "@/components/Navbar";
import DownloadButton from "@/components/DownloadButton";
import InstallerCount from "@/components/InstallerCount";
import Features from "@/components/Features";
import Workflow from "@/components/Workflow";
import FAQ from "@/components/FAQ";
import AskAISection from "@/components/AskAISection";
import Testimonials from "@/components/Testimonials";
import ClosingCTA from "@/components/ClosingCTA";
import SiteFooter from "@/components/SiteFooter";
import PrivacySection from "@/components/PrivacySection";
import HomepageRail from "@/components/HomepageRail";
import ProviderMarkRow from "@/components/ProviderMarkRow";
import { MButton } from "@/components/m3e/button";
import { MCard } from "@/components/m3e/card";
import { MIcon } from "@/components/m3e/icon";
import { MDisplay, MBody } from "@/components/m3e/type";
import { getInstallerCount } from "@/lib/installerCount";
import { PRODUCT_HERO_DESCRIPTION, PRODUCT_HERO_TITLE } from "@/data/product";
import { FAQ_JSONLD, GITHUB_REPO_URL, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const installerCount = await getInstallerCount();
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(FAQ_JSONLD) }} />
      <Navbar />
      <main>
        <section id="overview" aria-labelledby="homepage-title" className="hero-section scroll-mt-20 pt-10 pb-12 sm:pt-16 sm:pb-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <MCard variant="elevated" className="gap-0 overflow-hidden rounded-[28px] bg-[var(--md-sys-color-surface-container-low)] p-8 sm:p-12">
              <ProviderMarkRow />
              <MDisplay id="homepage-title" className="mt-8 max-w-3xl">{PRODUCT_HERO_TITLE}</MDisplay>
              <MBody data-live-hero-color="true" className="mt-5 max-w-2xl">{PRODUCT_HERO_DESCRIPTION}</MBody>
              <div className="mt-9 flex flex-wrap items-center gap-3" data-home-actions>
                <DownloadButton />
                <MButton variant="tonal" size="md" render={<a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">Star on GitHub<MIcon name="star" size={20} /></a>} />
              </div>
              <p data-live-hero-color="true" className="mt-4 text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
                <InstallerCount initialCount={installerCount} />
              </p>
            </MCard>
            <div className="relative mt-6 sm:mt-8" data-hero-preview>
              <MCard variant="filled" className="min-h-[320px] items-center justify-center rounded-[28px] bg-[var(--md-sys-color-surface-container)] p-6 sm:min-h-[420px]">
                <MBody className="text-center">Product preview</MBody>
              </MCard>
            </div>
          </div>
        </section>
        <div id="providers" className="scroll-mt-20"><Features /></div>
        <div id="workflow" className="scroll-mt-20"><Workflow /></div>
        <div id="privacy" className="scroll-mt-20"><PrivacySection /></div>
        <AskAISection />
        <FAQ />
        <Testimonials />
        <div id="download" className="scroll-mt-20"><ClosingCTA initialInstallerCount={installerCount} /></div>
      </main>
      <SiteFooter />
      <HomepageRail />
    </div>
  );
}
