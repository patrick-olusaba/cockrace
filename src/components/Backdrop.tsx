import React from 'react';
import { TRACK_H, TRACK_TOP, VIEW_W_MAX } from '../game/constants';

// The scrolling world is thirteen <pattern> fills.
//
// Every full-bleed rect is VIEW_W_MAX wide, not STAGE_W. The viewBox width
// flexes with the device (see constants.ts), so on an ultrawide it can reach
// 1100 — an 800-wide rect would leave 300 units of blank canvas past the edge.
// Patterns tile, so the extra width is free.
//
// Scrolling is applied as patternTransform on the pattern, NOT as a transform
// on the rect. Patterns tile infinitely, so the rects stay put and the track is
// effectively endless.
//
// ── Atmospheric perspective ────────────────────────────────────────────────
// Every colour below is the base green lerped toward the horizon sky (#bfeaf8)
// by distance: mountains 66%, far hills 44%, treeline 24%, near hills 6%. That
// wash is what makes the backdrop feel deep — far more than adding detail does.
// Anything at or in front of the fence stays fully saturated.

export interface BackdropRig {
    clouds: SVGPatternElement | null;
    mountains: SVGPatternElement | null;
    far: SVGPatternElement | null;
    treeline: SVGPatternElement | null;
    hills: SVGPatternElement | null;
    stand: SVGPatternElement | null;
    crowdB: SVGPatternElement | null;
    crowdC: SVGPatternElement | null;
    fence: SVGPatternElement | null;
    grass: SVGPatternElement | null;
    dirt: SVGPatternElement | null;
    grassFg: SVGPatternElement | null;
    turf: SVGPatternElement | null;
}

export function emptyBackdropRig(): BackdropRig {
    return {
        clouds: null, mountains: null, far: null, treeline: null, hills: null,
        stand: null, crowdB: null, crowdC: null,
        fence: null, grass: null, dirt: null, grassFg: null, turf: null,
    };
}

/** A conifer: two stacked triangles. Reads at 12px, which is all it needs to do. */
const conifer = (x: number, base: number, h: number, w: number) =>
    `M${x - w},${base} L${x},${base - h * 0.62} L${x - w * 0.62},${base - h * 0.58} `
    + `L${x},${base - h} L${x + w * 0.62},${base - h * 0.58} L${x + w},${base - h * 0.62} Z`;

/**
 * A row of spectators across one tile.
 *
 * Only the lower rows are drawn. There used to be a third at the top of the
 * stand, and it read as a line of headless torsos hanging in mid-air — its
 * heads landed against the stand's top cap with nothing behind them, so the
 * bodies looked pinned to the sky. The upper tiers are simply empty now.
 *
 * The hair cap is a circular SEGMENT of the head, not a semicircle sitting on
 * it: cutting a circle of radius h at depth 0.3h gives a chord half-width of
 * sqrt(h^2 - (0.3h)^2) = 0.954h. Use h and the chord becomes a diameter, the
 * arc bulges a further h above it, and every head wears a floating hat.
 */
const HAIR_CUT = 0.3;
const HAIR_HW = Math.sqrt(1 - HAIR_CUT * HAIR_CUT); // 0.954

function crowdRow(y: number, seed: number, size: number) {
    const shirts = ['#c9453d', '#3d7bc9', '#e0b23f', '#7a4fb5', '#3f9e6a', '#d97b3f', '#b84a8a', '#4a90a4'];
    const skins = ['#e8c49a', '#c98d5e', '#8a5a3a', '#6b4426', '#d9a06a'];
    const hairs = ['#2f2f38', '#4a3526', '#6b5334', '#1f1f26'];
    const out: React.ReactElement[] = [];
    const N = 18;
    const step = 180 / N;
    for (let i = 0; i < N; i++) {
        const x = i * step + ((seed * 7 + i * 13) % 5) - 2;
        const h = size * (0.9 + ((seed + i * 3) % 4) * 0.05);
        const yy = y + (((seed + i * 5) % 3) - 1) * 0.6; // break the ruled line
        const hw = h * HAIR_HW;
        const cut = yy - h * HAIR_CUT;
        out.push(
            <g key={i}>
                <path
                    d={`M${x - h * 1.45},${yy + h * 3.2} Q${x - h * 1.35},${yy + h * 0.85} ${x},${yy + h * 0.85} `
                        + `Q${x + h * 1.35},${yy + h * 0.85} ${x + h * 1.45},${yy + h * 3.2} Z`}
                    fill={shirts[(seed * 3 + i) % shirts.length]}
                />
                <circle cx={x} cy={yy} r={h} fill={skins[(seed * 2 + i) % skins.length]} />
                {(seed + i) % 5 !== 0 && (
                    <path
                        d={`M${x - hw},${cut} A${h},${h} 0 0 1 ${x + hw},${cut} Z`}
                        fill={hairs[(seed + i * 2) % hairs.length]}
                    />
                )}
            </g>,
        );
    }
    return out;
}

