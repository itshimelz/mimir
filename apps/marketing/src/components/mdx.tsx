import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Accordion, Accordions } from "@/components/docs/accordion";
import { Callout } from "@/components/docs/callout";
import { Card, Cards } from "@/components/docs/card";
import { Step, Steps } from "@/components/docs/steps";
import { DocsGallery, DocsImage, DocsScreenshot, DocsVideo } from "@/components/docs/media";

/*
 * Every docs page gets these without per-file imports. Headings and code
 * blocks come from the fumadocs defaults; Accordion(s), Callout, Card(s), and
 * Step(s) are M3E-based replacements so docs surfaces match the site design
 * system.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Callout,
    Card,
    Cards,
    DocsGallery,
    DocsImage,
    DocsScreenshot,
    DocsVideo,
    Step,
    Steps,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
