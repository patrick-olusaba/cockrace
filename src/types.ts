import { RacerIdentity } from './racers';

/**
 * A racer's fixed identity plus whatever the HUD needs to know about it.
 * Live race state (x, velocity, gait phase) deliberately does NOT live here —
 * it's mutated 60x/sec in a ref by the animation loop, and routing that through
 * React state would re-render the tree every frame. See game/rig.ts.
 */
export type ChickenData = RacerIdentity;

export type GamePhase = 'betting' | 'countdown' | 'racing' | 'result';