/**
 * A run of grass blades across one tile.
 *
 * The thing that makes grass read as grass is the SILHOUETTE. A rect of green
 * with a few tick marks on it is a green rect — the eye reads the straight top
 * edge as an object boundary, not a plant. So the blades are drawn over
 * transparency and their tips ARE the top edge of the layer.
 *
 * Each blade is a tapered curve: wide at the root, pointed at the tip, leaning
 * a little. Deterministic from `seed`, so the tile never changes between
 * renders — a tile that reshuffles would shimmer as it scrolls.
 */
function blades(
    n: number, tileW: number, baseY: number, minH: number, maxH: number,
    seed: number, colors: string[], lean = 3.5, rootW = 1.7,
) {
    const out: React.ReactElement[] = [];
    for (let i = 0; i < n; i++) {
        const a = ((seed * 31 + i * 17) % 97) / 97;
        const b = ((seed * 13 + i * 29) % 89) / 89;
        const c = ((seed * 7 + i * 43) % 83) / 83;
        const x = (i + a * 0.85) * (tileW / n);
        const h = minH + b * (maxH - minH);
        const lx = (c - 0.5) * 2 * lean * (h / maxH);
        const w = rootW * (0.65 + b * 0.6);
        out.push(
            <path
                key={i}
                d={`M${(x - w).toFixed(1)},${baseY} Q${(x + lx * 0.3).toFixed(1)},${(baseY - h * 0.55).toFixed(1)} `
                    + `${(x + lx).toFixed(1)},${(baseY - h).toFixed(1)} `
                    + `Q${(x + lx * 0.05).toFixed(1)},${(baseY - h * 0.5).toFixed(1)} ${(x + w).toFixed(1)},${baseY} Z`}
                fill={colors[(seed + i) % colors.length]}
            />,
        );
    }
    return out;
}

/** Irregular tonal patches. Real turf is never one green — it's a dozen. */
function clumps(n: number, tileW: number, tileH: number, seed: number, colors: string[], op = 0.55) {
    const out: React.ReactElement[] = [];
    for (let i = 0; i < n; i++) {
        const a = ((seed * 19 + i * 23) % 91) / 91;
        const b = ((seed * 11 + i * 37) % 79) / 79;
        const c = ((seed * 5 + i * 47) % 71) / 71;
        out.push(
            <ellipse
                key={i}
                cx={(a * tileW).toFixed(1)}
                cy={(b * tileH).toFixed(1)}
                rx={(5 + c * 11).toFixed(1)}
                ry={(2 + c * 3.5).toFixed(1)}
                fill={colors[(seed + i) % colors.length]}
                opacity={op}
            />,
        );
    }
    return out;
}

