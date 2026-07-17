// ─── Racer identities ───────────────────────────────────────────────────────
// Single source of truth for who the four birds ARE.
// Every colour in the game derives from bodyColor via shade(), so recolouring a
// racer is a one-line change and nothing goes muddy.

// ─── Colour maths ───────────────────────────────────────────────────────────
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    const to = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/**
 * Shift a hex colour's lightness (and optionally saturation) in HSL space.
 * Replaces the old hardcoded darken() lookup, which only knew four greys and
 * fell back to #888888 for anything else.
 */
export function shade(hex: string, dLight: number, dSat = 0): string {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    const [nr, ng, nb] = hslToRgb(h, clamp01(s + dSat), clamp01(l + dLight));
    return rgbToHex(nr, ng, nb);
}

// ─── Identity types ─────────────────────────────────────────────────────────
export type CombStyle = 'crown' | 'pea' | 'rose' | 'single';
export type TailStyle = 'sickle' | 'fan' | 'stub' | 'plume';
export type Build = 'lean' | 'standard' | 'chunky' | 'tall';

export interface RacerIdentity {
    id: number;
    name: string;
    /** One-line character read, shown in the HUD. */
    tagline: string;
    bodyColor: string;
    combColor: string;
    legColor: string;
    combStyle: CombStyle;
    tailStyle: TailStyle;
    build: Build;
    /** Brow tilt in DEGREES (SVG rotate). null = no brows, which reads as dopey. */
    browAngle: number | null;
}

/**
 * Palette logic: the world is green grass and orange dirt, so the racers own
 * the hues the environment doesn't. Comb colour never matches body colour —
 * a red comb on a red bird is an invisible comb.
 */
export const RACERS: RacerIdentity[] = [
    {
        id: 1, name: 'Turbo', tagline: 'All gas, no brakes',
        bodyColor: '#e63946', combColor: '#ffd23f', legColor: '#ffb703',
        combStyle: 'crown', tailStyle: 'sickle', build: 'lean', browAngle: -14,
    },
    {
        id: 2, name: 'Sir Pecks', tagline: 'Politely quick',
        bodyColor: '#3a86ff', combColor: '#ff4d6d', legColor: '#ffd166',
        combStyle: 'pea', tailStyle: 'fan', build: 'standard', browAngle: 10,
    },
    {
        id: 3, name: 'Nugget', tagline: 'Built like a loaf',
        bodyColor: '#ffbe0b', combColor: '#e63946', legColor: '#f77f00',
        combStyle: 'rose', tailStyle: 'stub', build: 'chunky', browAngle: null,
    },
    {
        id: 4, name: 'Duchess', tagline: 'Runs on spite',
        bodyColor: '#9b5de5', combColor: '#f15bb5', legColor: '#ffd166',
        combStyle: 'single', tailStyle: 'plume', build: 'tall', browAngle: 5,
    },
];

// ─── Build proportions (2D rig units) ───────────────────────────────────────
export interface BuildSpec {
    /** Non-uniform body scale. */
    bx: number;
    by: number;
    /** Leg length multiplier — also drives how high the bird sits. */
    legs: number;
    /** Neck length multiplier. */
    neck: number;
    /** Head scale. */
    head: number;
}

export const BUILDS: Record<Build, BuildSpec> = {
    lean:     { bx: 1.14, by: 0.86, legs: 1.18, neck: 1.18, head: 0.94 },
    standard: { bx: 1.00, by: 1.00, legs: 1.00, neck: 1.00, head: 1.00 },
    chunky:   { bx: 0.94, by: 1.20, legs: 0.76, neck: 0.66, head: 1.10 },
    tall:     { bx: 0.98, by: 0.90, legs: 1.34, neck: 1.50, head: 0.95 },
};

/** Derived palette for a racer — everything flows from bodyColor. */
export interface Palette {
    body: string; accent: string; light: string; ink: string;
    comb: string; wattle: string; leg: string; legDark: string;
}

export function paletteFor(r: RacerIdentity): Palette {
    return {
        body:    r.bodyColor,
        accent:  shade(r.bodyColor, -0.16, 0.06),  // tail + wing
        light:   shade(r.bodyColor, 0.12, -0.04),  // neck + chest catch the light
        // The outline lands sub-pixel (~0.7px) at race scale, so it can never sit on
        // a whole pixel — it smears across two, differently every frame. Kept low
        // contrast so that smear resolves as a soft edge instead of a shimmer.
        ink:     shade(r.bodyColor, -0.22, 0.05),
        comb:    r.combColor,
        wattle:  shade(r.combColor, -0.06, 0.04),
        leg:     r.legColor,
        legDark: shade(r.legColor, -0.12),
    };
}