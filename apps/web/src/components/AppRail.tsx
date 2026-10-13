// FILE: AppRail.tsx
// Purpose: The rail layout's fixed icon tab strip (Home, Spaces, route destinations, Settings).
// Layer: App shell component
// Exports: AppRail, AppRailItem, AppRailPortal, AppRailSlotProvider
// Depends on: SidebarIconButton and the shared sidebar row tokens. ThreadSidebar owns the
//             items and their handlers and portals the rail into the slot the route shell
//             places left of the panel, so no handler moves out of ThreadSidebar.

import {
  type ComponentType,
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
} from "react";
import { createPortal } from "react-dom";

import { TasksCoachmark } from "./OneTimeCoachmark";
import type { RailItemId } from "~/appRail.logic";
import { createCentralIconComponent } from "~/lib/central-icons";
import {
  BookIcon,
  ClockIcon,
  CodeReviewIcon,
  FoldersIcon,
  HomeIcon,
  HubActiveIcon,
  HubIcon,
  InboxIcon,
  SparkleIcon,
  TasksIcon,
} from "~/lib/icons";
import { projectAppearanceKey, type ProjectAppearance } from "~/lib/projectAppearance";
import { cn } from "~/lib/utils";
import { ProjectSidebarIcon } from "./ProjectSidebarIcon";
import type { SidebarActionBadge } from "./Sidebar.logic";
import { SidebarIconButton } from "./SidebarIconButton";

type RailGlyph = ComponentType<{ className?: string }>;
/** A rail button's glyph pair: outline at rest, filled while active (like Codex). */
export type AppRailGlyphs = { readonly idle: RailGlyph; readonly active: RailGlyph };

// Glyph components are cached so a shortcut keeps one component identity across renders.
const glyphCache = new Map<string, AppRailGlyphs>();

/** Rail glyphs for a Central icon name (rail items and Space shortcuts). */
export function railCentralGlyphs(name: string): AppRailGlyphs {
  const cacheKey = `central:${name}`;
  const cached = glyphCache.get(cacheKey);
  if (cached) return cached;
  const glyphs = {
    idle: createCentralIconComponent(name),
    active: createCentralIconComponent(name, "fill"),
  };
  glyphCache.set(cacheKey, glyphs);
  return glyphs;
}

/** Rail glyphs for a project shortcut: the same glyph its sidebar row shows. */
export function railProjectGlyphs(
  cwd: string,
  appearance: ProjectAppearance | null,
): AppRailGlyphs {
  const cacheKey = `project:${cwd}:${projectAppearanceKey(appearance)}`;
  const cached = glyphCache.get(cacheKey);
  if (cached) return cached;
  function ProjectRailGlyph({ className }: { className?: string }) {
    return (
      <ProjectSidebarIcon
        cwd={cwd}
        expanded={false}
        appearance={appearance}
        {...(className ? { glyphClassName: className } : {})}
      />
    );
  }
  const glyphs = { idle: ProjectRailGlyph, active: ProjectRailGlyph };
  glyphCache.set(cacheKey, glyphs);
  return glyphs;
}

/** A rail item whose glyph has no solid twin: the same icon at rest and while active. */
const sameGlyphs = (glyph: RailGlyph): AppRailGlyphs => ({ idle: glyph, active: glyph });

/** Hugeicons rail items. Only Hubs ship a solid active glyph; the rest match at rest and active. */
type HugeiconRailItemId =
  | "home"
  | "inbox"
  | "pullRequests"
  | "automations"
  | "tasks"
  | "spaces"
  | "studio";
const RAIL_HUGEICON_GLYPHS: Record<HugeiconRailItemId, AppRailGlyphs> = {
  home: sameGlyphs(HomeIcon),
  inbox: sameGlyphs(InboxIcon),
  pullRequests: sameGlyphs(CodeReviewIcon),
  automations: sameGlyphs(ClockIcon),
  tasks: sameGlyphs(TasksIcon),
  spaces: sameGlyphs(BookIcon),
  // Studio: sparkles icon representing agent-crafted academic outputs.
  studio: sameGlyphs(SparkleIcon),
};

/** Central glyphs matching the Codex rail for the remaining fixed rail items. */
const RAIL_ITEM_GLYPH_NAMES: Record<Exclude<RailItemId, HugeiconRailItemId>, string> = {
  kanban: "columns-3-wide",
  settings: "settings-gear-4",
};

function isHugeiconRailItem(id: RailItemId): id is HugeiconRailItemId {
  return id in RAIL_HUGEICON_GLYPHS;
}

export function railItemGlyphs(id: RailItemId): AppRailGlyphs {
  if (isHugeiconRailItem(id)) return RAIL_HUGEICON_GLYPHS[id];
  return railCentralGlyphs(RAIL_ITEM_GLYPH_NAMES[id]);
}

