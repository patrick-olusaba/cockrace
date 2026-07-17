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

/** Vertical body travel. Two rises per stride — one per foot push. */
export function bodyBob(cycle: number, speedNorm: number): number {
    const amp = 2 + speedNorm * 4.5;
    return Math.abs(Math.sin(cycle * Math.PI * 2)) * amp;
}

/** Forward pitch, in degrees. Nose-down, and more of it at speed. */
export function bodyLean(speedNorm: number): number {
    return 2 + speedNorm * 7;
}