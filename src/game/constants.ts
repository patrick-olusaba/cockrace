// ─── Stage geometry ─────────────────────────────────────────────────────────
// The SVG viewBox. Everything below is in these units; the stage scales to fit.
export const STAGE_W = 800;
export const STAGE_H = 400;

/** y centre of each lane, top to bottom. Index = lane, not racer id. */
export const LANE_Y = [152, 204, 256, 308];

/** Bird rig is authored ~230 units tall; this fits it to a 52-unit lane. */
export const BIRD_SCALE = 0.235;

// ─── Track ──────────────────────────────────────────────────────────────────
export const TRACK_TOP = 120;
export const TRACK_H = 216;
export const START_X = 140;

/**
 * Track length — the only dial you should touch to change race duration.
 *
 * Do NOT raise BASE_SPEED instead: strideHz is keyed to velocity, so faster
 * birds churn their legs faster, lean harder and scroll the parallax quicker.
 * Shortening the track changes the duration and nothing else.
 *
 *   LEN    duration   pack spread   last bird off-screen   photo finishes
 *   5200     29s         449u             42%                   28%
 *   3200     18s         280u              0%                   42%
 *   2600     15s         224u              0%                   51%   <- current
 *   2200     12s         197u              0%                   56%
 *   1800     10s         153u              0%                   65%
 *
 * 5200 was the old value and it dropped the last bird off the left edge in 42%
 * of races — the camera only shows STAGE_W * CAM_LEAD = 496u behind the leader,
 * and the pack spread past that. Anything at or under 3200 keeps all four on
 * screen at the line.
 */
export const RACE_LEN = 2600;
export const FINISH_X = START_X + RACE_LEN;

// ─── Camera ─────────────────────────────────────────────────────────────────
/** Where the leader sits across the screen, 0–1. */
export const CAM_LEAD = 0.62;
/** Exponential follow rate. Higher = snappier, lower = laggier. */
export const CAM_EASE = 3.6;

/**
 * Parallax factors. 1.0 = moves with the track, 0 = pinned to the camera.
 *
 * Three separate hill layers rather than one, because depth is what sells a
 * scrolling backdrop and one layer can't fake it. Rates are deliberately
 * non-harmonic: individual tiles still repeat over a race, but the layers never
 * line up the same way twice, so the composite never visibly loops.
 */
export const PARALLAX = {
    clouds: 0.04,
    mountains: 0.10,
    far: 0.18,
    treeline: 0.28,
    hills: 0.38,
    fence: 0.62,
    grass: 0.62,
    dirt: 1,
    grassFg: 1.15,
} as const;

/** Pattern tile widths. Scroll offsets are taken modulo these so the float
 *  never grows over a long race and the seam stays invisible. Widths are
 *  mutually non-harmonic for the same reason the rates are. */
export const TILE_W = {
    clouds: 420,
    mountains: 760,
    far: 620,
    treeline: 540,
    hills: 880,
    fence: 112,
    grass: 64,
    dirt: 70,
    grassFg: 64,
} as const;

export type ParallaxLayer = keyof typeof PARALLAX;

// ─── Race feel ──────────────────────────────────────────────────────────────
export const BASE_SPEED = 150;
export const SPEED_SPREAD = 26;
export const SURGE = 26;
export const JITTER = 18;
/** Speed that maps to a full-tilt gait, for normalising stride frequency. */
export const REF_SPEED = 190;

// ─── Betting ────────────────────────────────────────────────────────────────
export const PRESET_BETS = [50, 100, 250, 500];
export const MIN_BET = 50;
export const MAX_BET = 500;
export const BET_STEP = 50;
export const PAYOUT_MULT = 3.5;
export const RESULT_HOLD_MS = 4000;