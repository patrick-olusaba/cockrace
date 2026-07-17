import React from 'react';
import { STAGE_W, TRACK_H, TRACK_TOP } from '../game/constants';

// The scrolling world is nine <pattern> fills.
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
    fence: SVGPatternElement | null;
    grass: SVGPatternElement | null;
    dirt: SVGPatternElement | null;
    grassFg: SVGPatternElement | null;
}

export function emptyBackdropRig(): BackdropRig {
    return {
        clouds: null, mountains: null, far: null, treeline: null, hills: null,
        fence: null, grass: null, dirt: null, grassFg: null,
    };
}

/** A conifer: two stacked triangles. Reads at 12px, which is all it needs to do. */
const conifer = (x: number, base: number, h: number, w: number) =>
    `M${x - w},${base} L${x},${base - h * 0.62} L${x - w * 0.62},${base - h * 0.58} `
    + `L${x},${base - h} L${x + w * 0.62},${base - h * 0.58} L${x + w},${base - h * 0.62} Z`;

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

        {/* Fence, crowd and bunting. Full saturation — this is the near plane.
        The crowd is what turns a field into an event. */}
        <pattern ref={(el) => { rig.fence = el; }} id="pFence" width="112" height="46" patternUnits="userSpaceOnUse">
            <g fill="#3a3a44">
                <circle cx="14" cy="12" r="4" />
                <path d="M7,22 Q14,15 21,22 Z" />
                <circle cx="30" cy="10" r="4.2" />
                <path d="M22,21 Q30,13 38,21 Z" />
                <circle cx="52" cy="13" r="3.8" />
                <path d="M45,22 Q52,16 59,22 Z" />
                <circle cx="70" cy="11" r="4" />
                <path d="M63,21 Q70,14 77,21 Z" />
                <circle cx="92" cy="12" r="4.2" />
                <path d="M84,22 Q92,15 100,22 Z" />
            </g>
            <g opacity="0.9">
                <circle cx="14" cy="12" r="3" fill="#d9a06a" />
                <circle cx="30" cy="10" r="3.2" fill="#8a5a3a" />
                <circle cx="52" cy="13" r="2.9" fill="#e8c49a" />
                <circle cx="70" cy="11" r="3" fill="#6b4426" />
                <circle cx="92" cy="12" r="3.2" fill="#d9a06a" />
            </g>
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

        <pattern ref={(el) => { rig.grass = el; }} id="pGrass" width="64" height="18" patternUnits="userSpaceOnUse">
            <rect width="64" height="18" fill="#5fa82a" />
            <g stroke="#3f7d18" strokeWidth="2" strokeLinecap="round">
                <path d="M8,18 L6,7" /><path d="M20,18 L22,9" /><path d="M34,18 L32,6" />
                <path d="M48,18 L50,10" /><path d="M58,18 L57,8" />
            </g>
        </pattern>

        <pattern ref={(el) => { rig.grassFg = el; }} id="pGrassFg" width="64" height="18" patternUnits="userSpaceOnUse">
            <rect width="64" height="18" fill="#5fa82a" />
            <g stroke="#2f6b16" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10,18 L7,5" /><path d="M24,18 L27,7" /><path d="M38,18 L35,4" />
                <path d="M52,18 L55,8" />
            </g>
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
        <rect x="0" y="0" width={STAGE_W} height={TRACK_TOP + 2} fill="url(#gSky)" />
        <rect x="0" y="0" width={STAGE_W} height="90" fill="url(#pClouds)" />
        <rect x="0" y="42" width={STAGE_W} height="66" fill="url(#pMountains)" />
        <rect x="0" y="40" width={STAGE_W} height="76" fill="url(#pFar)" />
        <rect x="0" y="60" width={STAGE_W} height="54" fill="url(#pTreeline)" />
        <rect x="0" y="42" width={STAGE_W} height="80" fill="url(#pHills)" />
        <rect x="0" y="76" width={STAGE_W} height="46" fill="url(#pFence)" />
        <rect x="0" y="104" width={STAGE_W} height="18" fill="url(#pGrass)" />
    </>
);

export const GroundLayers: React.FC = () => (
    <>
        <rect x="0" y={TRACK_TOP} width={STAGE_W} height={TRACK_H} fill="#c17a3a" />
        <rect x="0" y={TRACK_TOP} width={STAGE_W} height={TRACK_H} fill="url(#pDirt)" />
        {/* Shadow cast by the fence onto the top of the track — grounds the two planes. */}
        <rect x="0" y={TRACK_TOP} width={STAGE_W} height="7" fill="#8a5426" opacity="0.35" />
    </>
);

export const Foreground: React.FC = () => (
    <>
        <rect x="0" y="334" width={STAGE_W} height="10" fill="#3f7d18" />
        <rect x="0" y="342" width={STAGE_W} height="18" fill="url(#pGrassFg)" />
        <rect x="0" y="358" width={STAGE_W} height="42" fill="#5fa82a" />
    </>
);