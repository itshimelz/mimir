// FILE: OnboardingDialog.tsx
// Purpose: First-run welcome tour: intro → role → feature tour → agents → appearance →
//          course folder → done. Owns step navigation and the per-run results the final
//          summary reads.
// Layer: Web UI overlay (mounted once from the root route)
//
// The popup is a fixed 800×540 frame for every step so the window never resizes as the
// user moves through the tour; hero steps (welcome, done) center their content in it.

import { VISIBLE_PROVIDER_DESCRIPTORS } from "../betaFeatures";
import { useEffect, useState } from "react";

import { useAppSettings } from "~/appSettings";
import { APP_BASE_NAME } from "~/branding";
import { SynaraLogo } from "~/components/SynaraLogo";
import { useAnnouncementSheetSlot } from "~/components/announcementSheetSlot";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "~/components/ui/dialog";
import { useProviderStatusesForLocalConfig } from "~/hooks/useProviderStatusesForLocalConfig";
import { useTheme } from "~/hooks/useTheme";
import { CheckIcon } from "~/lib/icons";
import { findProviderStatus } from "~/lib/providerAvailability";
import { cn } from "~/lib/utils";
import { CODE_THEME_OPTIONS } from "~/theme/theme.logic";
import { ONBOARDING_INSET_CLASS_NAME } from "./layout";
import {
  classifyProviderSetup,
  DEFAULT_LEARNER_ROLE_ID,
  describeOnboardingAgentSummary,
  findLearnerRole,
  isOnboardingSetupStep,
  nextOnboardingStep,
  ONBOARDING_STEPS,
  previousOnboardingStep,
  summarizeProviderSetup,
  type LearnerRoleId,
  type OnboardingStep,
} from "./logic";
import { useOnboardingDialogStore } from "./onboardingDialogStore";
import { OnboardingStepFooter } from "./OnboardingStepFooter";
import { DoneStep } from "./steps/DoneStep";
import { FeatureTourStep } from "./steps/FeatureTourStep";
import { ProjectStep, type OnboardingProjectResult } from "./steps/ProjectStep";
import { ProvidersStep } from "./steps/ProvidersStep";
import { RoleStep } from "./steps/RoleStep";
import { ThemeStep } from "./steps/ThemeStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { useProviderDetection } from "./useProviderDetection";

const STEP_TITLES: Record<OnboardingStep, string> = {
  welcome: `Welcome to ${APP_BASE_NAME}`,
  role: "How will you use Mimir?",
  tour: `What ${APP_BASE_NAME} can do`,
  providers: "Connect your agents",
  theme: "Pick an appearance",
  project: "Open your course folder",
  done: "You're all set",
};

const STEP_DESCRIPTIONS: Record<Exclude<OnboardingStep, "done">, string> = {
  welcome:
    "An agentic learning co-worker that works with you, in your own files. Setup takes about a minute.",
  role: "This names and dresses your space. You can change it later in Settings.",
  tour: "",
  providers: `These are the AI tools ${APP_BASE_NAME} can drive. Detected on this machine — turn off any you don't want it using.`,
  theme: "Applies live behind this window. Change it anytime in Settings → Appearance.",
  project:
    "A course folder is just a folder on your computer. Point Mimir at the one you already use — nothing to copy, import, or move.",
};