/** The rail's "more" glyph (Codex's "…"). */
export const RAIL_MORE_GLYPHS = railCentralGlyphs("dot-grid-1x3-horizontal");

export type AppRailItem = {
  /** A rail item id, or a shortcut key ("space:…" / "project:…"). */
  readonly id: string;
  readonly glyphs: AppRailGlyphs;
  readonly label: string;
  readonly badge: SidebarActionBadge | null;
  readonly active: boolean;
  readonly onSelect: () => void;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
};

type AppRailProps = {
  items: ReadonlyArray<AppRailItem>;
  /** Spaces and projects the user added from the "…" menu, below the fixed items. */
  shortcuts: ReadonlyArray<AppRailItem>;
  /** The "…" menu trigger, after the shortcuts. */
  moreSlot?: ReactNode;
  bottomItems: ReadonlyArray<AppRailItem>;
  /** Rendered above the bottom items (the usage rings, then the Help menu like Codex's rail). */
  bottomSlot?: ReactNode;
  /** Right-click on the rail (offers "Customize"). */
  onContextMenu?: ((event: MouseEvent) => void) | undefined;
};

/** Rail glyph size (M3 nav icon is 24dp), shared with controls rendered into the rail
 *  slot (the Help menu). */
export const APP_RAIL_GLYPH_CLASS_NAME = "size-5";

/** Rail item box in ChatGPT dock style (36×36px squircle with continuous curvature). */
export function appRailButtonClassName(): string {
  return cn(
    "app-rail-item size-9 rounded-[10px] p-0 flex items-center justify-center",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
  );
}

function AppRailButton({ item }: { item: AppRailItem }) {
  const label = item.badge ? `${item.label} · ${item.badge.accessibleLabel}` : item.label;
  const Glyph = item.active ? item.glyphs.active : item.glyphs.idle;
  const button = (
    <SidebarIconButton
      icon={Glyph}
      iconClassName={APP_RAIL_GLYPH_CLASS_NAME}
      label={label}
      size="lg"
      tooltip={item.id === "tasks" ? undefined : label}
      tooltipSide="right"
      aria-current={item.active ? "page" : undefined}
      data-active={item.active ? "" : undefined}
      className={appRailButtonClassName()}
      onClick={item.onSelect}
      {...(item.onMouseEnter ? { onMouseEnter: item.onMouseEnter } : {})}
      {...(item.onFocus ? { onFocus: item.onFocus } : {})}
    >
      <span className="app-rail-glyph">
        <Glyph />
      </span>
    </SidebarIconButton>
  );
  return (
    <div className="app-rail-item-wrap relative shrink-0">
      {item.id === "tasks" ? <TasksCoachmark tooltip={label}>{button}</TasksCoachmark> : button}
      {/* Unread marker dot */}
      {item.badge ? (
        <span
          aria-hidden
          className="app-rail-badge pointer-events-none absolute top-1 right-1 size-1.5 rounded-full"
        />
      ) : null}
    </div>
  );
}

export function AppRail({
  items,
  shortcuts,
  moreSlot,
  bottomItems,
  bottomSlot,
  onContextMenu,
}: AppRailProps) {
  return (
    <nav
      aria-label="Primary"
      onContextMenu={onContextMenu}
      className="flex w-(--app-rail-width) shrink-0 flex-col items-center gap-2 px-1.5 py-2.5 font-system-ui select-none"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto [scrollbar-width:none]">
        {items.map((item) => (
          <AppRailButton key={item.id} item={item} />
        ))}
        {shortcuts.length > 0 ? (
          <>
            <div
              aria-hidden
              className="my-1 h-px w-5 shrink-0 bg-[var(--app-rail-inset-border)] opacity-60"
            />
            {shortcuts.map((item) => (
              <AppRailButton key={item.id} item={item} />
            ))}
          </>
        ) : null}
        {moreSlot}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        {bottomSlot}
        {bottomItems.map((item) => (
          <AppRailButton key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}

const AppRailSlotContext = createContext<HTMLElement | null>(null);

/** Provided by the route shell with the element the rail renders into. */
export const AppRailSlotProvider = AppRailSlotContext.Provider;

/** The element the rail renders into (null until the shell mounts); anchors rail popovers. */
export function useAppRailSlot(): HTMLElement | null {
  return useContext(AppRailSlotContext);
}

/** Renders the rail into the shell's slot; nothing until the slot is mounted. */
export function AppRailPortal(props: AppRailProps) {
  const slot = useContext(AppRailSlotContext);
  return slot ? createPortal(<AppRail {...props} />, slot) : null;
}
