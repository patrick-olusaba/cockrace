import React from 'react';
import { RACERS, RacerIdentity, paletteFor } from '../racers';
import { PAYOUT_MULT } from '../game/constants';
import { emptyRig } from '../game/rig';
import Bird from './Bird';

interface ResultModalProps {
    /** Racer ids, winner first. */
    order: number[];
    /** The lane the player backed, or null if they sat it out. */
    picked: number | null;
    betAmount: number;
    onClose: () => void;
}

// Podium blocks: [x centre, top y, width]. 1st is tallest and centre.
const BLOCKS: Record<number, { cx: number; top: number; w: number }> = {
    1: { cx: 230, top: 262, w: 84 },
    2: { cx: 146, top: 292, w: 80 },
    3: { cx: 314, top: 302, w: 80 },
};
const FLOOR = 338;
const BIRD_S = 0.34;

const PLACE_FILL: Record<number, string> = { 1: '#f2a03d', 2: '#8fa7b8', 3: '#d4884a' };

/** The winner's bird stands on the top block; the rig renders in its idle pose. */
const PodiumBird: React.FC<{ racer: RacerIdentity; x: number; y: number; flip?: boolean; cheer?: boolean }> = ({
                                                                                                                   racer, x, y, flip, cheer,
                                                                                                               }) => (
    <g
        className={cheer ? 'podium-bird cheer' : 'podium-bird'}
        transform={`translate(${x},${y}) scale(${flip ? -BIRD_S : BIRD_S},${BIRD_S})`}
    >
        <Bird racer={racer} rig={emptyRig()} />
    </g>
);

