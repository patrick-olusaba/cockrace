import React from 'react';
import { BUILDS, CombStyle, Palette, RacerIdentity, TailStyle, paletteFor, shade } from '../racers';
import { BirdRig, LegRig } from '../game/rig';
import { BirdSprites, PartSpec } from '../game/sprites';
import { useTintedSprites } from '../game/tint';

// Authored facing +x, feet at y=0, comb topping out near y=-230.
//
// Three things carry the form, in order of how much they matter at 55px:
//
//   1. SOFT SHADING. Every mass is filled with a radial gradient whose light
//      centre sits up and to the left. That's what makes it round.
//      Gradients are safe here despite the parts rotating: body lean is 2-9deg,
//      head counter-rotation about the same, wing sway 4deg. The light drifts by
//      a few degrees and nobody can tell. The legs swing 30deg — which is why
//      the legs are flat strokes with no shading.
//   2. HACKLES. The ruff of pointed feathers spilling off the neck. It's the
//      most rooster-ish shape there is and it's pure silhouette, so it survives
//      being 55px tall.
//   3. THE INK LINE. Every shape is drawn twice — an `ink` copy a few units
//      larger, then the fill on top. That's the cartoon outline.

/** A tapered feather: wide at the root, pointed at the tip, with a slight bow. */
function feather(ox: number, oy: number, tx: number, ty: number, w: number, bow = 5): string {
    const mx = (ox + tx) / 2;
    const my = (oy + ty) / 2;
    return `M${ox - w},${oy} Q${mx - bow},${my} ${tx},${ty} Q${mx + bow},${my} ${ox + w},${oy} Z`;
}

// ─── Plumage ────────────────────────────────────────────────────────────────
// A row of overlapping feathers along a baseline. This is the whole difference
// between a bird and a coloured blob: a real bird's body is not one smooth
// surface, it's dozens of tile-laid feathers, and the eye reads the repeated
// scalloped edge long before it can resolve any single feather.
//
// Drawn back-to-front (last feather first) so each overlaps the one behind it,
// which is the direction plumage actually lies.
const Plumes: React.FC<{
    /** First feather's root. */
    ox: number; oy: number;
    /** Step from one root to the next. */
    dx: number; dy: number;
    /** Tip offset from each root — where the feather points. */
    tx: number; ty: number;
    n: number;
    w: number;
    fill: string;
    hi: string;
    ink: string;
    /** Shaft line down the middle. Off for the smallest rows, where it's noise. */
    shaft?: boolean;
    opacity?: number;
}> = ({ ox, oy, dx, dy, tx, ty, n, w, fill, hi, ink, shaft = false, opacity = 1 }) => {
    const idx = Array.from({ length: n }, (_, i) => n - 1 - i);
    const root = (i: number): [number, number] => [ox + dx * i, oy + dy * i];
    return (
        <g opacity={opacity}>
            {idx.map((i) => {
                const [rx, ry] = root(i);
                return <path key={`i${i}`} d={feather(rx, ry, rx + tx, ry + ty, w + 1.3, 4)} fill={ink} />;
            })}
            {idx.map((i) => {
                const [rx, ry] = root(i);
                return <path key={`f${i}`} d={feather(rx, ry, rx + tx, ry + ty, w, 4)} fill={i % 2 ? fill : hi} />;
            })}
            {shaft && idx.map((i) => {
                const [rx, ry] = root(i);
                return (
                    <path
                        key={`s${i}`}
                        d={`M${rx},${ry} L${rx + tx * 0.86},${ry + ty * 0.86}`}
                        stroke={ink}
                        strokeWidth="0.9"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.5"
                    />
                );
            })}
        </g>
    );
};

