import React from 'react';
import { BUILDS, CombStyle, Palette, RacerIdentity, TailStyle, paletteFor, shade } from '../racers';
import { BirdRig, LegRig } from '../game/rig';

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

// ─── Combs ──────────────────────────────────────────────────────────────────
const Comb: React.FC<{ style: CombStyle; p: Palette }> = ({ style, p }) => {
    const hi = shade(p.comb, 0.1);

    if (style === 'crown') {
        const spikes: Array<[number, number, number, number, number, number]> = [
            [52, -196, 56, -224, 62, -198],
            [62, -199, 67, -231, 73, -200],
            [73, -198, 78, -222, 83, -197],
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
                <ellipse cx="60" cy="-200" rx="13" ry="5" fill={p.ink} />
                <ellipse cx="60" cy="-201" rx="11" ry="3.5" fill={p.comb} />
                <ellipse cx="59" cy="-202" rx="8" ry="1.6" fill={hi} />
                <ellipse cx="72" cy="-199" rx="11" ry="4.5" fill={p.ink} />
                <ellipse cx="72" cy="-200" rx="9" ry="3" fill={p.comb} />
            </>
        );
    }

    if (style === 'rose') {
        return (
            <>
                <path d="M48,-198 L34,-203 L48,-206 Z" fill={p.ink} />
                <ellipse cx="66" cy="-200" rx="22" ry="9" fill={p.ink} />
                <ellipse cx="66" cy="-201" rx="20" ry="7" fill={p.comb} />
                <ellipse cx="64" cy="-204" rx="14" ry="2.6" fill={hi} />
                <circle cx="56" cy="-205" r="3.5" fill={p.comb} />
                <circle cx="66" cy="-207" r="3.5" fill={p.comb} />
                <circle cx="76" cy="-205" r="3" fill={p.comb} />
            </>
        );
    }

    const peaks: Array<[number, number, number]> = [
        [52, -201, 5], [60, -206, 6], [68, -204, 5.5], [76, -201, 4.5], [82, -198, 3.5],
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
const Tail: React.FC<{ style: TailStyle; p: Palette }> = ({ style, p }) => {
    const dark = shade(p.accent, -0.07);

    if (style === 'sickle') {
        return (
            <>
                <path d="M0,0 Q-24,-14 -44,-58" fill="none" stroke={p.ink} strokeWidth="15" strokeLinecap="round" />
                <path d="M0,0 Q-24,-14 -44,-58" fill="none" stroke={p.accent} strokeWidth="11" strokeLinecap="round" />
                <path d="M-2,-4 Q-24,-18 -42,-56" fill="none" stroke={shade(p.accent, 0.09)} strokeWidth="3.5" strokeLinecap="round" />
                <path d="M4,6 Q-18,-2 -34,-40" fill="none" stroke={p.ink} strokeWidth="13" strokeLinecap="round" />
                <path d="M4,6 Q-18,-2 -34,-40" fill="none" stroke={p.body} strokeWidth="9" strokeLinecap="round" />
                <path d="M6,10 Q-12,6 -24,-22" fill="none" stroke={p.ink} strokeWidth="11" strokeLinecap="round" />
                <path d="M6,10 Q-12,6 -24,-22" fill="none" stroke={dark} strokeWidth="7" strokeLinecap="round" />
            </>
        );
    }

    if (style === 'fan') {
        const f: Array<[number, number]> = [[-52, -46], [-46, -24], [-34, -6], [-52, -66], [-20, 8]];
        return (
            <>
                {f.map(([x, y], i) => (
                    <path key={i} d={`M2,4 L${x},${y}`} stroke={p.ink} strokeWidth="14" strokeLinecap="round" fill="none" />
                ))}
                {f.map(([x, y], i) => (
                    <path key={`f${i}`} d={`M2,4 L${x},${y}`} stroke={i % 2 ? p.accent : p.body} strokeWidth="10" strokeLinecap="round" fill="none" />
                ))}
                {f.map(([x, y], i) => (
                    <path key={`h${i}`} d={`M0,2 L${x * 0.9},${y * 0.9}`} stroke={shade(i % 2 ? p.accent : p.body, 0.09)} strokeWidth="3" strokeLinecap="round" fill="none" />
                ))}
            </>
        );
    }

    if (style === 'stub') {
        return (
            <>
                <ellipse cx="-14" cy="-4" rx="21" ry="19" fill={p.ink} />
                <ellipse cx="-14" cy="-4" rx="18" ry="16" fill={p.accent} />
                <ellipse cx="-17" cy="-11" rx="10" ry="7" fill={shade(p.accent, 0.09)} />
                <path d="M-8,-16 L-26,-30 M-12,-2 L-34,-8" stroke={p.ink} strokeWidth="9" strokeLinecap="round" fill="none" />
                <path d="M-8,-16 L-26,-30 M-12,-2 L-34,-8" stroke={p.body} strokeWidth="5.5" strokeLinecap="round" fill="none" />
            </>
        );
    }

    const pl: Array<[number, number]> = [[-6, -78], [-16, -70], [-26, -56], [2, -72], [-32, -40]];
    const d = ([x, y]: [number, number]) => `M0,4 Q${x - 8},${y / 2} ${x},${y}`;
    return (
        <>
            {pl.map((v, i) => <path key={i} d={d(v)} stroke={p.ink} strokeWidth="13" strokeLinecap="round" fill="none" />)}
            {pl.map((v, i) => (
                <path key={`f${i}`} d={d(v)} stroke={i % 2 ? p.accent : p.body} strokeWidth="9" strokeLinecap="round" fill="none" />
            ))}
            {pl.map((v, i) => (
                <path key={`h${i}`} d={d([v[0] * 0.9, v[1] * 0.9])} stroke={shade(i % 2 ? p.accent : p.body, 0.09)} strokeWidth="3" strokeLinecap="round" fill="none" />
            ))}
        </>
    );
};

// ─── Hackles ────────────────────────────────────────────────────────────────
// The neck ruff. Six pointed feathers draping back over the shoulder, drawn
// front-to-back so each overlaps the one behind it.
const Hackles: React.FC<{ p: Palette }> = ({ p }) => {
    const hi = shade(p.light, 0.07);
    const rows = Array.from({ length: 6 }, (_, i) => {
        const t = i / 5;
        return {
            ox: 54 - t * 20,
            oy: -170 + t * 40,
            tx: 30 - t * 30,
            ty: -140 + t * 42,
            w: 6.5 - t * 1.2,
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
        </>
    );
};

// ─── Leg ────────────────────────────────────────────────────────────────────
// Three nested groups so hip, knee and foot rotate independently. The far leg
// is darkened rather than duplicated — cheap depth.
const Leg: React.FC<{ rig: LegRig; ox: number; p: Palette; near: boolean }> = ({ rig, ox, p, near }) => {
    const c = near ? p.leg : shade(p.leg, -0.22);
    const d = near ? p.legDark : shade(p.leg, -0.34);
    const toes = 'M0,0 L16,2 M0,0 L12,-5 M0,0 L-9,3';
    return (
        <g ref={(el) => { rig.hip = el; }} transform={`translate(${ox},-76)`}>
            <path d="M0,0 L0,30" stroke={d} strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M0,0 L0,30" stroke={c} strokeWidth="7" strokeLinecap="round" fill="none" />
            <g ref={(el) => { rig.knee = el; }} transform="translate(0,30)">
                <circle cx="0" cy="0" r="5" fill={d} />
                <circle cx="-0.6" cy="-0.6" r="3.2" fill={c} />
                <path d="M0,0 L0,36" stroke={d} strokeWidth="7" strokeLinecap="round" fill="none" />
                <path d="M0,0 L0,36" stroke={c} strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <g ref={(el) => { rig.foot = el; }} transform="translate(0,36)">
                    <path d={toes} stroke={d} strokeWidth="4.5" strokeLinecap="round" fill="none" />
                    <path d={toes} stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>
            </g>
        </g>
    );
};

// ─── Bird ───────────────────────────────────────────────────────────────────
const Bird: React.FC<{ racer: RacerIdentity; rig: BirdRig }> = ({ racer, rig }) => {
    const p = paletteFor(racer);
    const b = BUILDS[racer.build];
    const headDrop = (1 - b.neck) * 42;

    const bodyShade = shade(racer.bodyColor, -0.09);
    const bodyLit = shade(racer.bodyColor, 0.07);
    const headShade = shade(racer.bodyColor, -0.08);
    const wingLit = shade(p.accent, 0.09);
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
                    <stop offset="0.5" stopColor={p.accent} />
                    <stop offset="1" stopColor={shade(p.accent, -0.09)} />
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

                {/* Body: ink, base, then a clipped shadow blob and highlight. Those two
            clipped shapes are what stop it reading as a flat sticker. */}
                <ellipse cx="0" cy="-108" rx="53" ry="41" transform="rotate(-8 0 -108)" fill={p.ink} />
                <ellipse cx="0" cy="-108" rx="50" ry="38" transform="rotate(-8 0 -108)" fill={`url(#${gBody})`} />

                {/* Saddle — the rear feather layer, where body meets tail. */}
                <path d="M-46,-96 Q-20,-70 22,-76" fill="none" stroke={p.accent} strokeWidth="7" strokeLinecap="round" />
                <path d="M-44,-112 Q-22,-92 8,-96" fill="none" stroke={p.accent} strokeWidth="4" strokeLinecap="round" opacity="0.55" />

                {/* Breast — the front mass, catching the light. */}
                <ellipse cx="26" cy="-112" rx="27" ry="29" fill={p.ink} />
                <ellipse cx="26" cy="-112" rx="24" ry="26" fill={`url(#${gBreast})`} />

                <g ref={(el) => { rig.wing = el; }} transform="translate(-4,-108)">
                    <ellipse rx="28" ry="17" transform="rotate(-10)" fill={p.ink} />
                    <ellipse rx="25" ry="14" transform="rotate(-10)" fill={`url(#${gWing})`} />
                    {/* Primaries fanning off the back of the wing. */}
                    <path d={feather(-14, 2, -32, 10, 4, 3)} fill={p.ink} />
                    <path d={feather(-14, 2, -31, 9, 2.6, 3)} fill={shade(p.accent, -0.05)} />
                    <path d={feather(-12, 8, -28, 17, 3.6, 3)} fill={p.ink} />
                    <path d={feather(-12, 8, -27, 16, 2.4, 3)} fill={shade(p.accent, -0.05)} />
                </g>

                <g transform={`translate(36,-128) scale(1,${b.neck}) translate(-36,128)`}>
                    <path d="M36,-128 L56,-170" stroke={p.ink} strokeWidth="27" strokeLinecap="round" fill="none" />
                    <path d="M36,-128 L56,-170" stroke={p.light} strokeWidth="22" strokeLinecap="round" fill="none" />
                    <Hackles p={p} />
                </g>

                <g ref={(el) => { rig.head = el; }}>
                    <g transform={`translate(0,${headDrop}) scale(${b.head})`}>
                        <Comb style={racer.combStyle} p={p} />

                        <circle cx="66" cy="-182" r="21" fill={p.ink} />
                        <circle cx="66" cy="-182" r="18" fill={`url(#${gHead})`} />
                        {/* Cheek patch — separates the face from the skull. */}
                        <ellipse cx="76" cy="-176" rx="9" ry="7" fill={p.light} opacity="0.7" />

                        <path d="M78,-162 Q74,-150 68,-152 Q72,-158 72,-166 Z" fill={p.ink} />
                        <path d="M77,-163 Q74,-152 70,-153 Q73,-158 72,-165 Z" fill={p.wattle} />

                        {/* Beak: upper mandible with a slight hook, lower tucked under. */}
                        <path d="M84,-181 Q98,-179 108,-174 Q97,-171 84,-170 Z" fill={p.ink} />
                        <path d="M84,-180 Q97,-178 105,-174 Q96,-172 84,-170 Z" fill="#e89820" />
                        <path d="M84,-174 Q95,-173 105,-174 Q95,-170 84,-170 Z" fill={beakLo} />
                        <path d="M84,-174 Q96,-174 105,-174" stroke={p.ink} strokeWidth="1.2" fill="none" />

                        <circle cx="74" cy="-188" r="7.5" fill="#ffffff" stroke={p.ink} strokeWidth="1.5" />
                        <circle cx="76" cy="-188" r="3.6" fill="#141414" />
                        <circle cx="77.5" cy="-189.5" r="1.3" fill="#ffffff" />
                        {racer.browAngle !== null && (
                            <path
                                d="M68,-198 L84,-193"
                                stroke={p.ink}
                                strokeWidth="4"
                                strokeLinecap="round"
                                fill="none"
                                transform={`rotate(${racer.browAngle} 76 -196)`}
                            />
                        )}
                    </g>
                </g>

                <Leg rig={rig.legNear} ox={6} p={p} near />
            </g>
        </g>
    );
};

export default Bird;