// FILE: MultiProjectShowcase.tsx
// Purpose: Shows persistent project and task organization across repositories.
// Layer: Marketing UI section (M3E type scale)

const sectionHeading = "text-headline-small text-on-surface sm:text-headline-medium";
const sectionBody =
  "mt-3 max-w-xl text-body-medium text-on-surface-variant sm:mt-4 sm:text-body-large";
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function MultiProjectShowcase() {
  return (
    <section className="py-12 sm:py-20">
      <div className={container}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-14">
          <div className="min-w-0">
            <h2 className={sectionHeading}>Keep every repository ready to resume.</h2>
            <p className={sectionBody}>
              Move between products, client work, and experiments without rebuilding context from
              scattered windows. Each project keeps its own tasks, provider sessions, environments,
              and activity state.
            </p>
          </div>

          <div className="relative min-w-0">
            <div className="relative isolate overflow-hidden rounded-xl p-2 ring-1 ring-outline-variant sm:rounded-2xl sm:p-3">
              <div aria-hidden className="shot-card-bg absolute inset-0 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