// ─── Combs ──────────────────────────────────────────────────────────────────
const Comb: React.FC<{ style: CombStyle; p: Palette }> = ({ style, p }) => {
    const hi = shade(p.comb, 0.1);

    // Bases follow the skull: circle centre (66,-182), r 16. A comb sitting on a
    // flat line floats off the head at the ends, which is what it used to do.
    if (style === 'crown') {
        const spikes: Array<[number, number, number, number, number, number]> = [
            [55, -192, 58, -218, 63, -196],
            [62, -196, 67, -224, 72, -196],
            [71, -195, 76, -215, 80, -190],
        ];
        return (
            <>
                {spikes.map(([ax, ay, bx, by, cx, cy], i) => (
                    <path key={i} d={`M${ax},${ay} L${bx},${by} L${cx},${cy} Z`} fill={p.ink} />
                ))}
                {spikes.map(([ax, ay, bx, by, cx, cy], i) => (
                    <path key={`f${i}`} d={`M${ax + 1},${ay} L${bx},${by + 4} L${cx - 1},${cy} Z`} fill={p.comb} />
                ))}
                {spikes.map(([ax, ay, bx, by], i) => (
                    <path key={`h${i}`} d={`M${ax + 1},${ay} L${bx},${by + 4} L${bx - 1},${ay} Z`} fill={hi} />
                ))}
            </>
        );
    }

    if (style === 'pea') {
        return (
            <>
                <ellipse cx="62" cy="-195" rx="12" ry="5" fill={p.ink} />
                <ellipse cx="62" cy="-196" rx="10" ry="3.5" fill={p.comb} />
                <ellipse cx="61" cy="-197" rx="7" ry="1.6" fill={hi} />
                <ellipse cx="73" cy="-192" rx="10" ry="4.5" fill={p.ink} />
                <ellipse cx="73" cy="-193" rx="8" ry="3" fill={p.comb} />
            </>
        );
    }

    if (style === 'rose') {
        return (
            <>
                <path d="M52,-192 L40,-198 L53,-200 Z" fill={p.ink} />
                <ellipse cx="66" cy="-194" rx="19" ry="8" fill={p.ink} />
                <ellipse cx="66" cy="-195" rx="17" ry="6" fill={p.comb} />
                <ellipse cx="64" cy="-198" rx="12" ry="2.4" fill={hi} />
                <circle cx="58" cy="-199" r="3.2" fill={p.comb} />
                <circle cx="66" cy="-201" r="3.2" fill={p.comb} />
                <circle cx="74" cy="-199" r="2.8" fill={p.comb} />
            </>
        );
    }

    const peaks: Array<[number, number, number]> = [
        [55, -194, 4.5], [61, -199, 5.5], [67, -200, 5], [73, -197, 4.5], [78, -192, 3.4],
    ];
    return (
        <>
            {peaks.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r + 2} fill={p.ink} />)}
            {peaks.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill={p.comb} />)}
            {peaks.map(([cx, cy, r], i) => (
                <circle key={`h${i}`} cx={cx - 1.5} cy={cy - 1.5} r={r * 0.45} fill={hi} />
            ))}
        </>
    );
};

// ─── Tails ──────────────────────────────────────────────────────────────────
// A tail drawn as fat round strokes is a bundle of sausages — that was the old
// version and it's the single thing that most gave the birds away. Real tail
// feathers are flat, tapered, curved, and you can see where one ends and the
// next begins. So each one is a filled quill with an ink edge and a shaft.

/** Root at (rx,ry), bowing through (cx,cy), tapering to a point at (tx,ty). */
function quill(rx: number, ry: number, cx: number, cy: number, tx: number, ty: number, w: number): string {
    return `M${rx},${ry - w} Q${cx},${cy - w * 0.7} ${tx},${ty} Q${cx},${cy + w * 0.7} ${rx},${ry + w} Z`;
}

/** [rootX, rootY, ctrlX, ctrlY, tipX, tipY, halfWidth] */
type Quill = [number, number, number, number, number, number, number];

/**
 * Feathers are drawn LAST-first so the front of the list ends up on top. Tail
 * lists are therefore written longest-first, which is also how they read.
 */
const Quills: React.FC<{ qs: Quill[]; p: Palette; a: string; b: string }> = ({ qs, p, a, b }) => {
    const order = Array.from({ length: qs.length }, (_, i) => qs.length - 1 - i);
    return (
        <>
            {order.map((i) => {
                const [rx, ry, cx, cy, tx, ty, w] = qs[i];
                return <path key={`i${i}`} d={quill(rx, ry, cx, cy, tx, ty, w + 1.7)} fill={p.ink} />;
            })}
            {order.map((i) => {
                const [rx, ry, cx, cy, tx, ty, w] = qs[i];
                return <path key={`f${i}`} d={quill(rx, ry, cx, cy, tx, ty, w)} fill={i % 2 ? a : b} />;
            })}
            {/* Shaft. One thin line per feather is what stops a stack of tapered
                blobs from merging back into a single mass. */}
            {order.map((i) => {
                const [rx, ry, cx, cy, tx, ty] = qs[i];
                return (
                    <path
                        key={`s${i}`}
                        d={`M${rx},${ry} Q${cx},${cy} ${tx},${ty}`}
                        stroke={p.ink}
                        strokeWidth="1.1"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.4"
                    />
                );
            })}
        </>
    );
};

