// ─── Gait ───────────────────────────────────────────────────────────────────
// A chicken's run cycle, split into stance and swing.
//
// The old 3D rig rotated a rigid leg from the hip with a sine — a metronome,
// not a run. Two things make it read as a bird instead:
//   1. the knee folds hard on recovery and stays near-straight under load;
//   2. the stance is longer than the swing (55/45), so the foot spends most of
//      the cycle planted and the body passes over it.

export interface LegPose {
    /** Hip rotation, degrees. */
    hip: number;
    /** Knee rotation, degrees. 0 = rigid stick (the old behaviour). */
    knee: number;
}

const STANCE = 0.55;

/**
 * @param u      cycle position; only the fractional part matters
 * @param bendKnee false reproduces the old rigid-pendulum leg
 */
export function legPose(u: number, bendKnee = true): LegPose {
    const t = u - Math.floor(u);

    if (t < STANCE) {
        // Planted. Sweeps forward → back; knee gives slightly under load.
        const s = t / STANCE;
        return {
            hip: 30 - s * 60,
            knee: bendKnee ? 8 + Math.sin(s * Math.PI) * 7 : 0,
        };
    }

    // Airborne. Swings back → forward with the knee folded up out of the way.
    const s = (t - STANCE) / (1 - STANCE);
    return {
        hip: -30 + s * 60,
        knee: bendKnee ? 8 + Math.sin(s * Math.PI) * 74 : 0,
    };
}

/** Keeps the foot flat to the ground regardless of what hip and knee are doing. */
export function footAngle(p: LegPose): number {
    return -p.hip - p.knee;
}

/** Strides per second. Faster birds take faster steps, not longer ones. */
export function strideHz(speedNorm: number): number {
    return 1.4 + speedNorm * 4.4;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Push-off happens at the END of stance, so the near leg unloads at t=STANCE
 * and the far leg (half a cycle behind) at t=STANCE-0.5. Everything below is
 * phased off that, not off t=0.
 */
const PUSH = STANCE - 0.5; // 0.05

/** Half-stride position, 0 at push-off. Two per cycle, one per foot. */
function halfStride(cycle: number): number {
    const p = (cycle - PUSH) * 2;
    return p - Math.floor(p);
}

/**
 * Vertical body travel. Two rises per stride — one per foot push.
 *
 * The old `abs(sin)` peaked at t=0.25/0.75, which is mid-stance: the body was
 * highest exactly when the leg was most loaded, i.e. upside down. It's also
 * symmetric, and a run isn't — the body falls under gravity for most of the
 * cycle and is flung back up in a short push. Slow fall, fast rise.
 */
export function bodyBob(cycle: number, speedNorm: number): number {
    const amp = 2 + speedNorm * 4.5;
    const p = halfStride(cycle);
    const FALL = 0.65;
    const h = p < FALL ? 1 - p / FALL : (p - FALL) / (1 - FALL);
    return smooth(h) * amp;
}

/**
 * Fore-aft body travel, rig units. A biped doesn't advance at a constant rate:
 * it decelerates against the planted leg and is thrown forward on push-off.
 * Applied to the body, not the root — the shadow stays where the feet are.
 */
export function bodySurge(cycle: number, speedNorm: number): number {
    const amp = 1 + speedNorm * 3;
    return Math.cos(halfStride(cycle) * Math.PI * 2) * amp;
}

/** Fraction of the half-stride the head holds still before it snaps forward. */
const HEAD_HOLD = 0.72;

/**
 * Head thrust, rig units, relative to the body.
 *
 * This is the chicken tell. A chicken locks its head in space and lets the
 * body walk out from under it, then snaps it forward to catch up — hold,
 * thrust, hold. In body-local coordinates that hold is a straight backward
 * drift, so this is a linear ramp back then a short eased thrust forward. A
 * sine (what it replaced) is a wobble, and a wobble reads as a bouncing toy.
 */
export function headThrust(cycle: number, speedNorm: number): number {
    const amp = 3 + speedNorm * 6;
    const p = halfStride(cycle);
    if (p < HEAD_HOLD) return amp * (0.5 - p / HEAD_HOLD);
    return amp * (smooth((p - HEAD_HOLD) / (1 - HEAD_HOLD)) - 0.5);
}

/** Forward pitch, in degrees. Nose-down, and more of it at speed. */
export function bodyLean(speedNorm: number): number {
    return 2 + speedNorm * 7;
}