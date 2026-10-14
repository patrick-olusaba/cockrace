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
 * of races. The camera now frames the pack rather than locking to the leader,
 * which handles that directly — but shorter still means a tighter field, and a
 * tighter field is what lets the camera come in close on a phone. See
 * VIEW_W_MIN.
 */
export const RACE_LEN = 2600;
export const FINISH_X = START_X + RACE_LEN;

// ─── Camera ─────────────────────────────────────────────────────────────────
/** Where the leader sits across the screen, 0–1. */
/**
 * Unused since the camera moved to pack-framing — the pack centres at 0.5 and
 * the leader drifts right on its own. Kept because a leader-locked camera is
 * the obvious thing to reach for, and this is the note saying it was tried:
 * at viewW 420 it dropped the back marker in 34% of races.
 */
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
    // Stand and its crowd rows MUST share a rate — a different rate would slide
    // the spectators off the seating.
    stand: 0.55,
    crowdB: 0.55,
    crowdC: 0.55,
    fence: 0.62,
    grass: 0.62,
    dirt: 1,
    // Foreground edge and turf body MUST share a rate and tile width, or the
    // ragged edge would slide off the turf it's supposed to be growing from.
    grassFg: 1.15,
    turf: 1.15,
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
    stand: 180,
    crowdB: 180,
    crowdC: 180,
    fence: 112,
    grass: 72,
    dirt: 70,
    grassFg: 72,
    turf: 72,
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

// ─── Opening camera move ────────────────────────────────────────────────────
/**
 * At the start of a countdown the view sits tight on the stand, then pulls back
 * and tilts down to the race framing. Driven per-frame off the rAF loop as a
 * viewBox lerp — not React state, or it'd re-render the tree 60x/sec.
 *
 * INTRO_BOX must hold the same 2:1 aspect as the stage (800x400) or
 * preserveAspectRatio will letterbox mid-move.
 */
/**
 * Viewport model.
 *
 * STAGE_H is authoritative — all four lanes are always on screen. The viewBox
 * WIDTH flexes with the container's aspect, so a portrait phone shows a short
 * stretch of track at full lane height instead of the whole track shrunk to a
 * letterbox strip. This is the difference between a 26px bird and a 75px one.
 *
 * VIEW_W_MIN is set by the pack, not by taste. Spread at the finish is p50 231,
 * p100 387 units. The camera frames the field, so every bird is on screen while
 * spread < viewW; 420 clears the worst case with room either side.
 *
 * It's a straight trade against bird size on a phone:
 *
 *   RACE_LEN   race     p100 spread   needs viewW   bird on a 390px phone
 *     2600     14.5s        387           418              50px      <- current
 *     2200     12.2s        369           399              53px
 *     1800     10.0s        252           273              75px
 *
 * Shortening the race tightens the pack, which lets the camera come in, which
 * makes the birds bigger. If phone-first matters more than a 14.5s race, drop
 * RACE_LEN to 1800 and VIEW_W_MIN to 280 together — they move as a pair.
 */
export const VIEW_W_MIN = 420;
export const VIEW_W_MAX = 1100;

/** Crowd bob: amplitude in units, rate, and phase per row. Different rates so
 *  the two rows never sync — a stand that pulses as one block reads as wrong. */
export const CROWD_BOB = [
    { amp: 1.9, hz: 1.7, phase: 2.1 },
    { amp: 2.3, hz: 2.9, phase: 4.2 },
] as const;

export const INTRO_MS = 2200;
export const INTRO_BOX = { x: 120, y: 18, w: 380, h: 190 } as const;