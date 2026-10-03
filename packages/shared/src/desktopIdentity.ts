// FILE: desktopIdentity.ts
// Purpose: Defines the canonical desktop application identity across packaging and runtime.

export const SYNARA_DESKTOP_SCHEME = "mimir";
export const SYNARA_DESKTOP_ORIGIN = `${SYNARA_DESKTOP_SCHEME}://app`;
export const SYNARA_DESKTOP_ENTRY_URL = `${SYNARA_DESKTOP_ORIGIN}/index.html`;
export const SYNARA_DESKTOP_UPDATE_CHANNEL = "mimir";
export const SYNARA_PRODUCTION_BUNDLE_ID = "com.itshimelz.mimir";
export const SYNARA_DEVELOPMENT_BUNDLE_ID = `${SYNARA_PRODUCTION_BUNDLE_ID}.dev`;
export const SYNARA_CANARY_BUNDLE_ID = `${SYNARA_PRODUCTION_BUNDLE_ID}.canary`;
/** Display/setup identity of the GUI host; this value does not confer native authority. */
export const SYNARA_DESKTOP_BUNDLE_ID_ENV = "SYNARA_DESKTOP_BUNDLE_ID";
export const SYNARA_CANARY_DESKTOP_SCHEME = "mimir-canary";
export const SYNARA_CANARY_DESKTOP_ORIGIN = `${SYNARA_CANARY_DESKTOP_SCHEME}://app`;
export const SYNARA_CANARY_DESKTOP_ENTRY_URL = `${SYNARA_CANARY_DESKTOP_ORIGIN}/index.html`;
export const SYNARA_CUA_BUNDLE_ID = `${SYNARA_PRODUCTION_BUNDLE_ID}.cua`;
export const SYNARA_CUA_DESKTOP_SCHEME = "mimir-cua";
export const SYNARA_CUA_DESKTOP_ORIGIN = `${SYNARA_CUA_DESKTOP_SCHEME}://app`;
export const SYNARA_CUA_DESKTOP_ENTRY_URL = `${SYNARA_CUA_DESKTOP_ORIGIN}/index.html`;
export const SYNARA_BETA_BUNDLE_ID = `${SYNARA_PRODUCTION_BUNDLE_ID}.beta`;
export const SYNARA_BETA_DESKTOP_SCHEME = "mimir-beta";
export const SYNARA_BETA_DESKTOP_ORIGIN = `${SYNARA_BETA_DESKTOP_SCHEME}://app`;
export const SYNARA_BETA_DESKTOP_ENTRY_URL = `${SYNARA_BETA_DESKTOP_ORIGIN}/index.html`;
export const SYNARA_SOURCE_DESKTOP_BUILD_MARKER = "mimir-source-desktop-build-v2";
export const SYNARA_DESKTOP_SMOKE_USER_DATA_ENV = "SYNARA_DESKTOP_SMOKE_USER_DATA";

export type SynaraDesktopFlavor = "production" | "development" | "canary" | "cua" | "beta";
export const SYNARA_PACKAGED_DESKTOP_FLAVORS = ["production", "canary", "cua", "beta"] as const;
export type SynaraPackagedDesktopFlavor = (typeof SYNARA_PACKAGED_DESKTOP_FLAVORS)[number];

/**
 * electron-updater matches the update channel against the release tag's
 * prerelease identifier, so the beta flavor must use the `beta` channel to see
 * `vX.Y.Z-beta.N` releases. Every other flavor keeps the `mimir` channel.
 */
export function desktopUpdateChannel(flavor: SynaraDesktopFlavor): string {
  return flavor === "beta" ? "beta" : SYNARA_DESKTOP_UPDATE_CHANNEL;
}

export interface SynaraDesktopIdentity {
  readonly flavor: SynaraDesktopFlavor;
  readonly displayName: string;
  readonly bundleId: string;
  readonly scheme: string;
  readonly origin: string;
  readonly entryUrl: string;
  readonly userDataDirectoryName: string;
  readonly defaultHomeDirectoryName: string;
  readonly usesScriptedUpdates: boolean;
}

export function resolveSynaraDesktopFlavor(input: {
  readonly isDevelopment: boolean;
  readonly requestedFlavor?: string | undefined;
  readonly allowDevelopmentOverride?: boolean | undefined;
}): SynaraDesktopFlavor {
  const requestedFlavor = input.requestedFlavor?.trim().toLowerCase();
  if (requestedFlavor === "cua") {
    return "cua";
  }
  if (requestedFlavor === "canary") {
    return "canary";
  }
  if (requestedFlavor === "beta") {
    return "beta";
  }
  if (
    requestedFlavor === "development" &&
    (input.isDevelopment || input.allowDevelopmentOverride === true)
  ) {
    return "development";
  }
  return input.isDevelopment ? "development" : "production";
}