const Tail: React.FC<{ style: TailStyle; p: Palette }> = ({ style, p }) => {
    const dark = shade(p.accent, -0.09);
    const lit = shade(p.accent, 0.1);

    /** Short feathers covering the join where the tail leaves the body. */
    const coverts = (
        <>
            <path d={quill(14, 8, 2, 2, -14, -6, 7)} fill={p.ink} />
            <path d={quill(14, 8, 2, 2, -14, -6, 5.5)} fill={shade(p.body, -0.06)} />
            <path d={quill(14, 2, 2, -4, -12, -16, 6)} fill={p.ink} />
            <path d={quill(14, 2, 2, -4, -12, -16, 4.5)} fill={p.body} />
        </>
    );

    if (style === 'sickle') {
        // The long arching sickles of a cockerel — the showiest tail there is.
        // Wide, not spiky. A tail feather is a broad vane on a shaft; drawn thin
        // it reads as a porcupine quill and the whole bird turns into a hedgehog.
        const qs: Quill[] = [
            [6, -2, -16, -34, -54, -78, 10],
            [6, 2, -16, -24, -48, -58, 9.5],
            [6, 6, -14, -14, -42, -38, 9],
            [6, 10, -12, -2, -36, -18, 8.5],
            [6, 13, -10, 10, -30, 2, 8],
        ];
        return (<>{coverts}<Quills qs={qs} p={p} a={p.accent} b={dark} /></>);
    }

    if (style === 'fan') {
        const qs: Quill[] = [
            [4, 2, -20, -40, -54, -74, 9.5],
            [4, 4, -22, -28, -58, -50, 9.5],
            [4, 6, -22, -16, -56, -26, 9],
            [4, 9, -20, -4, -48, -8, 8.5],
            [4, 12, -16, 8, -32, 12, 8],
        ];
        return (<>{coverts}<Quills qs={qs} p={p} a={p.accent} b={lit} /></>);
    }

    if (style === 'stub') {
        // Short and blunt. Still feathers, just not much of them.
        const qs: Quill[] = [
            [2, 0, -10, -14, -30, -32, 10],
            [2, 4, -12, -6, -36, -14, 9.5],
            [2, 8, -12, 4, -32, 6, 9],
        ];
        return (
            <>
                {coverts}
                <Quills qs={qs} p={p} a={p.accent} b={dark} />
            </>
        );
    }

    // plume — tall and upright, the feathers standing rather than arching.
    const qs: Quill[] = [
        [4, 2, -6, -46, -14, -92, 9.5],
        [4, 4, -14, -42, -28, -84, 9],
        [4, 6, 2, -42, 4, -86, 9],
        [4, 9, -20, -32, -36, -64, 8.5],
        [4, 12, -22, -18, -42, -38, 8],
    ];
    return (<>{coverts}<Quills qs={qs} p={p} a={p.accent} b={lit} /></>);
};

