import { useEffect, useState } from 'react';
import { Palette, RacerIdentity, paletteFor, shade } from '../racers';
import { BirdSprites, PART_ORDER, PART_TINT, PartName, SPRITE_DIR, TintSlot, setFor } from './sprites';

// ─── Sprite tinting ─────────────────────────────────────────────────────────
// Draw the bird ONCE in greyscale, then remap luminance onto a colour ramp
// derived from the racer's bodyColor: dark -> shadow tone, mid -> base,
// light -> highlight. The painting survives — every brushstroke and soft edge —
// and only the hue moves. It's a Photoshop gradient map, done on a canvas.
//
// This is why it's a canvas and not an SVG filter. A filter would re-rasterise
// every time the part transforms, and these move 60x/sec across four birds.
// Tinting once at load into a data URI costs nothing at runtime.
//
// The payoff: racers.ts stays the single source of truth. One greyscale set
// dresses every racer, and a fifth is still one row in RACERS.

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

const mix = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

/** The three-stop ramp a slot maps onto. */
export interface Ramp { lo: RGB; mid: RGB; hi: RGB }

function rampOf(base: string, dLo: number, dHi: number): Ramp {
    return {
        lo: hexToRgb(shade(base, -dLo, 0.04)),
        mid: hexToRgb(base),
        hi: hexToRgb(shade(base, dHi, -0.03)),
    };
}

export function rampFor(slot: TintSlot, p: Palette): Ramp | null {
    switch (slot) {
        case 'body': return rampOf(p.body, 0.2, 0.14);
        case 'accent': return rampOf(p.accent, 0.18, 0.13);
        case 'light': return rampOf(p.light, 0.18, 0.1);
        case 'comb': return rampOf(p.comb, 0.2, 0.1);
        case 'leg': return rampOf(p.leg, 0.2, 0.1);
        case 'none': return null;
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // canvas would taint without it on cross-origin art
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`sprite failed to load: ${src}`));
        img.src = src;
    });
}

/** Gradient-map one greyscale PNG onto a ramp. Returns a data URI. */
export async function tintImage(src: string, ramp: Ramp | null): Promise<string> {
    const img = await loadImage(src);
    if (!ramp) return src; // untinted parts (beak, eye) pass straight through

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return src;

    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = data.data;

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue; // leave fully transparent pixels alone
        // Rec. 601 luma — matches how the eye reads a greyscale painting.
        const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        const c = l < 0.5
            ? mix(ramp.lo, ramp.mid, l * 2)
            : mix(ramp.mid, ramp.hi, (l - 0.5) * 2);
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        // alpha untouched — the artist's silhouette and soft edges survive
    }

    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL('image/png');
}

// One tint per racer per session, not per mount.
const cache = new Map<number, BirdSprites>();
const inFlight = new Map<number, Promise<BirdSprites | null>>();

async function buildSprites(racer: RacerIdentity): Promise<BirdSprites | null> {
    if (!SPRITE_DIR) return null;
    const p = paletteFor(racer);
    const set = setFor(racer, SPRITE_DIR);
    const out = {} as BirdSprites;
    await Promise.all(
        PART_ORDER.map(async (name: PartName) => {
            const spec = set[name];
            const href = await tintImage(spec.href, rampFor(PART_TINT[name], p));
            out[name] = { ...spec, href };
        }),
    );
    return out;
}

/**
 * Tinted sprite set for a racer, or null while loading / if no art is present.
 * Bird renders vector until this resolves, then swaps — so a missing or slow
 * sprite folder degrades to the vector birds rather than an empty track.
 */
export function useTintedSprites(racer: RacerIdentity): BirdSprites | null {
    const [sprites, setSprites] = useState<BirdSprites | null>(() => cache.get(racer.id) ?? null);

    useEffect(() => {
        if (!SPRITE_DIR || cache.has(racer.id)) return;
        let alive = true;

        let job = inFlight.get(racer.id);
        if (!job) {
            job = buildSprites(racer).catch((err) => {
                console.warn(`[sprites] ${racer.name} falling back to vector:`, err);
                return null;
            });
            inFlight.set(racer.id, job);
        }

        job.then((s) => {
            inFlight.delete(racer.id);
            if (s) cache.set(racer.id, s);
            if (alive && s) setSprites(s);
        });

        return () => { alive = false; };
    }, [racer]);

    return sprites;
}