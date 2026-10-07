// FILE: ComposerEffortSliderCard.tsx
// Purpose: Slider-style effort control for the composer model picker's footer (fast toggle,
//   effort label, reset, and a stepped slider).
// Layer: Chat composer presentation
// Depends on: shared trait resolution + effort-change planning, the trait commit hook,
//   and the shared Slider primitive.

import type {
  ProviderInstanceId,
  ProviderKind,
  ProviderModelDescriptor,
  ThreadId,
} from "@synara/contracts";

import { ResetIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import type { ProviderOptions } from "../../providerModelOptions";
import { Slider } from "../ui/slider";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import {
  getComposerTraitSelection,
  planComposerEffortChange,
  resolveComposerEffortLadderIndex,
  resolveComposerTraitStatusLabel,
  supportsComposerFastModeControl,
} from "./composerTraits";
import { FastModeToggle } from "./TraitsPicker";
import { useComposerTraitCommit } from "./useComposerTraitCommit";

type ComposerEffortSliderCardProps = {
  provider: ProviderKind;
  providerInstanceId?: ProviderInstanceId | null | undefined;
  threadId: ThreadId;
  model: string | null | undefined;
  runtimeModel?: ProviderModelDescriptor | undefined;
  modelOptions: ProviderOptions | null | undefined;
  prompt: string;
  onPromptChange: (prompt: string) => void;
};

const CARD_ICON_BUTTON_CLASS_NAME =
  "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all motion-spatial-fast hover:bg-foreground/10 active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-35";

// Effort ladder as a stepped slider. Every level the model exposes is one stop
// (including prompt-injected ones such as Ultrathink), so the ladder matches the
// radio menu exactly; changes commit immediately and keep the menu open so the label
// and thumb update in place.
export function ComposerEffortSliderCard(props: ComposerEffortSliderCardProps) {
  const { provider, threadId, model, modelOptions, prompt, onPromptChange } = props;
  const selection = getComposerTraitSelection(
    provider,
    model,
    prompt,
    modelOptions,
    props.runtimeModel,
  );
  const { effortLevels, defaultEffort, effort, fastModeEnabled, ultrathinkPromptControlled } =
    selection;
  const supportsFastMode = supportsComposerFastModeControl(selection);
  const commitTrait = useComposerTraitCommit({
    threadId,
    provider,
    providerInstanceId: props.providerInstanceId,
    model,
    modelOptions,
  });

  const ladderIndex = resolveComposerEffortLadderIndex(selection);
  const activeLevel = effortLevels[ladderIndex];
  const statusLabel = resolveComposerTraitStatusLabel(selection) ?? activeLevel?.label ?? "Effort";
  const effortIsDefault = ultrathinkPromptControlled || effort === defaultEffort;
  const canReset = fastModeEnabled || !effortIsDefault;

  const lastIndex = Math.max(effortLevels.length - 1, 0);

  const handleSliderChange = (nextIndex: number) => {
    if (nextIndex === ladderIndex) return;
    const nextLevel = effortLevels[nextIndex];
    if (!nextLevel) return;
    const plan = planComposerEffortChange({ provider, selection, prompt, value: nextLevel.value });
    if (!plan) return;
    if (plan.kind === "prompt") {
      onPromptChange(plan.prompt);
      return;
    }
    commitTrait(plan.patch);
  };

  const handleReset = () => {
    const effortPlan =
      defaultEffort && !effortIsDefault
        ? planComposerEffortChange({ provider, selection, prompt, value: defaultEffort })
        : null;
    commitTrait({
      ...(effortPlan?.kind === "options" ? effortPlan.patch : {}),
      ...(fastModeEnabled ? { fastMode: false } : {}),
    });
  };

  return (
    <div className="px-2 pt-1 pb-2" data-slot="effort-slider-card">
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] items-center gap-1.5 pb-1">
        {supportsFastMode ? (
          <FastModeToggle
            tone="accent"
            enabled={fastModeEnabled}
            onToggle={() => commitTrait({ fastMode: !fastModeEnabled })}
          />
        ) : (
          <span aria-hidden="true" className="size-6" />
        )}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/12 px-3 py-0.5 text-center font-medium text-ui text-primary">
            {statusLabel}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Reset effort and speed"
                disabled={!canReset}
                className={cn(
                  CARD_ICON_BUTTON_CLASS_NAME,
                  "text-muted-foreground/70 hover:text-foreground",
                )}
                onClick={handleReset}
              />
            }
          >
            <ResetIcon aria-hidden="true" className="size-3.5" />
          </TooltipTrigger>
          <TooltipPopup side="top" variant="picker">
            Reset to defaults
          </TooltipPopup>
        </Tooltip>
      </div>
      <div className="mt-1 px-0.5">
        <Slider
          value={ladderIndex}
          min={0}
          max={lastIndex}
          step={1}
          size="large"
          showStepMarks
          magnetic
          disabled={ultrathinkPromptControlled}
          aria-label="Reasoning effort"
          getAriaValueText={(index) => effortLevels[index]?.label ?? String(index)}
          onValueChange={handleSliderChange}
        />
      </div>
      {ultrathinkPromptControlled ? (
        <div className="px-1 pt-1 text-muted-foreground/80 text-ui leading-snug">
          Remove Ultrathink from the prompt to change effort.
        </div>
      ) : null}
    </div>
  );
}