export const BackdropDefs: React.FC<{ rig: BackdropRig }> = ({ rig }) => (
    <defs>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4fb3e0" />
            <stop offset="0.62" stopColor="#8fd6ee" />
            <stop offset="1" stopColor="#bfeaf8" />
        </linearGradient>

        <pattern ref={(el) => { rig.clouds = el; }} id="pClouds" width="420" height="90" patternUnits="userSpaceOnUse">
            <g fill="#ffffff" opacity="0.9">
                <ellipse cx="60" cy="30" rx="30" ry="12" />
                <ellipse cx="84" cy="24" rx="22" ry="15" />
                <ellipse cx="108" cy="31" rx="24" ry="10" />
                <ellipse cx="268" cy="52" rx="26" ry="10" />
                <ellipse cx="292" cy="46" rx="19" ry="13" />
                <ellipse cx="314" cy="53" rx="21" ry="9" />
            </g>
            <g fill="#ffffff" opacity="0.45">
                <ellipse cx="190" cy="16" rx="34" ry="8" />
                <ellipse cx="376" cy="26" rx="28" ry="7" />
            </g>
        </pattern>

        {/* Farthest ridge — 66% washed, barely distinguishable from sky. */}
        <pattern ref={(el) => { rig.mountains = el; }} id="pMountains" width="760" height="66" patternUnits="userSpaceOnUse">
            <path
                d="M0,66 L0,40 L70,14 L128,36 L196,6 L268,34 L330,20 L402,42 L470,12 L548,38 L612,22 L688,44 L760,26 L760,66 Z"
                fill="#97d0b1"
            />
            <path d="M196,6 L228,18 L164,18 Z" fill="#ffffff" opacity="0.55" />
            <path d="M470,12 L498,24 L442,24 Z" fill="#ffffff" opacity="0.45" />
        </pattern>

        {/* Far hills — 44% washed. */}
        <pattern ref={(el) => { rig.far = el; }} id="pFar" width="620" height="76" patternUnits="userSpaceOnUse">
            <path d="M0,76 L0,44 Q80,10 168,36 Q244,58 322,26 Q404,-4 486,32 Q556,60 620,30 L620,76 Z" fill="#7dbf84" />
            <g fill="#6ea379">
                <path d={conifer(96, 40, 20, 6)} />
                <path d={conifer(112, 42, 15, 5)} />
                <path d={conifer(430, 30, 18, 6)} />
                <path d={conifer(556, 40, 16, 5)} />
            </g>
        </pattern>

        {/* Mid treeline — 24% washed. A dense band, no ground shape of its own. */}
        <pattern ref={(el) => { rig.treeline = el; }} id="pTreeline" width="540" height="54" patternUnits="userSpaceOnUse">
            <path d="M0,54 L0,34 Q64,18 132,32 Q210,48 286,28 Q370,10 448,32 Q500,46 540,32 L540,54 Z" fill="#66b05a" />
            <g fill="#52894c">
                <path d={conifer(40, 36, 22, 7)} />
                <path d={conifer(58, 38, 16, 5)} />
                <path d={conifer(206, 44, 19, 6)} />
                <path d={conifer(300, 30, 24, 7)} />
                <path d={conifer(318, 33, 17, 5)} />
                <path d={conifer(462, 38, 20, 6)} />
                <ellipse cx="140" cy="34" rx="18" ry="11" />
                <ellipse cx="392" cy="30" rx="20" ry="12" />
            </g>
        </pattern>

        {/* Near hills — 6% washed, essentially full colour. Widest tile because
        it's the layer you actually look at. */}
        <pattern ref={(el) => { rig.hills = el; }} id="pHills" width="880" height="80" patternUnits="userSpaceOnUse">
            <path
                d="M0,80 L0,52 Q70,24 150,46 Q228,66 296,40 Q378,12 452,44 Q520,72 596,48 Q672,26 748,50 Q818,70 880,44 L880,80 Z"
                fill="#51a334"
            />
            {/* Lit crown along each rise. */}
            <path d="M0,52 Q70,24 150,46" fill="none" stroke="#6fc44a" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <path d="M296,40 Q378,12 452,44" fill="none" stroke="#6fc44a" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <path d="M596,48 Q672,26 748,50" fill="none" stroke="#6fc44a" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <g fill="#387324">
                <path d={conifer(84, 50, 30, 9)} />
                <path d={conifer(104, 53, 22, 7)} />
                <path d={conifer(360, 24, 26, 8)} />
                <path d={conifer(382, 22, 34, 10)} />
                <path d={conifer(404, 28, 21, 7)} />
                <path d={conifer(690, 32, 28, 9)} />
                <path d={conifer(712, 36, 20, 6)} />
                <ellipse cx="238" cy="58" rx="24" ry="14" />
                <ellipse cx="258" cy="62" rx="17" ry="10" />
                <ellipse cx="530" cy="60" rx="21" ry="13" />
                <ellipse cx="820" cy="56" rx="23" ry="14" />
            </g>
            <g fill="#4a9130">
                <ellipse cx="232" cy="54" rx="13" ry="7" />
                <ellipse cx="524" cy="56" rx="11" ry="6" />
                <ellipse cx="814" cy="52" rx="12" ry="7" />
            </g>
        </pattern>

        {/* ── Grandstand ────────────────────────────────────────────────────────
        NOTE the y="38" on these three patterns. patternUnits="userSpaceOnUse"
        anchors the tile grid to the canvas origin, NOT to the rect it fills —
        so without it the rect's top edge at y=38 slices through the middle of
        a tile. That's what produced a row of headless torsos at the top of the
        stand: the heads sat above y=38 and were clipped, the shirts survived.
        Anchoring the grid to the rect makes local coordinates mean what they
        say. Any pattern whose rect doesn't start at a multiple of its own
        height needs this. */}
        <pattern ref={(el) => { rig.stand = el; }} id="pStand" x="0" y="38" width="180" height="56" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="180" height="56" fill="#8e9aa4" />
            <rect x="0" y="0" width="180" height="4" fill="#6c7883" />
            {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                    <rect x="0" y={2 + i * 12} width="180" height="12" fill={i % 2 ? '#a3aeb8' : '#97a3ad'} />
                    <rect x="0" y={2 + i * 12} width="180" height="2" fill="#c2ccd4" />
                    <rect x="0" y={12 + i * 12} width="180" height="2" fill="#75818c" />
                </g>
            ))}
            {/* stairs breaking up the run */}
            <rect x="84" y="2" width="13" height="54" fill="#b6c0c8" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x="84" y={4 + i * 11} width="13" height="2.5" fill="#8c98a2" />
            ))}
            <rect x="0" y="52" width="180" height="4" fill="#5f6a74" />
        </pattern>

        {/* Two rows only, on the lower tiers. Same x-rate as the stand — a
        different rate would slide the spectators off their seats — but each
        bobs on its own phase, so the stand churns instead of pulsing. */}
        <pattern ref={(el) => { rig.crowdB = el; }} id="pCrowdB" x="0" y="38" width="180" height="56" patternUnits="userSpaceOnUse">
            {crowdRow(12, 4, 3.5)}
        </pattern>
        <pattern ref={(el) => { rig.crowdC = el; }} id="pCrowdC" x="0" y="38" width="180" height="56" patternUnits="userSpaceOnUse">
            {crowdRow(26, 7, 3.8)}
        </pattern>

        {/* Fence and bunting — the barrier in front of the stand. */}
        <pattern ref={(el) => { rig.fence = el; }} id="pFence" width="112" height="46" patternUnits="userSpaceOnUse">
            <rect x="0" y="10" width="112" height="6" fill="#a9662f" />
            <rect x="0" y="10" width="112" height="2" fill="#c88a4d" />
            <rect x="0" y="26" width="112" height="6" fill="#a9662f" />
            <rect x="0" y="26" width="112" height="2" fill="#c88a4d" />
            <rect x="16" y="2" width="9" height="44" rx="2" fill="#7d4620" />
            <rect x="18" y="2" width="4" height="44" fill="#a9662f" />
            {/* Bunting strung along the top rail. */}
            <path d="M0,4 Q28,10 56,4 Q84,10 112,4" fill="none" stroke="#7d4620" strokeWidth="1" />
            <path d="M12,6 L20,6 L16,13 Z" fill="#e63946" />
            <path d="M40,6 L48,6 L44,13 Z" fill="#ffd23f" />
            <path d="M68,6 L76,6 L72,13 Z" fill="#3a86ff" />
            <path d="M96,6 L104,6 L100,13 Z" fill="#f1f1f1" />
        </pattern>

        {/* Trackside grass. Turf band at the bottom, blades rising into
        transparency above — so the top edge is a row of tips, not a rect. */}
        <pattern ref={(el) => { rig.grass = el; }} id="pGrass" x="0" y="98" width="72" height="24" patternUnits="userSpaceOnUse">
            {blades(20, 72, 12, 4, 11, 3, ['#3f8a1e', '#4a9528', '#357c18'], 2.6, 1.4)}
            <rect y="10" width="72" height="14" fill="#4a9528" />
            {clumps(4, 72, 14, 5, ['#57a832', '#3f8a1e'], 0.5).map((el, i) =>
                React.cloneElement(el, { key: `c${i}`, cy: 12 + i * 3 }))}
            {blades(16, 72, 13, 3, 9, 9, ['#57a832', '#68b83c', '#4a9528'], 2.4, 1.3)}
            {/* base shadow where the blades meet the soil */}
            <rect y="20" width="72" height="4" fill="#2f6b16" opacity="0.35" />
        </pattern>

        {/* Foreground edge — the ragged line where turf meets the track. Taller
        and higher-contrast than the trackside band because it's nearer. */}
        <pattern ref={(el) => { rig.grassFg = el; }} id="pGrassFg" x="0" y="326" width="72" height="30" patternUnits="userSpaceOnUse">
            {blades(22, 72, 14, 6, 15, 2, ['#2f6b16', '#3f8a1e', '#276012'], 4, 2)}
            <rect y="12" width="72" height="18" fill="#3f8a1e" />
            {blades(18, 72, 15, 5, 13, 7, ['#4a9528', '#57a832', '#3f8a1e'], 3.6, 1.9)}
            {/* a few dry blades — pure green everywhere is the giveaway */}
            {blades(4, 72, 15, 4, 10, 13, ['#8a9e2e'], 3, 1.5)}
        </pattern>

        {/* Foreground turf body. No silhouette here, just tone — the ragged edge
        above already did that job, and repeating it would read as stripes. */}
        <pattern ref={(el) => { rig.turf = el; }} id="pTurf" x="0" y="356" width="72" height="44" patternUnits="userSpaceOnUse">
            <rect width="72" height="44" fill="#4a9528" />
            {clumps(7, 72, 44, 4, ['#57a832', '#3f8a1e', '#68b83c'], 0.45)}
            {clumps(4, 72, 44, 11, ['#2f6b16'], 0.18)}
            {blades(14, 72, 16, 4, 9, 6, ['#3f8a1e', '#57a832'], 2.6, 1.5)}
            {blades(12, 72, 33, 4, 10, 21, ['#357c18', '#4a9528'], 2.6, 1.5)}
            {blades(10, 72, 44, 4, 9, 17, ['#3f8a1e', '#57a832'], 2.6, 1.5)}
        </pattern>

        <pattern ref={(el) => { rig.dirt = el; }} id="pDirt" width="70" height="70" patternUnits="userSpaceOnUse">
            <g fill="#a8632b" opacity="0.5">
                <circle cx="9" cy="14" r="1.6" /><circle cx="31" cy="6" r="1.2" /><circle cx="52" cy="20" r="1.7" />
                <circle cx="17" cy="41" r="1.3" /><circle cx="44" cy="52" r="1.5" /><circle cx="63" cy="37" r="1.2" />
                <circle cx="26" cy="63" r="1.6" /><circle cx="58" cy="66" r="1.3" />
            </g>
            <g fill="#d8955a" opacity="0.35">
                <ellipse cx="22" cy="28" rx="9" ry="2" /><ellipse cx="56" cy="9" rx="7" ry="1.6" />
                <ellipse cx="38" cy="60" rx="8" ry="1.8" />
            </g>
        </pattern>
    </defs>
);

