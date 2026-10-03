export const APP_BASE_NAME = "Mimir";
const isCanaryDesktop =
  typeof window !== "undefined" && window.location?.protocol === "mimir-canary:";
const isBetaDesktop = typeof window !== "undefined" && window.location?.protocol === "mimir-beta:";
export const APP_DISPLAY_NAME = isCanaryDesktop
  ? "Mimir Canary"
  : isBetaDesktop
    ? "Mimir Beta"
    : import.meta.env.DEV
      ? `${APP_BASE_NAME} (Dev)`
      : APP_BASE_NAME;
export const APP_VERSION = import.meta.env.APP_VERSION || "0.0.0";
