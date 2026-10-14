// Gait self-check.  node --experimental-strip-types gait.check.ts
//
// Lives at the repo root, not in src/, so tsconfig ("include": ["src"]) never
// sees the .ts import extension that Node's type-stripping requires.
//
// ponytail: asserts, no runner. Add a real test framework when there's a second
// thing worth testing.

import assert from 'node:assert/strict';
import {
    bodyBob, bodyLean, bodySurge, footAngle, headThrust, legPose, strideHz,
} from './src/game/gait.ts';

const PUSH = 0.05;          // STANCE - 0.5, where both feet hand over
const SPD = 1;              // full tilt
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const sample = (f: (t: number) => number, n = 2000) =>
    Array.from({ length: n }, (_, i) => f(i / n));

// ─── The bug this file exists to catch ──────────────────────────────────────
// The bob must peak at push-off. The old abs(sin) peaked at mid-stance, i.e.
// the body was highest exactly when the leg was most loaded.
{
    const bob = sample((t) => bodyBob(t, SPD));
    const peak = bob.indexOf(Math.max(...bob)) / bob.length;
    const dist = Math.min(Math.abs(peak - PUSH), Math.abs(peak - (PUSH + 0.5)));
    assert.ok(dist < 0.01, `bob peaks at ${peak.toFixed(3)}, want ${PUSH} or ${PUSH + 0.5}`);

    // Trough sits under the planted leg, and the fall is longer than the rise.
    const trough = bob.indexOf(Math.min(...bob)) / bob.length;
    assert.ok(Math.min(...bob) < 0.01, 'bob should reach the ground');
    const fall = (trough - PUSH + 1) % 0.5;
    assert.ok(fall > 0.25, `fall ${fall.toFixed(3)} should outlast the rise`);
}

// ─── Continuity ─────────────────────────────────────────────────────────────
// Every one of these is read once per frame off a free-running cycle counter.
// A discontinuity anywhere is a visible snap.
for (const [name, f] of [
    ['bodyBob', (t: number) => bodyBob(t, SPD)],
    ['bodySurge', (t: number) => bodySurge(t, SPD)],
    ['headThrust', (t: number) => headThrust(t, SPD)],
    ['legPose.hip', (t: number) => legPose(t).hip],
    ['legPose.knee', (t: number) => legPose(t).knee],
] as const) {
    const v = sample(f, 4000);
    const jump = Math.max(...v.map((x, i) => Math.abs(x - v[(i + 1) % v.length])));
    assert.ok(jump < 0.35, `${name} jumps ${jump.toFixed(3)} between frames`);
}

// ─── Head: hold, then thrust ────────────────────────────────────────────────
// The chicken tell. Backward drift over most of the half-stride, then a short
// forward snap — not a sine.
{
    const h = (t: number) => headThrust(t, SPD);
    // Drifts back through the hold...
    for (const t of [0.10, 0.20, 0.30]) assert.ok(h(t) > h(t + 0.05), `head should drift back at ${t}`);
    // ...then snaps forward, and the snap is the shorter half.
    const v = sample(h, 2000);
    const back = v.filter((x, i) => x > v[(i + 1) % v.length]).length / v.length;
    assert.ok(back > 0.6, `hold is only ${(back * 100).toFixed(0)}% of the cycle`);
    // Zero mean: the head keeps up with the body over a full stride, it doesn't
    // wander off the front or trail behind.
    assert.ok(Math.abs(v.reduce((a, b) => a + b, 0) / v.length) < 0.3, 'head drifts over a stride');
}

// ─── Surge is a redistribution, not a shortcut ──────────────────────────────
{
    const v = sample((t) => bodySurge(t, SPD));
    assert.ok(Math.abs(v.reduce((a, b) => a + b, 0) / v.length) < 0.05, 'surge adds net distance');
}

// ─── Unchanged behaviour still holds ────────────────────────────────────────
{
    // Foot stays flat to the ground whatever hip and knee do.
    for (const t of [0, 0.2, 0.4, 0.6, 0.8]) {
        const p = legPose(t);
        assert.ok(near(p.hip + p.knee + footAngle(p), 0), `foot not flat at ${t}`);
    }
    // Stance is longer than swing: the foot is planted most of the cycle.
    const planted = sample((t) => (legPose(t).hip > legPose(t + 1e-4).hip ? 1 : 0));
    assert.ok(planted.reduce((a, b) => a + b, 0) / planted.length > 0.5, 'swing outlasts stance');
    // Amplitudes scale with speed and vanish at rest.
    assert.ok(strideHz(1) > strideHz(0) && bodyLean(1) > bodyLean(0), 'nothing scales with speed');
    assert.ok(bodyBob(PUSH, 0) < bodyBob(PUSH, 1), 'bob does not grow with speed');
}

console.log('gait: ok');
