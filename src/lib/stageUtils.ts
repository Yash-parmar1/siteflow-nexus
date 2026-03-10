/**
 * Normalize backend currentStage values to the 6 display stages used in the frontend.
 * Backend may send: PLANNING, ACTIVE, COMMISSIONED, IN_PROGRESS, WORK_TO_START, TESTING, etc.
 * Frontend displays: Started, WTS, WIP, TIS, Installed, Live.
 */

export const STAGE_ORDER = ["Started", "WTS", "WIP", "TIS", "Installed", "Live", "TECH_LIVE", "CASH_LIVE"] as const;
export type DisplayStage = (typeof STAGE_ORDER)[number];
const STAGE_MAP: Record<string, DisplayStage> = {
  // Direct matches (case-insensitive lookup)
  STARTED: "Started",
  PLANNING: "Started",
  SIGNED: "Started",
  NEW: "Started",
  ACQUIRED: "Started",

  WTS: "WTS",
  WORK_TO_START: "WTS",

  WIP: "WIP",
  WORK_IN_PROGRESS: "WIP",
  IN_PROGRESS: "WIP",

COMPLETED: "Installed",

  TIS: "TIS",
  TESTING: "TIS",
  TESTING_IN_SERVICE: "TIS",
  
  // Updated values
  TECH_LIVE: "TECH_LIVE",

  LIVE: "Live",
  ACTIVE: "Live",
  FINAL: "Live",
  CASH_LIVE: "CASH_LIVE",
};

/**
 * Normalize any backend stage string to one of the 6 frontend display stages.
 * Falls back to "Started" if the value is unknown.
 */
export function normalizeStage(raw: string | null | undefined): DisplayStage {
  if (!raw) return "Started";
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return STAGE_MAP[key] ?? "Started";
}

/**
 * Get the index (0-5) of a display stage in the lifecycle.
 */
export function stageIndex(stage: DisplayStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Compute a percentage progress from the stage when the backend's stored
 * progress is 0 (i.e. never set). Uses the stage position in the lifecycle.
 */
export function computeProgress(
  storedProgress: number,
  stage: DisplayStage,
  acsPlanned: number,
  acsInstalled: number
): number {
  // If backend has a real stored progress > 0, trust it
  if (storedProgress > 0) return storedProgress;

  // Derive from stage position
  const idx = stageIndex(stage);
  const stageBasedProgress = Math.round((idx / (STAGE_ORDER.length - 1)) * 100);

  // If we have planned/installed AC info, blend it in
  if (acsPlanned > 0 && idx >= 2) {
    const installRatio = Math.min(acsInstalled / acsPlanned, 1);
    // Blend: 60% stage-based + 40% install-based
    return Math.round(stageBasedProgress * 0.6 + installRatio * 100 * 0.4);
  }

  return stageBasedProgress;
}
