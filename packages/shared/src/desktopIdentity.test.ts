import { describe, expect, it } from "vitest";

import {
  desktopUpdateChannel,
  resolveSynaraDesktopFlavor,
  resolveSynaraDesktopRuntimeFlavor,
  canOverrideDesktopSmokeUserData,
  SYNARA_SOURCE_DESKTOP_BUILD_MARKER,
  SYNARA_BETA_BUNDLE_ID,
  SYNARA_BETA_DESKTOP_ENTRY_URL,
  SYNARA_BETA_DESKTOP_ORIGIN,
  SYNARA_CANARY_BUNDLE_ID,
  SYNARA_CANARY_DESKTOP_ENTRY_URL,
  SYNARA_CANARY_DESKTOP_ORIGIN,
  SYNARA_CUA_BUNDLE_ID,
  SYNARA_CUA_DESKTOP_ENTRY_URL,
  SYNARA_CUA_DESKTOP_ORIGIN,
  SYNARA_DESKTOP_ENTRY_URL,
  SYNARA_DESKTOP_ORIGIN,
  SYNARA_DESKTOP_UPDATE_CHANNEL,
  SYNARA_DEVELOPMENT_BUNDLE_ID,
  SYNARA_PRODUCTION_BUNDLE_ID,
  synaraDesktopIdentity,
} from "./desktopIdentity";