// ─── Hackles ────────────────────────────────────────────────────────────────
// The neck ruff. Six pointed feathers draping back over the shoulder, drawn
// front-to-back so each overlaps the one behind it.
const Hackles: React.FC<{ p: Palette }> = ({ p }) => {
    const hi = shade(p.light, 0.07);
    // Hackles hang off the BACK of the neck and stop at the shoulder. Rooted on
    // the neck's leading edge (which is where they were) they cover the throat
    // and the whole neck reads as shredded.
    const rows = Array.from({ length: 6 }, (_, i) => {
        const t = i / 5;
        return {
            ox: 44 - t * 12,
            oy: -170 + t * 40,
            tx: 30 - t * 16,
            ty: -152 + t * 42,
            w: 4.6 - t * 0.9,
        };
    });
    return (
        <>
            {rows.map((r, i) => (
                <path key={i} d={feather(r.ox, r.oy, r.tx, r.ty, r.w + 1.6, 6)} fill={p.ink} />
            ))}
            {rows.map((r, i) => (
                <path key={`f${i}`} d={feather(r.ox, r.oy, r.tx, r.ty, r.w, 6)} fill={i % 2 ? p.light : hi} />
            ))}
            {/* Shafts. Hackles are long and stiff, and the shaft is what says so —
                without it eight overlapping blobs read as a scarf. */}
            {rows.map((r, i) => (
                <path
                    key={`s${i}`}
                    d={`M${r.ox},${r.oy} L${r.ox + (r.tx - r.ox) * 0.88},${r.oy + (r.ty - r.oy) * 0.88}`}
                    stroke={p.ink}
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.45"
                />
            ))}
        </>
    );
};

// ─── Leg ────────────────────────────────────────────────────────────────────
// Three nested groups so hip, knee and foot rotate independently. The far leg
// is darkened rather than duplicated — cheap depth.
const Leg: React.FC<{ rig: LegRig; ox: number; p: Palette; near: boolean }> = ({ rig, ox, p, near }) => {
    const c = near ? p.leg : shade(p.leg, -0.22);
    const d = near ? p.legDark : shade(p.leg, -0.34);
    const toes = 'M0,0 L14,2 M0,0 L11,-5 M0,0 L-8,3';
    return (
        <g ref={(el) => { rig.hip = el; }} transform={`translate(${ox},-76)`}>
            <path d="M0,0 L0,30" stroke={d} strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M0,0 L0,30" stroke={c} strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <g ref={(el) => { rig.knee = el; }} transform="translate(0,30)">
                <circle cx="0" cy="0" r="4" fill={d} />
                <circle cx="-0.6" cy="-0.6" r="2.5" fill={c} />
                <path d="M0,0 L0,36" stroke={d} strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M0,0 L0,36" stroke={c} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <g ref={(el) => { rig.foot = el; }} transform="translate(0,36)">
                    <path d={toes} stroke={d} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d={toes} stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </g>
            </g>
        </g>
    );
};

// ─── Sprite variants ────────────────────────────────────────────────────────
// Identical rig, images instead of paths. Every ref, pivot and transform is the
// same, so gait.ts and Stage.tsx can't tell which one they're driving.

const Img: React.FC<{ p: PartSpec }> = ({ p }) => (
    <image href={p.href} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="xMidYMid meet" />
);

const SpriteLeg: React.FC<{ rig: LegRig; ox: number; s: BirdSprites; near: boolean }> = ({ rig, ox, s, near }) => (
    <g ref={(el) => { rig.hip = el; }} transform={`translate(${ox},-76)`}>
        {/* Far leg is dimmed rather than a second set of art. */}
        <g opacity={near ? 1 : 0.72}>
            <Img p={s.thigh} />
            <g ref={(el) => { rig.knee = el; }} transform="translate(0,30)">
                <Img p={s.shank} />
                <g ref={(el) => { rig.foot = el; }} transform="translate(0,36)">
                    <Img p={s.foot} />
                </g>
            </g>
        </g>
    </g>
);

const SpriteBird: React.FC<{ racer: RacerIdentity; rig: BirdRig; s: BirdSprites }> = ({ racer, rig, s }) => {
    const b = BUILDS[racer.build];
    return (
        <g ref={(el) => { rig.root = el; }}>
            {/* fillOpacity, not opacity — the loop drives `opacity` to fade the
                shadow as the bird lifts, and the two need to multiply. Same
                reason the vector shadow keeps its alpha in the gradient stops. */}
            <ellipse ref={(el) => { rig.shadow = el; }} cx="0" cy="4" rx="46" ry="7" fill="#000000" fillOpacity="0.22" />
            <g ref={(el) => { rig.body = el; }} transform={`scale(${b.bx},${b.by})`}>
                <g ref={(el) => { rig.tail = el; }} transform="translate(-46,-124)">
                    <Img p={s.tail} />
                </g>
                <SpriteLeg rig={rig.legFar} ox={-8} s={s} near={false} />
                <Img p={s.body} />
                <g ref={(el) => { rig.wing = el; }} transform="translate(-4,-108)">
                    <Img p={s.wing} />
                </g>
                <g transform={`translate(36,-128) scale(1,${b.neck}) translate(-36,128)`}>
                    <Img p={s.neck} />
                </g>
                <g ref={(el) => { rig.head = el; }}>
                    <g transform={`translate(0,${(1 - b.neck) * 42}) scale(${b.head})`}>
                        {/* comb behind the skull, face on top — three files because a
                gradient map only applies one ramp per image. */}
                        <Img p={s.comb} />
                        <Img p={s.head} />
                        <Img p={s.face} />
                    </g>
                </g>
                <SpriteLeg rig={rig.legNear} ox={6} s={s} near />
            </g>
        </g>
    );
};

