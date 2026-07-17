import { RacerIdentity } from '../racers';
import { BASE_SPEED, SPEED_SPREAD, START_X } from './constants';

// ─── Rig ────────────────────────────────────────────────────────────────────
// Handles to the SVG nodes the animation loop writes to every frame.
// These are deliberately outside React: setting 12 transforms per bird per
// frame through state would thrash the reconciler for no benefit. React owns
// the structure, the loop owns the motion — the same split @react-three/fiber
// was doing for us with useFrame.

export interface LegRig {
    hip: SVGGElement | null;
    knee: SVGGElement | null;
    foot: SVGGElement | null;
}

export interface BirdRig {
    root: SVGGElement | null;
    body: SVGGElement | null;
    head: SVGGElement | null;
    tail: SVGGElement | null;
    wing: SVGGElement | null;
    shadow: SVGEllipseElement | null;
    legNear: LegRig;
    legFar: LegRig;
}

export function emptyRig(): BirdRig {
    return {
        root: null, body: null, head: null, tail: null, wing: null, shadow: null,
        legNear: { hip: null, knee: null, foot: null },
        legFar: { hip: null, knee: null, foot: null },
    };
}

// ─── Runner ─────────────────────────────────────────────────────────────────
/** Per-race mutable state. Lives in a ref, never in React state. */
export interface Runner {
    id: number;
    lane: number;
    /** World x, in stage units. */
    x: number;
    /** Current speed, units/sec. */
    v: number;
    /** This bird's baseline speed for the race. */
    base: number;
    /** Gait cycle position, and the surge seed. */
    cycle: number;
    seed: number;
    done: boolean;
}

export function makeRunners(racers: RacerIdentity[]): Runner[] {
    return racers.map((r, lane) => ({
        id: r.id,
        lane,
        x: START_X,
        v: 0,
        base: BASE_SPEED + Math.random() * SPEED_SPREAD,
        cycle: Math.random(),
        seed: Math.random() * 9,
        done: false,
    }));
}

export function resetRunners(runners: Runner[]): void {
    for (const u of runners) {
        u.x = START_X;
        u.v = 0;
        u.base = BASE_SPEED + Math.random() * SPEED_SPREAD;
        u.cycle = Math.random();
        u.seed = Math.random() * 9;
        u.done = false;
    }
}