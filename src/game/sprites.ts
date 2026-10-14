import { RacerIdentity } from '../racers';

// ─── Sprite parts ───────────────────────────────────────────────────────────
// The contract between the rig and the art.
//
// SIXTEEN greyscale PNGs dress every racer: eight shared, four combs, four
// tails. tint.ts gradient-maps each onto a ramp derived from that racer's
// bodyColor, so racers.ts stays the single source of truth.
//
// Comb and tail are per-STYLE, not per-racer, because that's where the
// silhouette identity lives — Turbo's crown comb and sickle tail are what make
// him readable at 54px. One shared comb.png would flatten all four into the
// same bird wearing different paint.
//
// ── THE ONE RULE ───────────────────────────────────────────────────────────
// A part's PIVOT must land on its group's origin. The loop rotates the thigh
// about (0,0) of the thigh group; if the hip isn't drawn there, the leg swings
// from the wrong point and the bird comes apart mid-stride. The boxes below are
// derived from the vector rig, so art matching the vector silhouette just works.
//
// ── AUTHORING ──────────────────────────────────────────────────────────────
// Draw facing +x, feet at y=0, comb topping out near y=-230 — the same space
// Bird.tsx draws in. Paint in GREYSCALE: mid-grey is the base tone, darks
// become shadow, lights become highlight. Export each part on its own
// transparent PNG cropped to its box, at 4x (a 920px-tall bird).
//
// ── ONE SLOT PER IMAGE ─────────────────────────────────────────────────────
// A gradient map applies one ramp per image, so a part may only contain one
// palette slot. That's why the head is three files: head (body), comb
// (comb + wattle) and face (beak + eye, never tinted — paint those in colour).
//
// ── FLAT LEGS ──────────────────────────────────────────────────────────────
// Shading baked into a raster part can't respond to rotation. Body, head and
// wing turn 2-9 degrees and tolerate soft shading. The SHANK swings through
// 82 degrees — directional light drawn into it points the wrong way for most of
// the stride. Legs stay flat.

/** Parts every racer shares. One file each. */
export type SharedPart =
    | 'body' | 'head' | 'face' | 'wing' | 'neck' | 'thigh' | 'shank' | 'foot';

/** Parts that carry silhouette identity — one file per style, not per racer. */
export type VariantPart = 'comb' | 'tail';

export type PartName = SharedPart | VariantPart;

/** Which palette ramp a part is mapped onto. 'none' passes through untouched. */
export type TintSlot = 'body' | 'accent' | 'light' | 'comb' | 'leg' | 'none';

export const PART_TINT: Record<PartName, TintSlot> = {
    body: 'body',
    head: 'body',
    comb: 'comb',   // wattle lives here too — same slot
    face: 'none',   // beak + eye: paint in real colour, never remapped
    tail: 'accent',
    wing: 'accent',
    neck: 'light',  // hackles are light as well
    thigh: 'leg',
    shank: 'leg',
    foot: 'leg',
};

export const PART_ORDER: PartName[] = [
    'body', 'head', 'comb', 'face', 'tail', 'wing', 'neck', 'thigh', 'shank', 'foot',
];

export interface PartSpec {
    /** Image URL, or a data URI once tinted. */
    href: string;
    /** Placement box in rig units. Puts the pivot on the group origin. */
    x: number;
    y: number;
    w: number;
    h: number;
}

export type BirdSprites = Record<PartName, PartSpec>;

/** Box geometry per part, derived from the vector rig. */
export const PART_BOX: Record<PartName, Omit<PartSpec, 'href'>> = {
    tail: { x: -55, y: -66, w: 68, h: 84 },
    body: { x: -58, y: -152, w: 116, h: 90 },
    wing: { x: -36, y: -22, w: 70, h: 46 },
    neck: { x: 22, y: -184, w: 48, h: 72 },
    head: { x: 44, y: -206, w: 48, h: 56 },
    comb: { x: 30, y: -236, w: 62, h: 90 },
    face: { x: 62, y: -200, w: 50, h: 54 },
    thigh: { x: -7, y: -3, w: 14, h: 38 },
    shank: { x: -5, y: -4, w: 10, h: 46 },
    foot: { x: -12, y: -9, w: 32, h: 18 },
};

/**
 * Build a racer's sprite set. Shared parts are one file; comb and tail are
 * picked by style, so Turbo gets comb-crown.png and Nugget gets comb-rose.png
 * from the same folder.
 */
export function setFor(r: RacerIdentity, dir: string, ext = 'png'): BirdSprites {
    const shared = (n: SharedPart): PartSpec => ({ href: `${dir}/${n}.${ext}`, ...PART_BOX[n] });
    return {
        body: shared('body'),
        head: shared('head'),
        face: shared('face'),
        wing: shared('wing'),
        neck: shared('neck'),
        thigh: shared('thigh'),
        shank: shared('shank'),
        foot: shared('foot'),
        comb: { href: `${dir}/comb-${r.combStyle}.${ext}`, ...PART_BOX.comb },
        tail: { href: `${dir}/tail-${r.tailStyle}.${ext}`, ...PART_BOX.tail },
    };
}

/**
 * Folder holding the greyscale art, or null to render vector birds.
 *
 * Sixteen PNGs — eight shared, four combs, four tails:
 *
 *   export const SPRITE_DIR: string | null = '/sprites/bird';
 *
 * Every racer is assembled and tinted from it automatically. Nothing else
 * changes — same rig, same gait, same camera. If a file 404s, that racer falls
 * back to vector rather than vanishing.
 *
 * A fifth racer reusing an existing comb + tail costs zero new art.
 */
export const SPRITE_DIR: string | null = null;