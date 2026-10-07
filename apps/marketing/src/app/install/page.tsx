// FILE: install/page.tsx
// Purpose: Dedicated download page for macOS, Windows, and Linux installers.
// Layer: App Router page

import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import InstallOptions from "@/components/InstallOptions";
import { PRODUCT_CATEGORY } from "@/data/product";
import { getReleaseDownloads } from "@/lib/releases";
import { getStoredInstallerCount } from "@/lib/installerCount";
import { INSTALL_JSONLD, breadcrumbJsonLd, jsonLdScript, pageMetadata } from "@/lib/seo";

const INSTALL_PAGE_JSONLD = [
  INSTALL_JSONLD,
  breadcrumbJsonLd([
    { name: "Mimir", path: "/" },
    { name: "Download", path: "/install" },
  ]),
];

export const metadata = pageMetadata({
  title: "Download Mimir — Coding Agent Workspace",
  description: `Download Mimir for macOS, Windows, and Linux. ${PRODUCT_CATEGORY}`,
  path: "/install",
});

// Release artifacts change rarely; rebuild this route at most every 30 minutes.
export const revalidate = 1800;

export default async function InstallPage() {
  redirect("/");
  const [downloads, installerCount] = [await getReleaseDownloads(), getStoredInstallerCount()];

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(INSTALL_PAGE_JSONLD) }}
      />
      <Navbar />

      <main id="main-content">
        <section aria-labelledby="install-heading" className="pt-10 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
            <p className="text-label-large text-primary">{PRODUCT_CATEGORY}</p>
            <h1
              id="install-heading"
              className="mt-4 text-display-small text-on-surface sm:text-display-medium"
            >
              Download Mimir
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-body-large text-on-surface-variant">
              Install the desktop app, connect a coding-agent runtime already authenticated on your
              machine, and start with one repository and one bounded task.
            </p>

            <div className="mt-12">
              <InstallOptions downloads={downloads} installerCount={installerCount} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
