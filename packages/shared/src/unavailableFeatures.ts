// FILE: unavailableFeatures.ts
// Purpose: Features hidden from the UI because their backing service is not Mimir's yet.
// Layer: Shared contracts (consumed by the web UI)
//
// This is not a Beta gate. These features work; they point at infrastructure
// Mimir does not own, so they are hidden until a replacement exists. The code
// stays intact and the entry is deleted to restore the entry point, per the
// "hide, never delete" rule: deletion would cost an upstream merge forever.

/**
 * Feedback posts to Synara's public endpoint
 * (apps/web/src/feedback.ts). Mimir must not send user feedback to a server
 * it does not control. Restore when Mimir has its own endpoint.
 */
export const FEEDBACK_UNAVAILABLE_FEATURE = "feedback";

/**
 * The profile share card exports to a share URL on Synara's site
 * (apps/web/src/components/profile/shareCardExport.ts). Restore when Mimir has
 * its own domain to share to.
 */
export const SHARE_CARD_UNAVAILABLE_FEATURE = "share-card";

export const UNAVAILABLE_FEATURES: readonly string[] = [
  FEEDBACK_UNAVAILABLE_FEATURE,
  SHARE_CARD_UNAVAILABLE_FEATURE,
];

/**
 * Whether a feature's UI entry points should render. Hiding is a UI-layer
 * concern only; it is not a server-side permission and must not be described as
 * one.
 */
export function isFeatureAvailable(feature: string): boolean {
  return !UNAVAILABLE_FEATURES.includes(feature);
}
