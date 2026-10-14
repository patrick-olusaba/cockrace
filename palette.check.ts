// Palette self-check.  node --experimental-strip-types palette.check.ts
//
// Same placement rule as gait.check.ts: repo root, so tsconfig never sees the
// .ts import extension Node's type-stripping needs.
//
// ponytail: asserts, no runner.

import assert from 'node:assert/strict';
import { RACERS, paletteFor, shade } from './src/racers.ts';

// ─── The bug this file exists to catch ──────────────────────────────────────
// accent (tail + wing) and light (breast + hackles) used to be shade() of
// bodyColor. One hue at three lightnesses is what made the birds read as
// moulded plastic instead of feathers, and it's an easy thing to "tidy" back
// into a derivation. They must stay independent hues.
const hue = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return -1;                       // grey: no hue to compare
    const d = max - min;
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h / 6 + 1) % 1;
};

/** Shortest distance around the hue wheel, 0–0.5. */
const hueGap = (a: string, b: string): number => {
    const [ha, hb] = [hue(a), hue(b)];
    if (ha < 0 || hb < 0) return 0.5;                 // grey vs colour: maximally apart
    const d = Math.abs(ha - hb);
    return Math.min(d, 1 - d);
};

const light = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

/**
 * Two colours read apart if they differ in HUE or in LIGHTNESS. Requiring hue
 * alone is wrong: a cockerel's black-green sickles against a coloured body are
 * a real plumage pattern, and Duchess's near-black tail is exactly that.
 */
const reads = (a: string, b: string): boolean =>
    hueGap(a, b) > 0.04 || Math.abs(light(a) - light(b)) > 0.25;

for (const r of RACERS) {
    const p = paletteFor(r);

    assert.equal(p.accent, r.tailColor, `${r.name}: accent must be tailColor, not a shade of the body`);
    assert.equal(p.light, r.breastColor, `${r.name}: light must be breastColor`);

    assert.ok(
        reads(r.bodyColor, r.tailColor),
        `${r.name}: tail ${r.tailColor} vanishes into body ${r.bodyColor}`,
    );

    // Comb must not vanish into the body it sits on.
    assert.ok(
        reads(r.bodyColor, r.combColor),
        `${r.name}: comb ${r.combColor} vanishes into body ${r.bodyColor}`,
    );

    // Breast is the light note against the body; if it isn't lighter it's just
    // a second body colour and the two-tone read collapses.
    assert.ok(
        light(r.breastColor) - light(r.bodyColor) > 0.1,
        `${r.name}: breast ${r.breastColor} is not lighter than body ${r.bodyColor}`,
    );
}

// shade() still has to behave, since ink and every highlight lean on it.
assert.equal(shade('#808080', 0), '#808080');
assert.ok(shade('#e63946', -0.2) !== '#e63946');

console.log('palette.check: ok');