// ─── Bird ───────────────────────────────────────────────────────────────────
// Tinted sprites once the art has loaded, vector until then. A missing or slow
// sprite folder degrades to vector birds rather than an empty track.
const Bird: React.FC<{ racer: RacerIdentity; rig: BirdRig }> = ({ racer, rig }) => {
    const sprites = useTintedSprites(racer);
    if (sprites) return <SpriteBird racer={racer} rig={rig} s={sprites} />;
    return <VectorBird racer={racer} rig={rig} />;
};

const VectorBird: React.FC<{ racer: RacerIdentity; rig: BirdRig }> = ({ racer, rig }) => {
    const p = paletteFor(racer);
    const b = BUILDS[racer.build];
    const headDrop = (1 - b.neck) * 42;

    const bodyShade = shade(racer.bodyColor, -0.09);
    const bodyLit = shade(racer.bodyColor, 0.07);
    const headShade = shade(racer.bodyColor, -0.08);
    // A folded wing is mostly body-coloured coverts; only the flight feathers
    // poking out the back are the dark accent. Filling the whole wing with the
    // accent punched a hole in the middle of the bird.
    const wingBase = shade(racer.bodyColor, -0.19);
    const wingLit = shade(racer.bodyColor, -0.05);
    const beakLo = '#c47a12';

    const gBody = `gBody${racer.id}`;
    const gHead = `gHead${racer.id}`;
    const gBreast = `gBreast${racer.id}`;
    const gWing = `gWing${racer.id}`;
    const gShadow = `gShadow${racer.id}`;

    return (
        <g ref={(el) => { rig.root = el; }}>
            <defs>
                <radialGradient id={gBody} cx="0.36" cy="0.24" r="0.92">
                    <stop offset="0" stopColor={bodyLit} />
                    <stop offset="0.52" stopColor={p.body} />
                    <stop offset="1" stopColor={bodyShade} />
                </radialGradient>
                <radialGradient id={gHead} cx="0.40" cy="0.26" r="0.9">
                    <stop offset="0" stopColor={bodyLit} />
                    <stop offset="0.55" stopColor={p.body} />
                    <stop offset="1" stopColor={headShade} />
                </radialGradient>
                <radialGradient id={gBreast} cx="0.34" cy="0.28" r="0.95">
                    <stop offset="0" stopColor={shade(p.light, 0.08)} />
                    <stop offset="0.55" stopColor={p.light} />
                    <stop offset="1" stopColor={shade(p.light, -0.09)} />
                </radialGradient>
                <radialGradient id={gWing} cx="0.38" cy="0.24" r="0.95">
                    <stop offset="0" stopColor={wingLit} />
                    <stop offset="0.5" stopColor={wingBase} />
                    <stop offset="1" stopColor={shade(racer.bodyColor, -0.16)} />
                </radialGradient>
                {/* A hard-edged ground shadow is the other thing that reads as fake.
            Fades to nothing instead. */}
                <radialGradient id={gShadow} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#000000" stopOpacity="0.3" />
                    <stop offset="0.55" stopColor="#000000" stopOpacity="0.17" />
                    <stop offset="1" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
            </defs>

            <ellipse ref={(el) => { rig.shadow = el; }} cx="0" cy="4" rx="46" ry="7" fill={`url(#${gShadow})`} />

            <g ref={(el) => { rig.body = el; }} transform={`scale(${b.bx},${b.by})`}>
                <g ref={(el) => { rig.tail = el; }} transform="translate(-46,-124)">
                    <Tail style={racer.tailStyle} p={p} />
                </g>

                <Leg rig={rig.legFar} ox={-8} p={p} near={false} />

                {/* Fluffed thigh over the far leg. Drawn between the two legs so it
            reads as depth, not as a sticker. */}
                <Plumes ox={-2} oy={-86} dx={-8} dy={0} tx={-3} ty={10} n={2}
                    w={6} fill={bodyShade} hi={bodyShade} ink={p.ink} opacity={0.6} />

                {/* Body: ink, base, then a clipped shadow blob and highlight. Those two
            clipped shapes are what stop it reading as a flat sticker. */}
                {/* A tall, round barrel — a real cockerel carries its mass high and
            full, the chest bulging forward and the back rising to meet a short
            neck. Rounder and taller than the old horizontal egg. */}
                <ellipse cx="-2" cy="-112" rx="52" ry="44" transform="rotate(-5 -2 -112)" fill={p.ink} />
                <ellipse cx="-2" cy="-112" rx="49" ry="41" transform="rotate(-5 -2 -112)" fill={`url(#${gBody})`} />

                {/* Three tile-laid feather rows down the body — scapulars, flank,
            belly. Each row is drawn over the base fill, so the gradient still
            does the rounding and the feathers only supply the broken edge. */}
                <Plumes ox={18} oy={-126} dx={-15} dy={1} tx={-16} ty={8} n={3}
                    w={9} fill={p.body} hi={bodyLit} ink={p.ink} opacity={0.72} />
                <Plumes ox={20} oy={-110} dx={-15} dy={1.6} tx={-17} ty={9} n={3}
                    w={9.4} fill={p.body} hi={bodyLit} ink={p.ink} opacity={0.72} />
                <Plumes ox={14} oy={-94} dx={-14} dy={1} tx={-15} ty={8} n={3}
                    w={8.6} fill={bodyShade} hi={p.body} ink={p.ink} opacity={0.6} />

                {/* Saddle — the rear feather layer, where body meets tail. */}
                <path d="M-46,-96 Q-20,-72 22,-78" fill="none" stroke={bodyShade} strokeWidth="7" strokeLinecap="round" opacity="0.7" />
                <path d="M-44,-112 Q-22,-92 8,-96" fill="none" stroke={bodyShade} strokeWidth="4" strokeLinecap="round" opacity="0.4" />

                {/* Breast — the full front mass, high and bulging forward under the
            throat, the way a rooster puffs its chest. */}
                <ellipse cx="31" cy="-118" rx="25" ry="31" fill={p.ink} />
                <ellipse cx="31" cy="-118" rx="22" ry="28" fill={`url(#${gBreast})`} />

                {/* Fine breast feathering. Smaller and softer than the body rows —
            breast feathers are downy, so no shaft and low contrast. */}
                <Plumes ox={44} oy={-118} dx={-8} dy={4} tx={-9} ty={11} n={4}
                    w={4} fill={p.light} hi={shade(p.light, 0.08)} ink={p.ink} opacity={0.55} />

                {/* Scalloped belly edge, under everything the rows cover. */}
                <path d="M-30,-80 q11,10 22,1 q11,10 22,1" fill="none" stroke={p.ink} strokeWidth="2" strokeLinecap="round" opacity="0.45" />

                <g ref={(el) => { rig.wing = el; }} transform="translate(-4,-108)">
                    <ellipse rx="28" ry="17" transform="rotate(-10)" fill={p.ink} />
                    <ellipse rx="25" ry="14" transform="rotate(-10)" fill={`url(#${gWing})`} />
                    {/* Covert row — the short feathers overlapping the base of the
                primaries. A folded wing is two visible layers, never one. */}
                    <Plumes ox={10} oy={-6} dx={-8} dy={1.5} tx={-11} ty={7} n={3}
                        w={3.6} fill={wingBase} hi={wingLit} ink={p.ink} opacity={0.8} />
                    {/* Primaries fanning off the back — these ARE the accent, which
                is where a real bird's dark flight feathers live. */}
                    <path d={feather(-16, 0, -40, 10, 6, 4)} fill={p.ink} />
                    <path d={feather(-16, 0, -38, 9, 4.4, 4)} fill={p.accent} />
                    <path d={feather(-14, 7, -36, 19, 5.4, 4)} fill={p.ink} />
                    <path d={feather(-14, 7, -34, 18, 3.8, 4)} fill={shade(p.accent, 0.07)} />
                </g>

                {/* Long, thin, curved neck — the single biggest tell. A short fat
            column reads as a pigeon; the rise and the S-bend read as a cockerel. */}
                <g transform={`translate(36,-128) scale(1,${b.neck}) translate(-36,128)`}>
                    <path d="M40,-140 Q46,-164 62,-176" stroke={p.ink} strokeWidth="32" strokeLinecap="round" fill="none" />
                    {/* Body-coloured, NOT breast-coloured. A pale neck merges with the
                pale breast into one blob; the hackles supply the light note. */}
                    <path d="M40,-140 Q46,-164 62,-176" stroke={shade(racer.bodyColor, 0.05)} strokeWidth="26" strokeLinecap="round" fill="none" />
                    <Hackles p={p} />
                </g>

                <g ref={(el) => { rig.head = el; }}>
                    <g transform={`translate(0,${headDrop}) scale(${b.head})`}>
                        {/* A real cockerel's comb is big and proud — scaled up about the
                skull so every style reads large, like the reference. */}
                        <g transform="translate(66,-182) scale(1.4) translate(-66,182)">
                            <Comb style={racer.combStyle} p={p} />
                        </g>

                        {/* Small skull carrying an oversized eye and a long beak.
                Shrinking the head is what makes the neck read as long. */}
                        <circle cx="66" cy="-182" r="19" fill={p.ink} />
                        <circle cx="66" cy="-182" r="16" fill={`url(#${gHead})`} />
                        {/* Cheek patch — separates the face from the skull. */}
                        <ellipse cx="74" cy="-177" rx="8" ry="6" fill={p.light} opacity="0.7" />

                        <path d="M80,-166 Q77,-152 70,-154 Q75,-160 75,-168 Z" fill={p.ink} />
                        <path d="M79,-167 Q77,-154 72,-155 Q76,-160 76,-167 Z" fill={p.wattle} />

                        {/* Beak: long upper mandible with a slight hook, lower tucked
                under. Muted horn-yellow with a darker tip, not neon orange —
                a bright candy beak is one of the two cartoon tells on the face. */}
                        <path d="M80,-184 Q100,-182 118,-176 Q98,-172 80,-171 Z" fill={p.ink} />
                        <path d="M80,-183 Q99,-181 115,-176 Q97,-173 80,-172 Z" fill="#d8af63" />
                        <path d="M80,-177 Q97,-176 115,-176 Q96,-171 80,-172 Z" fill={beakLo} />
                        {/* Horn tip darkens — real mandibles aren't one flat colour. */}
                        <path d="M104,-178 Q112,-177 118,-176 Q112,-174 105,-173 Z" fill="#8a6a35" />
                        <path d="M80,-177 Q98,-177 115,-176" stroke={p.ink} strokeWidth="1.2" fill="none" />

                        {/* Eye: small, almost no white sclera, amber iris nearly filled
                by the pupil — a bird's eye, not a googly cartoon one. */}
                        <circle cx="73" cy="-188" r="6" fill={p.ink} />
                        <circle cx="73" cy="-188" r="5" fill="#a9712f" />
                        <circle cx="73.4" cy="-188" r="3.5" fill="#141414" />
                        <circle cx="74.7" cy="-189.6" r="1.1" fill="#ffffff" opacity="0.9" />
                        {racer.browAngle !== null && (
                            <path
                                d="M65,-199 L81,-195"
                                stroke={p.ink}
                                strokeWidth="4"
                                strokeLinecap="round"
                                fill="none"
                                transform={`rotate(${racer.browAngle} 73 -197)`}
                            />
                        )}
                    </g>
                </g>

                <Leg rig={rig.legNear} ox={6} p={p} near />

                {/* Feathered "trousers" over the near hip, on top of the leg — a
            real bird's thigh plumage hangs over the joint and hides it. */}
                <Plumes ox={12} oy={-88} dx={-9} dy={1} tx={-4} ty={12} n={3}
                    w={6.4} fill={p.body} hi={bodyLit} ink={p.ink} opacity={0.85} />
            </g>
        </g>
    );
};

export default Bird;