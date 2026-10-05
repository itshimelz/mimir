// FILE: ClosingCTA.tsx — M3E expressive closing card.
import DownloadButton from "@/components/DownloadButton";
import InstallerCount from "@/components/InstallerCount";
import ProviderMarkRow from "@/components/ProviderMarkRow";
import { Card } from "@/components/m3e/card";
import { PRODUCT_CATEGORY, PRODUCT_HERO_TITLE } from "@/data/product";

export default function ClosingCTA({ initialInstallerCount }: { initialInstallerCount: number | null }) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
        <Card
          variant="elevated"
          size="lg"
          className="items-center rounded-2xl bg-primary-container p-10 text-center sm:p-16"
        >
          <ProviderMarkRow centered />
          <p className="mt-8 text-label-large text-on-primary-container">{PRODUCT_CATEGORY}</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-display-small text-on-primary-container sm:text-display-medium">
            {PRODUCT_HERO_TITLE}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-body-large text-on-primary-container">
            Start with one repository and one provider. Add parallel tasks, worktrees, browser
            verification, handoffs, and pull-request delivery when the work requires them.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <DownloadButton />
            <p className="text-body-small text-on-primary-container">
              Free and open source · <InstallerCount initialCount={initialInstallerCount} />
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
