import React, { useMemo } from 'react';
import { FINISH_X, LANE_Y, START_X, STAGE_W, TRACK_H, TRACK_TOP } from '../game/constants';

const CHECK = 24;
const BAND = 48;
const TRACK_BOT = TRACK_TOP + TRACK_H;

/** Lane dividers run along the track, so they're horizontal and never scroll. */
export const LaneLines: React.FC = () => {
    const ys = useMemo(
        () => LANE_Y.slice(0, -1).map((y, i) => (y + LANE_Y[i + 1]) / 2),
        [],
    );
    return (
        <g>
            {ys.map((y) => (
                <g key={y}>
                    <line x1="0" y1={y + 1} x2={STAGE_W} y2={y + 1} stroke="#9c5f28" strokeWidth="3" opacity="0.35" />
                    <line x1="0" y1={y} x2={STAGE_W} y2={y} stroke="#d9a468" strokeWidth="3" opacity="0.8" />
                </g>
            ))}
        </g>
    );
};

// ─── Start gate ─────────────────────────────────────────────────────────────
const StartGate: React.FC = () => (
    <g>
        <rect x={START_X - 30} y={TRACK_TOP} width="26" height={TRACK_H} fill="#7d4620" />
        <rect x={START_X - 30} y={TRACK_TOP} width="26" height={TRACK_H} fill="#a9662f" opacity="0.5" />
        {LANE_Y.map((y, i) => (
            <g key={i}>
                <rect x={START_X - 27} y={y - 20} width="20" height="40" rx="3" fill="#6b3a18" />
                <text
                    x={START_X - 17}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#f0dcc0"
                    fontSize="20"
                    fontWeight="700"
                    fontFamily='"Trebuchet MS", sans-serif'
                >
                    {i + 1}
                </text>
            </g>
        ))}
        <rect x={START_X - 4} y={TRACK_TOP} width="5" height={TRACK_H} fill="#ffffff" opacity="0.85" />
    </g>
);

// ─── Finish gantry ──────────────────────────────────────────────────────────
// The reference just paints a checkered band on the dirt. A band alone reads as
// a texture, not a structure — so this adds posts and a banner that break the
// horizon line, which is what actually makes it register as somewhere to arrive.
const FinishGantry: React.FC = () => {
    const checks = useMemo(() => {
        const out: Array<{ x: number; y: number }> = [];
        const cols = Math.round(BAND / CHECK);
        for (let r = 0; r * CHECK < TRACK_H; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 0) {
                    out.push({ x: FINISH_X - BAND / 2 + c * CHECK, y: TRACK_TOP + r * CHECK });
                }
            }
        }
        return out;
    }, []);

    return (
        <g>
            {/* Checkered band, with a soft edge either side so it sits in the dirt
          rather than floating on top of it. */}
            <rect x={FINISH_X - BAND / 2} y={TRACK_TOP} width={BAND} height={TRACK_H} fill="#f4f4f2" />
            {checks.map((c, i) => (
                <rect
                    key={i}
                    x={c.x}
                    y={c.y}
                    width={CHECK}
                    height={Math.min(CHECK, TRACK_BOT - c.y)}
                    fill="#26262b"
                />
            ))}
            <rect x={FINISH_X - BAND / 2 - 3} y={TRACK_TOP} width="3" height={TRACK_H} fill="#8a5426" opacity="0.5" />
            <rect x={FINISH_X + BAND / 2} y={TRACK_TOP} width="3" height={TRACK_H} fill="#8a5426" opacity="0.5" />

            {/* Far post + banner. Breaking the fence line is what sells it as a gate. */}
            <rect x={FINISH_X - 40} y="58" width="9" height="66" rx="2" fill="#6b3a18" />
            <rect x={FINISH_X - 38} y="58" width="4" height="66" fill="#a9662f" />
            <rect x={FINISH_X + 31} y="58" width="9" height="66" rx="2" fill="#6b3a18" />
            <rect x={FINISH_X + 33} y="58" width="4" height="66" fill="#a9662f" />

            <rect x={FINISH_X - 46} y="44" width="92" height="30" rx="4" fill="#6b3a18" />
            <rect x={FINISH_X - 43} y="47" width="86" height="24" rx="3" fill="#c9302c" />
            <rect x={FINISH_X - 43} y="47" width="86" height="9" rx="3" fill="#e0453f" />
            <text
                x={FINISH_X}
                y="60"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff6e8"
                fontSize="16"
                fontWeight="700"
                letterSpacing="1.5"
                fontFamily='"Trebuchet MS", sans-serif'
            >
                FINISH
            </text>

            {/* Flags on the posts. */}
            <path d={`M${FINISH_X - 36},58 L${FINISH_X - 36},40 Q${FINISH_X - 22},44 ${FINISH_X - 36},48 Z`} fill="#ffd23f" />
            <path d={`M${FINISH_X + 35},58 L${FINISH_X + 35},40 Q${FINISH_X + 49},44 ${FINISH_X + 35},48 Z`} fill="#ffd23f" />

            {/* Near-side marker posts, in front of the track. */}
            <rect x={FINISH_X - 40} y={TRACK_BOT - 2} width="8" height="22" rx="2" fill="#6b3a18" />
            <rect x={FINISH_X + 32} y={TRACK_BOT - 2} width="8" height="22" rx="2" fill="#6b3a18" />
        </g>
    );
};

/** Start + finish. This whole group translates by -camX (parallax factor 1). */
export const TrackMarks: React.FC<{ groupRef: (el: SVGGElement | null) => void }> = ({ groupRef }) => (
    <g ref={groupRef}>
        <StartGate />
        <FinishGantry />
    </g>
);