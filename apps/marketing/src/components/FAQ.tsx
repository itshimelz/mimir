// FILE: FAQ.tsx
// Purpose: Renders homepage FAQs from the shared answer contract as an M3E accordion.
// Layer: Marketing UI section

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/m3e/accordion";
import { FAQ_ITEMS } from "@/data/faqs";

export default function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-20 border-t border-outline-variant py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-label-large text-primary font-medium tracking-wide">
            Product questions
          </p>
          <h2
            id="faq-heading"
            className="mt-3 text-headline-medium text-on-surface sm:text-headline-large text-balance"
          >
            Understand the boundary before you run the work.
          </h2>
          <p className="mt-4 max-w-xl text-body-large text-on-surface-variant text-pretty leading-relaxed">
            How providers, subscriptions, study tasks, provider handoffs, and local course data fit
            together.
          </p>
        </div>

        <Accordion multiple={false} className="mt-10 sm:mt-12">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger className="text-balance">{question}</AccordionTrigger>
              <AccordionContent>
                <p className="pb-4 text-body-medium text-on-surface-variant leading-relaxed text-pretty">
                  {answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
