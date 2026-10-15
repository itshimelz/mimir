// FILE: not-found.tsx
// Purpose: Site-chromed 404 page for unmatched routes (and docs pages that
//          call notFound()). Matches the M3E design system in light and dark.
// Layer: App Router not-found (server component).

import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/m3e/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="mx-auto w-full max-w-xl text-center">
          <p className="text-label-large text-primary">404</p>
          <h1 className="mt-3 text-headline-medium text-on-surface sm:text-display-small">
            Page not found
          </h1>
          <p className="mt-5 text-body-large text-on-surface-variant">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <Button variant="filled" size="md" className="mt-8" render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
