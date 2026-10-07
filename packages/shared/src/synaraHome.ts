// FILE: synaraHome.ts
// Purpose: Resolves the user-level Mimir base directory without Effect, so the backend
// server and the Electron main process agree on one location during early startup.
// Exports: expandHomePath, resolveSynaraHomeDirectory, SYNARA_HOME_ENV_NAME.

import * as OS from "node:os";
import * as Path from "node:path";

export const MIMIR_HOME_ENV_NAME = "MIMIR_HOME";
export const SYNARA_HOME_ENV_NAME = MIMIR_HOME_ENV_NAME;
export const DEFAULT_MIMIR_HOME_DIRECTORY_NAME = ".mimir";
export const DEFAULT_SYNARA_HOME_DIRECTORY_NAME = DEFAULT_MIMIR_HOME_DIRECTORY_NAME;

/** Expands a leading `~` against the user's home directory; other inputs pass through. */
export function expandHomePath(input: string, homeDirectory: string = OS.homedir()): string {
  if (input === "~") {
    return homeDirectory;
  }
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return Path.join(homeDirectory, input.slice(2));
  }
  return input;
}

/**
 * Resolves the Mimir base directory the same way for every process in the install.
 *
 * Deliberately plain Node: the Electron main process needs this before Effect (or even
 * `app.whenReady()`) is available, and the login-shell environment cache has to land in
 * the same place whichever process wrote it first.
 */
export function resolveSynaraHomeDirectory(
  options: {
    /** Explicit override; falls back to `SYNARA_HOME` from `env`. */
    readonly configuredHome?: string | undefined;
    readonly env?: NodeJS.ProcessEnv;
    readonly homeDirectory?: string;
    /** Flavor-specific default (`.mimir-canary`), used only when nothing is configured. */
    readonly directoryName?: string;
  } = {},
): string {
  const homeDirectory = options.homeDirectory ?? OS.homedir();
  const env = options.env ?? process.env;
  const configured = (
    options.configuredHome ??
    env[MIMIR_HOME_ENV_NAME] ??
    env.SYNARA_HOME
  )?.trim();
  if (!configured) {
    return Path.join(homeDirectory, options.directoryName ?? DEFAULT_MIMIR_HOME_DIRECTORY_NAME);
  }
  return Path.resolve(expandHomePath(configured, homeDirectory));
}