/** Welcome and Done are hero steps: centered header, no step counter, centered body. */
function isHeroStep(step: OnboardingStep): boolean {
  return step === "welcome" || step === "done";
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function OnboardingFlow(props: {
  onComplete: () => void;
  projectBusy: boolean;
  onProjectBusyChange: (busy: boolean) => void;
}) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  // Preview-only for now: the role is rendered (it names and dresses the space) but never
  // persisted, sent, or used to derive a folder. See `Docs/mimir-course-space-plan.md` §6.
  const [roleId, setRoleId] = useState<LearnerRoleId>(DEFAULT_LEARNER_ROLE_ID);
  const [projectResults, setProjectResults] = useState<ReadonlyArray<OnboardingProjectResult>>([]);
  const { settings } = useAppSettings();
  const statuses = useProviderStatusesForLocalConfig();
  const providerDetection = useProviderDetection();
  const { activeTheme } = useTheme();
  const role = findLearnerRole(roleId);

  const goBack = () => setStep(previousOnboardingStep(step));
  const goNext = () => setStep(nextOnboardingStep(step));

  // Once the user reaches a setup step the first-run gate must not auto-close the dialog.
  const markEngaged = useOnboardingDialogStore((store) => store.markEngaged);
  useEffect(() => {
    if (isOnboardingSetupStep(step)) markEngaged();
  }, [markEngaged, step]);

  const providerSummary = summarizeProviderSetup(
    VISIBLE_PROVIDER_DESCRIPTORS.map((descriptor) => ({
      provider: descriptor.kind,
      state: classifyProviderSetup({
        status: findProviderStatus(statuses, descriptor.kind),
        disabled: settings.disabledProviders.includes(descriptor.kind),
        detecting: providerDetection.detecting,
        detectionFailed: providerDetection.failed,
      }),
    })),
  );
  const themeLabel =
    CODE_THEME_OPTIONS.find((option) => option.id === activeTheme.codeThemeId)?.label ??
    activeTheme.codeThemeId;
  const doneSummary = [
    describeOnboardingAgentSummary(providerSummary),
    `${themeLabel} theme`,
    projectResults.length > 0
      ? `${plural(projectResults.length, "course folder")} added`
      : "No course folder yet",
  ].join(" · ");

  const description = step === "done" ? doneSummary : STEP_DESCRIPTIONS[step];
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const hero = isHeroStep(step);

  const primaryAction = (() => {
    switch (step) {
      case "welcome":
        return { label: "Get started", onPrimary: goNext };
      case "role":
        return { label: "Continue", onPrimary: goNext };
      case "tour":
        return { label: "Set up", onPrimary: goNext };
      case "providers":
      case "theme":
        return { label: "Continue", onPrimary: goNext };
      case "project":
        return projectResults.length > 0
          ? { label: "Continue", onPrimary: goNext }
          : { label: "Skip for now", onPrimary: goNext };
      case "done":
        return { label: `Start using ${APP_BASE_NAME}`, onPrimary: props.onComplete };
    }
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col outline-none" tabIndex={-1}>
      <DialogHeader
        className={cn(
          "gap-1.5 pt-8 pb-0",
          ONBOARDING_INSET_CLASS_NAME,
          hero && "items-center text-center",
        )}
      >
        {step === "welcome" ? <SynaraLogo aria-hidden className="mb-3.5 size-11" /> : null}
        {step === "done" ? (
          <span
            aria-hidden
            className="mb-3.5 flex size-11 items-center justify-center rounded-full bg-success/8 text-success dark:bg-success/16"
          >
            <CheckIcon className="size-5" />
          </span>
        ) : null}
        {hero ? null : (
          <span className="text-ui-sm font-medium tracking-[0.04em] text-muted-foreground/70 uppercase">
            Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
          </span>
        )}
        <DialogTitle className="text-[22px] tracking-[-0.01em]">{STEP_TITLES[step]}</DialogTitle>
        {description ? (
          <DialogDescription className="max-w-[560px] text-ui-lg leading-normal">
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto pt-6",
          ONBOARDING_INSET_CLASS_NAME,
          hero && "justify-center pb-6",
        )}
      >
        {step === "welcome" ? <WelcomeStep /> : null}
        {step === "role" ? <RoleStep value={roleId} onValueChange={setRoleId} /> : null}
        {step === "tour" ? <FeatureTourStep /> : null}
        {step === "providers" ? <ProvidersStep detection={providerDetection} /> : null}
        {step === "theme" ? <ThemeStep /> : null}
        {step === "project" ? (
          <ProjectStep
            results={projectResults}
            onBusyChange={props.onProjectBusyChange}
            onResult={(result) =>
              setProjectResults((current) =>
                current.some((entry) => entry.projectId === result.projectId)
                  ? current
                  : [...current, result],
              )
            }
          />
        ) : null}
        {step === "done" ? (
          <DoneStep spaceLabel={role.spaceLabel} spaceIcon={role.spaceIcon} />
        ) : null}
      </div>
      <OnboardingStepFooter
        step={step}
        onBack={goBack}
        onSkip={props.onComplete}
        primaryLabel={primaryAction.label}
        onPrimary={primaryAction.onPrimary}
        primaryBusy={step === "project" && props.projectBusy}
        navigationLocked={props.projectBusy}
      />
    </div>
  );
}

export function OnboardingDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  // The first-run gate already decides eligibility. Replays remain available after
  // a startup handoff, but still share the slot with any surface currently showing.
  const { open } = useAnnouncementSheetSlot(props.open, true, false);
  // Project creation cannot be aborted: closing the tour mid-create would report a skip
  // while a project still appears afterwards, so dismissal waits for it to settle.
  const [projectBusy, setProjectBusy] = useState(false);
  const handleOpenChange = (open: boolean) => {
    if (!open && projectBusy) return;
    props.onOpenChange(open);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup showCloseButton className="h-[540px] max-h-full max-w-[800px]">
        {/* Remount per open so a replay from Settings starts at the first step. */}
        {open ? (
          <OnboardingFlow
            onComplete={props.onComplete}
            projectBusy={projectBusy}
            onProjectBusyChange={setProjectBusy}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