export const SkyLayers: React.FC = () => (
    <>
        <rect x="0" y="0" width={VIEW_W_MAX} height={TRACK_TOP + 2} fill="url(#gSky)" />
        <rect x="0" y="0" width={VIEW_W_MAX} height="90" fill="url(#pClouds)" />
        <rect x="0" y="42" width={VIEW_W_MAX} height="66" fill="url(#pMountains)" />
        <rect x="0" y="40" width={VIEW_W_MAX} height="76" fill="url(#pFar)" />
        <rect x="0" y="60" width={VIEW_W_MAX} height="54" fill="url(#pTreeline)" />
        <rect x="0" y="42" width={VIEW_W_MAX} height="80" fill="url(#pHills)" />
        <rect x="0" y="38" width={VIEW_W_MAX} height="56" fill="url(#pStand)" />
        <rect x="0" y="38" width={VIEW_W_MAX} height="56" fill="url(#pCrowdB)" />
        <rect x="0" y="38" width={VIEW_W_MAX} height="56" fill="url(#pCrowdC)" />
        {/* stand's shadow onto the grass strip */}
        <rect x="0" y="94" width={VIEW_W_MAX} height="5" fill="#2f6b16" opacity="0.4" />
        <rect x="0" y="76" width={VIEW_W_MAX} height="46" fill="url(#pFence)" />
        <rect x="0" y="98" width={VIEW_W_MAX} height="24" fill="url(#pGrass)" />
    </>
);

export const GroundLayers: React.FC = () => (
    <>
        <rect x="0" y={TRACK_TOP} width={VIEW_W_MAX} height={TRACK_H} fill="#c17a3a" />
        <rect x="0" y={TRACK_TOP} width={VIEW_W_MAX} height={TRACK_H} fill="url(#pDirt)" />
        {/* Shadow cast by the fence onto the top of the track — grounds the two planes. */}
        <rect x="0" y={TRACK_TOP} width={VIEW_W_MAX} height="7" fill="#8a5426" opacity="0.35" />
    </>
);

export const Foreground: React.FC = () => (
    <>
        {/* Body first, ragged edge over it — the edge tile's own turf band
        overlaps the join so there's no seam. */}
        <rect x="0" y="356" width={VIEW_W_MAX} height="44" fill="url(#pTurf)" />
        <rect x="0" y="326" width={VIEW_W_MAX} height="30" fill="url(#pGrassFg)" />
    </>
);