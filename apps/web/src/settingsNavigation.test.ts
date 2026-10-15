import { MCP_CONNECTORS_BETA_FEATURE } from "@synara/shared/betaFeatures";
import { isFeatureAvailable } from "@synara/shared/unavailableFeatures";
import { describe, expect, it } from "vitest";

import {
  isSettingsSectionAvailable,
  normalizeSettingsSection,
  SETTINGS_NAV_ITEMS,
  SETTINGS_SECTION_IDS,
} from "./settingsNavigation";

describe("settings sections", () => {
  it("hides Connectors where its Beta feature is off", () => {
    expect(isSettingsSectionAvailable("connectors", () => false)).toBe(false);
    expect(
      isSettingsSectionAvailable(
        "connectors",
        (feature) => feature === MCP_CONNECTORS_BETA_FEATURE,
      ),
    ).toBe(true);
    expect(isSettingsSectionAvailable("integrations", () => false)).toBe(true);
  });

  it("lists every available section exactly once, Connectors included off Stable", () => {
    // Tests run without a desktop protocol, which keeps Beta features on. AppSnap and
    // Computer use stay in SETTINGS_SECTION_IDS for deep-link typing but have no nav
    // entry while Mimir withholds them, so the inventory is the available sections.
    const ids = SETTINGS_NAV_ITEMS.map((item) => item.id);
    const availableSectionIds = SETTINGS_SECTION_IDS.filter(
      (id) => isSettingsSectionAvailable(id) && isFeatureAvailable(id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.toSorted()).toEqual(availableSectionIds.toSorted());
    expect(normalizeSettingsSection("connectors")).toBe("connectors");
    expect(SETTINGS_NAV_ITEMS.find((item) => item.id === "connectors")?.badge).toBe("Beta");
  });

  it("falls back to General for unknown sections", () => {
    expect(normalizeSettingsSection("nope")).toBe("general");
    expect(normalizeSettingsSection(undefined)).toBe("general");
  });
});