/** Packaged identity is fixed when the artifact is staged, before it is signed. */
export function resolveSynaraDesktopRuntimeFlavor(input: {
  readonly isPackaged: boolean;
  readonly isDevelopment: boolean;
  readonly packagedFlavor?: unknown;
  readonly requestedFlavor?: string | undefined;
  readonly allowDevelopmentOverride?: boolean | undefined;
}): SynaraDesktopFlavor {
  if (input.isPackaged && input.packagedFlavor !== undefined) {
    const flavor = input.packagedFlavor;
    if (flavor === "production" || flavor === "canary" || flavor === "cua" || flavor === "beta") {
      return flavor;
    }
    throw new Error("The packaged Mimir desktop flavor is invalid. Rebuild the application.");
  }
  // Source launchers also use an app bundle on macOS. Their build marker keeps
  // the existing environment-based routing, while legacy packaged apps remain
  // Stable even when a developer shell happens to export a different flavor.
  if (input.isPackaged && input.allowDevelopmentOverride !== true) {
    return "production";
  }
  return resolveSynaraDesktopFlavor(input);
}

export function canOverrideDesktopSmokeUserData(input: {
  readonly packagedFlavor?: unknown;
  readonly sourceBuildMarker?: string | undefined;
}): boolean {
  return (
    input.packagedFlavor === "cua" ||
    input.packagedFlavor === "beta" ||
    (input.packagedFlavor === undefined &&
      input.sourceBuildMarker === SYNARA_SOURCE_DESKTOP_BUILD_MARKER)
  );
}

export function synaraDesktopIdentity(flavor: SynaraDesktopFlavor): SynaraDesktopIdentity {
  if (flavor === "cua") {
    return {
      flavor,
      displayName: "Mimir Cua",
      bundleId: SYNARA_CUA_BUNDLE_ID,
      scheme: SYNARA_CUA_DESKTOP_SCHEME,
      origin: SYNARA_CUA_DESKTOP_ORIGIN,
      entryUrl: SYNARA_CUA_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-cua",
      defaultHomeDirectoryName: ".mimir-cua",
      usesScriptedUpdates: true,
    };
  }
  if (flavor === "canary") {
    return {
      flavor,
      displayName: "Mimir Canary",
      bundleId: SYNARA_CANARY_BUNDLE_ID,
      scheme: SYNARA_CANARY_DESKTOP_SCHEME,
      origin: SYNARA_CANARY_DESKTOP_ORIGIN,
      entryUrl: SYNARA_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-canary",
      defaultHomeDirectoryName: ".mimir-canary",
      usesScriptedUpdates: true,
    };
  }
  if (flavor === "beta") {
    return {
      flavor,
      displayName: "Mimir Beta",
      bundleId: SYNARA_BETA_BUNDLE_ID,
      scheme: SYNARA_BETA_DESKTOP_SCHEME,
      origin: SYNARA_BETA_DESKTOP_ORIGIN,
      entryUrl: SYNARA_BETA_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-beta",
      defaultHomeDirectoryName: ".mimir-beta",
      usesScriptedUpdates: false,
    };
  }
  if (flavor === "development") {
    return {
      flavor,
      displayName: "Mimir (Dev)",
      bundleId: SYNARA_DEVELOPMENT_BUNDLE_ID,
      scheme: SYNARA_DESKTOP_SCHEME,
      origin: SYNARA_DESKTOP_ORIGIN,
      entryUrl: SYNARA_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-dev",
      defaultHomeDirectoryName: ".mimir-dev",
      usesScriptedUpdates: false,
    };
  }
  return {
    flavor,
    displayName: "Mimir",
    bundleId: SYNARA_PRODUCTION_BUNDLE_ID,
    scheme: SYNARA_DESKTOP_SCHEME,
    origin: SYNARA_DESKTOP_ORIGIN,
    entryUrl: SYNARA_DESKTOP_ENTRY_URL,
    userDataDirectoryName: "mimir",
    defaultHomeDirectoryName: ".mimir",
    usesScriptedUpdates: false,
  };
}

/**
 * Installed file names, as produced by electron-builder. These used to be
 * hand-written literals in the beta channel and the Linux build config, which
 * is how the production Linux executable stayed `synara` after the display name
 * changed. Derive them so a flavor rename cannot leave a stale binary behind.
 */
export interface SynaraDesktopInstallNames {
  /** macOS bundle, e.g. `Mimir Beta.app`. */
  readonly macAppName: string;
  /** macOS `Contents/MacOS` executable, e.g. `Mimir Beta`. */
  readonly macExecutableName: string;
  /** Windows installer executable, e.g. `Mimir Beta.exe`. */
  readonly windowsExecutableName: string;
  /** Linux executable; electron-builder derives it from the storage profile. */
  readonly linuxExecutableName: string;
  /** Linux XDG desktop entry, e.g. `mimir-beta.desktop`. */
  readonly linuxDesktopFileName: string;
  /** Linux window-manager class, used for taskbar grouping and the icon. */
  readonly linuxStartupWmClass: string;
}

export function synaraDesktopInstallNames(flavor: SynaraDesktopFlavor): SynaraDesktopInstallNames {
  const identity = synaraDesktopIdentity(flavor);
  return {
    macAppName: `${identity.displayName}.app`,
    macExecutableName: identity.displayName,
    windowsExecutableName: `${identity.displayName}.exe`,
    linuxExecutableName: identity.userDataDirectoryName,
    linuxDesktopFileName: `${identity.userDataDirectoryName}.desktop`,
    linuxStartupWmClass: identity.userDataDirectoryName,
  };
}