describe("desktopIdentity", () => {
  it("uses the exact canonical production and development bundle IDs", () => {
    expect(SYNARA_PRODUCTION_BUNDLE_ID).toBe("com.itshimelz.mimir");
    expect(SYNARA_DEVELOPMENT_BUNDLE_ID).toBe("com.itshimelz.mimir.dev");
    expect(synaraDesktopIdentity("production").bundleId).toBe(SYNARA_PRODUCTION_BUNDLE_ID);
    expect(synaraDesktopIdentity("development").bundleId).toBe(SYNARA_DEVELOPMENT_BUNDLE_ID);
  });

  it("uses the exact packaged renderer origin and entry URL", () => {
    expect(SYNARA_DESKTOP_ORIGIN).toBe("mimir://app");
    expect(SYNARA_DESKTOP_ENTRY_URL).toBe("mimir://app/index.html");
  });

  it("uses the isolated Mimir desktop update channel", () => {
    expect(SYNARA_DESKTOP_UPDATE_CHANNEL).toBe("mimir");
  });

  it("matches the beta update channel to prerelease tags and keeps mimir otherwise", () => {
    expect(desktopUpdateChannel("beta")).toBe("beta");
    expect(desktopUpdateChannel("production")).toBe(SYNARA_DESKTOP_UPDATE_CHANNEL);
    expect(desktopUpdateChannel("canary")).toBe(SYNARA_DESKTOP_UPDATE_CHANNEL);
    expect(desktopUpdateChannel("development")).toBe(SYNARA_DESKTOP_UPDATE_CHANNEL);
  });

  it("gives Canary a fully separate desktop identity and storage profile", () => {
    expect(SYNARA_CANARY_BUNDLE_ID).toBe("com.itshimelz.mimir.canary");
    expect(SYNARA_CANARY_DESKTOP_ORIGIN).toBe("mimir-canary://app");
    expect(SYNARA_CANARY_DESKTOP_ENTRY_URL).toBe("mimir-canary://app/index.html");
    expect(synaraDesktopIdentity("canary")).toEqual({
      flavor: "canary",
      displayName: "Mimir Canary",
      bundleId: SYNARA_CANARY_BUNDLE_ID,
      scheme: "mimir-canary",
      origin: SYNARA_CANARY_DESKTOP_ORIGIN,
      entryUrl: SYNARA_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-canary",
      defaultHomeDirectoryName: ".mimir-canary",
      usesScriptedUpdates: true,
    });
  });

  it("gives Cua a fully separate desktop identity and storage profile", () => {
    expect(SYNARA_CUA_BUNDLE_ID).toBe("com.itshimelz.mimir.cua");
    expect(SYNARA_CUA_DESKTOP_ORIGIN).toBe("mimir-cua://app");
    expect(SYNARA_CUA_DESKTOP_ENTRY_URL).toBe("mimir-cua://app/index.html");
    expect(synaraDesktopIdentity("cua")).toEqual({
      flavor: "cua",
      displayName: "Mimir Cua",
      bundleId: SYNARA_CUA_BUNDLE_ID,
      scheme: "mimir-cua",
      origin: SYNARA_CUA_DESKTOP_ORIGIN,
      entryUrl: SYNARA_CUA_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-cua",
      defaultHomeDirectoryName: ".mimir-cua",
      usesScriptedUpdates: true,
    });
  });

  it("gives Beta a fully separate desktop identity and storage profile", () => {
    expect(SYNARA_BETA_BUNDLE_ID).toBe("com.itshimelz.mimir.beta");
    expect(SYNARA_BETA_DESKTOP_ORIGIN).toBe("mimir-beta://app");
    expect(SYNARA_BETA_DESKTOP_ENTRY_URL).toBe("mimir-beta://app/index.html");
    expect(synaraDesktopIdentity("beta")).toEqual({
      flavor: "beta",
      displayName: "Mimir Beta",
      bundleId: SYNARA_BETA_BUNDLE_ID,
      scheme: "mimir-beta",
      origin: SYNARA_BETA_DESKTOP_ORIGIN,
      entryUrl: SYNARA_BETA_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "mimir-beta",
      defaultHomeDirectoryName: ".mimir-beta",
      usesScriptedUpdates: false,
    });
  });

  it("selects explicit source flavors without changing packaged Stable", () => {
    expect(resolveSynaraDesktopFlavor({ isDevelopment: false })).toBe("production");
    expect(resolveSynaraDesktopFlavor({ isDevelopment: true })).toBe("development");
    expect(
      resolveSynaraDesktopFlavor({ isDevelopment: false, requestedFlavor: "development" }),
    ).toBe("production");
    expect(
      resolveSynaraDesktopFlavor({
        isDevelopment: false,
        requestedFlavor: "development",
        allowDevelopmentOverride: true,
      }),
    ).toBe("development");
    expect(resolveSynaraDesktopFlavor({ isDevelopment: false, requestedFlavor: " canary " })).toBe(
      "canary",
    );
    expect(resolveSynaraDesktopFlavor({ isDevelopment: true, requestedFlavor: "canary" })).toBe(
      "canary",
    );
    expect(resolveSynaraDesktopFlavor({ isDevelopment: false, requestedFlavor: "cua" })).toBe(
      "cua",
    );
    expect(resolveSynaraDesktopFlavor({ isDevelopment: true, requestedFlavor: "CUA" })).toBe("cua");
    expect(resolveSynaraDesktopFlavor({ isDevelopment: false, requestedFlavor: "beta" })).toBe(
      "beta",
    );
    expect(resolveSynaraDesktopFlavor({ isDevelopment: false, requestedFlavor: " beta " })).toBe(
      "beta",
    );
    expect(resolveSynaraDesktopFlavor({ isDevelopment: true, requestedFlavor: "beta" })).toBe(
      "beta",
    );
  });

  it("isolates development and Canary homes from packaged Stable", () => {
    expect(synaraDesktopIdentity("development").defaultHomeDirectoryName).toBe(".mimir-dev");
    expect(synaraDesktopIdentity("canary").defaultHomeDirectoryName).toBe(".mimir-canary");
    expect(synaraDesktopIdentity("cua").defaultHomeDirectoryName).toBe(".mimir-cua");
    expect(synaraDesktopIdentity("beta").defaultHomeDirectoryName).toBe(".mimir-beta");
    expect(synaraDesktopIdentity("production").defaultHomeDirectoryName).toBe(".mimir");
  });

  it.each(["production", "canary", "cua", "beta"] as const)(
    "uses the immutable %s package flavor despite inherited source settings",
    (packagedFlavor) => {
      expect(
        resolveSynaraDesktopRuntimeFlavor({
          isPackaged: true,
          isDevelopment: true,
          packagedFlavor,
          requestedFlavor: "development",
          allowDevelopmentOverride: true,
        }),
      ).toBe(packagedFlavor);
    },
  );

  it("keeps legacy packaged Stable independent from a source shell's flavor", () => {
    expect(
      resolveSynaraDesktopRuntimeFlavor({
        isPackaged: true,
        isDevelopment: false,
        requestedFlavor: "cua",
      }),
    ).toBe("production");
  });

  it("preserves source launcher routing, including its bundled macOS bootstrap", () => {
    expect(
      resolveSynaraDesktopRuntimeFlavor({
        isPackaged: true,
        isDevelopment: false,
        requestedFlavor: "development",
        allowDevelopmentOverride: true,
      }),
    ).toBe("development");
    expect(
      resolveSynaraDesktopRuntimeFlavor({
        isPackaged: false,
        isDevelopment: true,
        requestedFlavor: "canary",
      }),
    ).toBe("canary");
  });

  it.each(["development", "CUA", null])(
    "rejects malformed packaged identity %j before opening any profile",
    (packagedFlavor) => {
      expect(() =>
        resolveSynaraDesktopRuntimeFlavor({
          isPackaged: true,
          isDevelopment: false,
          packagedFlavor,
        }),
      ).toThrow("packaged Mimir desktop flavor is invalid");
    },
  );

  it("isolates smoke profiles only for source launches or isolated packages", () => {
    expect(canOverrideDesktopSmokeUserData({ packagedFlavor: "cua" })).toBe(true);
    expect(canOverrideDesktopSmokeUserData({ packagedFlavor: "beta" })).toBe(true);
    expect(
      canOverrideDesktopSmokeUserData({
        sourceBuildMarker: SYNARA_SOURCE_DESKTOP_BUILD_MARKER,
      }),
    ).toBe(true);
    for (const packagedFlavor of ["production", "canary", "development", null]) {
      expect(
        canOverrideDesktopSmokeUserData({
          packagedFlavor,
          sourceBuildMarker: SYNARA_SOURCE_DESKTOP_BUILD_MARKER,
        }),
      ).toBe(false);
    }
    expect(canOverrideDesktopSmokeUserData({})).toBe(false);
  });
});