const Block: React.FC<{ place: number }> = ({ place }) => {
    const b = BLOCKS[place];
    const x = b.cx - b.w / 2;
    const h = FLOOR - b.top;
    return (
        <g>
            <ellipse cx={b.cx} cy={FLOOR + 2} rx={b.w / 2 + 6} ry="6" fill="#000000" opacity="0.16" />
            <rect x={x} y={b.top} width={b.w} height={h} rx="3" fill="#d7dde2" />
            <rect x={x} y={b.top} width={b.w} height="9" rx="3" fill="#f2f5f7" />
            <rect x={x} y={b.top + 9} width="6" height={h - 9} fill="#ffffff" opacity="0.5" />
            <rect x={x + b.w - 6} y={b.top + 9} width="6" height={h - 9} fill="#9aa6ae" opacity="0.45" />
            <text
                x={b.cx}
                y={b.top + 9 + (h - 9) / 2 + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={PLACE_FILL[place]}
                stroke="#ffffff"
                strokeWidth="1.5"
                paintOrder="stroke"
                fontSize={place === 1 ? 40 : 32}
                fontWeight="700"
                fontFamily='"Trebuchet MS", sans-serif'
            >
                {place}
            </text>
        </g>
    );
};

const ResultModal: React.FC<ResultModalProps> = ({ order, picked, betAmount, onClose }) => {
    const byId = (id: number) => RACERS.find((r) => r.id === id)!;
    const won = picked !== null && order[0] === picked;
    const payout = won ? Math.floor(betAmount * PAYOUT_MULT) : 0;

    const first = byId(order[0]);
    const second = order[1] ? byId(order[1]) : null;
    const third = order[2] ? byId(order[2]) : null;
    const fourth = order[3] ? byId(order[3]) : null;

    return (
        <div className="rm-backdrop" role="dialog" aria-modal="true" aria-label="Race result">
            <div className="rm-card">
                <button className="rm-close" onClick={onClose} aria-label="Close results">✕</button>

                <div className="rm-scene">
                    <svg viewBox="0 0 460 380" style={{ display: 'block', width: '100%' }}>
                        <defs>
                            <linearGradient id="rmSky" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#6ec6e8" />
                                <stop offset="1" stopColor="#cdeef9" />
                            </linearGradient>
                            <linearGradient id="rmGrass" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#7cc44a" />
                                <stop offset="1" stopColor="#4d9128" />
                            </linearGradient>
                        </defs>

                        <rect x="0" y="0" width="460" height="170" fill="url(#rmSky)" />
                        <g fill="#ffffff" opacity="0.85">
                            <ellipse cx="70" cy="52" rx="24" ry="9" />
                            <ellipse cx="90" cy="46" rx="18" ry="12" />
                            <ellipse cx="386" cy="40" rx="22" ry="8" />
                            <ellipse cx="404" cy="35" rx="16" ry="11" />
                        </g>

                        {/* Backdrop is the race environment's palette, washed the same way —
                so the podium reads as the same world, not a different screen. */}
                        <path d="M0,170 L0,120 Q90,88 190,112 Q290,136 370,104 Q420,86 460,102 L460,170 Z" fill="#97d0b1" />
                        <path d="M0,175 L0,138 Q100,110 200,134 Q300,158 380,128 Q430,110 460,124 L460,175 Z" fill="#7dbf84" />
                        <g fill="#387324">
                            <path d="M34,140 L44,116 L37,117 L44,98 L51,117 L54,116 Z" />
                            <path d="M56,143 L64,124 L58,125 L64,110 L70,125 L72,124 Z" />
                            <path d="M404,136 L414,112 L407,113 L414,94 L421,113 L424,112 Z" />
                        </g>
                        <rect x="0" y="160" width="460" height="220" fill="url(#rmGrass)" />
                        <ellipse cx="120" cy="196" rx="90" ry="14" fill="#6bb63c" opacity="0.55" />
                        <ellipse cx="360" cy="212" rx="80" ry="12" fill="#6bb63c" opacity="0.45" />

                        {/* Hanging signs */}
                        <g>
                            <path d="M150,0 L152,34 M310,0 L308,34" stroke="#6b4a2a" strokeWidth="2.5" />
                            <rect x="128" y="30" width="204" height="46" rx="5" fill="#6b3a18" />
                            <rect x="132" y="34" width="196" height="38" rx="3" fill="#a9662f" />
                            <rect x="132" y="34" width="196" height="12" rx="3" fill="#c07f45" />
                            <text
                                x="230" y="54" textAnchor="middle" dominantBaseline="central"
                                fill="#ffffff" fontSize="26" fontWeight="700"
                                fontFamily='"Trebuchet MS", sans-serif'
                                stroke="#6b3a18" strokeWidth="3" paintOrder="stroke"
                            >
                                {won ? `+${payout.toLocaleString('en-US').replace(/,/g, ' ')} $` : '0 $'}
                            </text>

                            <rect x="146" y="76" width="168" height="38" rx="4" fill="#c08a52" />
                            <rect x="150" y="80" width="160" height="30" rx="3" fill="#e0b483" />
                            <rect x="150" y="80" width="160" height="9" rx="3" fill="#eec49a" />
                            <text
                                x="230" y="95" textAnchor="middle" dominantBaseline="central"
                                fill="#4a2d12" fontSize="22" fontWeight="700"
                                fontFamily='"Trebuchet MS", sans-serif'
                            >
                                {won ? `x${PAYOUT_MULT}` : 'x0'}
                            </text>
                        </g>

                        {/* 4th place loiters on the grass — no podium for you. */}
                        {fourth && <PodiumBird racer={fourth} x={418} y={FLOOR} flip />}

                        <Block place={2} />
                        <Block place={3} />
                        <Block place={1} />

                        {second && <PodiumBird racer={second} x={BLOCKS[2].cx - 6} y={BLOCKS[2].top + 1} />}
                        {third && <PodiumBird racer={third} x={BLOCKS[3].cx + 6} y={BLOCKS[3].top + 1} flip />}
                        <PodiumBird racer={first} x={BLOCKS[1].cx - 8} y={BLOCKS[1].top + 1} cheer />

                        {/* Foreground leaves, bottom corners */}
                        <g fill="#2f6b16">
                            <path d="M0,380 Q22,340 8,318 Q44,332 46,380 Z" />
                            <path d="M28,380 Q58,346 52,314 Q84,344 78,380 Z" />
                            <path d="M460,380 Q438,338 452,316 Q416,330 414,380 Z" />
                            <path d="M432,380 Q402,344 408,312 Q376,342 382,380 Z" />
                        </g>
                        <g fill="#3d8a1e">
                            <path d="M12,380 Q34,348 24,326 Q52,342 50,380 Z" />
                            <path d="M448,380 Q426,346 436,324 Q408,340 410,380 Z" />
                        </g>
                    </svg>
                </div>

                <div className="rm-foot">
                    {won ? (
                        <div className="rm-congrats">
                            <span className="rm-conf c1" /><span className="rm-conf c2" /><span className="rm-conf c3" />
                            <span className="rm-conf c4" /><span className="rm-conf c5" /><span className="rm-conf c6" />
                            <span className="rm-congrats-text">Congratulations!</span>
                        </div>
                    ) : (
                        <div className="rm-quiet" style={{ color: paletteFor(first).body }}>
                            {first.name} took it
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultModal;