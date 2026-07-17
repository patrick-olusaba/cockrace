import React, { useEffect, useRef } from 'react';
import { RACERS } from '../racers';
import { GamePhase } from '../types';
import {
    BIRD_SCALE, CAM_EASE, CAM_LEAD, FINISH_X, JITTER, LANE_Y,
    PARALLAX, REF_SPEED, STAGE_H, STAGE_W, SURGE, TILE_W,
} from '../game/constants';
import { bodyBob, bodyLean, footAngle, legPose, strideHz } from '../game/gait';
import { BirdRig, LegRig, Runner, emptyRig, makeRunners, resetRunners } from '../game/rig';
import { BUILDS } from '../racers';
import Bird from './Bird';
import { BackdropDefs, BackdropRig, Foreground, GroundLayers, SkyLayers, emptyBackdropRig } from './Backdrop';
import { LaneLines, TrackMarks } from './TrackLayer';

interface StageProps {
    phase: GamePhase;
    /**
     * Fired once, the frame the first bird crosses. Reports the full finishing
     * order (racer ids, winner first) — the podium needs 2nd and 3rd, and they
     * never cross the line themselves: physics stops the moment the phase leaves
     * 'racing'. So the placings are taken from track position at the instant the
     * winner crosses, which is also exactly what the player just watched.
     */
    onFinish: (order: number[]) => void;
}

const Stage: React.FC<StageProps> = ({ phase, onFinish }) => {
    const backdrop = useRef<BackdropRig>(emptyBackdropRig());
    const rigs = useRef<BirdRig[]>(RACERS.map(() => emptyRig()));
    const trackG = useRef<SVGGElement | null>(null);

    const runners = useRef<Runner[]>(makeRunners(RACERS));
    const cam = useRef(0);
    const settled = useRef(false);

    // The loop mounts once and reads these, rather than re-subscribing per render.
    const phaseRef = useRef(phase);
    const finishRef = useRef(onFinish);
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { finishRef.current = onFinish; }, [onFinish]);

    // Fresh legs and camera whenever a new race starts.
    useEffect(() => {
        if (phase === 'countdown') {
            resetRunners(runners.current);
            cam.current = 0;
            settled.current = false;
        }
    }, [phase]);

    useEffect(() => {
        let raf = 0;
        let last = performance.now();

        const setPattern = (el: SVGPatternElement | null, offset: number, tile: number) => {
            if (!el) return;
            // Modulo the tile width: the seam is invisible and the float stays small
            // however long the race runs.
            el.setAttribute('patternTransform', `translate(${(offset % tile).toFixed(2)},0)`);
        };

        const setLeg = (leg: LegRig, ox: number, hip: number, knee: number) => {
            leg.hip?.setAttribute('transform', `translate(${ox},-76) rotate(${hip.toFixed(1)})`);
            leg.knee?.setAttribute('transform', `translate(0,30) rotate(${knee.toFixed(1)})`);
            leg.foot?.setAttribute('transform', `translate(0,36) rotate(${footAngle({ hip, knee }).toFixed(1)})`);
        };

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const us = runners.current;
            const racing = phaseRef.current === 'racing';

            // ─── Physics ─────────────────────────────────────────────────────────
            if (racing) {
                let crossed = false;
                for (const u of us) {
                    if (u.done) continue;
                    u.v = u.base + Math.sin(now / 1000 * 1.3 + u.seed) * SURGE + Math.random() * JITTER;
                    u.x += u.v * dt;
                    if (u.x >= FINISH_X) {
                        u.x = FINISH_X;
                        u.done = true;
                        crossed = true;
                    }
                }
                if (crossed && !settled.current) {
                    settled.current = true;
                    const order = [...us].sort((a, b) => b.x - a.x).map((u) => u.id);
                    finishRef.current(order);
                }
            }

            // ─── Camera: follow the leader, hold them ~62% across ─────────────────
            let lead = us[0];
            for (const u of us) if (u.x > lead.x) lead = u;
            const want = Math.max(0, Math.min(lead.x - STAGE_W * CAM_LEAD, FINISH_X - STAGE_W * 0.42));
            cam.current += (want - cam.current) * Math.min(1, dt * CAM_EASE);
            const c = cam.current;

            // ─── Parallax ────────────────────────────────────────────────────────
            const b = backdrop.current;
            setPattern(b.clouds, -c * PARALLAX.clouds, TILE_W.clouds);
            setPattern(b.mountains, -c * PARALLAX.mountains, TILE_W.mountains);
            setPattern(b.far, -c * PARALLAX.far, TILE_W.far);
            setPattern(b.treeline, -c * PARALLAX.treeline, TILE_W.treeline);
            setPattern(b.hills, -c * PARALLAX.hills, TILE_W.hills);
            setPattern(b.fence, -c * PARALLAX.fence, TILE_W.fence);
            setPattern(b.grass, -c * PARALLAX.grass, TILE_W.grass);
            setPattern(b.dirt, -c * PARALLAX.dirt, TILE_W.dirt);
            setPattern(b.grassFg, -c * PARALLAX.grassFg, TILE_W.grassFg);
            trackG.current?.setAttribute('transform', `translate(${(-c).toFixed(1)},0)`);

            // ─── Birds ───────────────────────────────────────────────────────────
            for (let i = 0; i < us.length; i++) {
                const u = us[i];
                const rig = rigs.current[i];
                if (!rig.root) continue;

                const spd = u.done ? 0 : u.v / REF_SPEED;
                u.cycle += dt * strideHz(spd);

                const near = legPose(u.cycle);
                const far = legPose(u.cycle + 0.5);
                setLeg(rig.legNear, 6, near.hip, near.knee);
                setLeg(rig.legFar, -8, far.hip, far.knee);

                // A finished bird hops on the spot instead of freezing mid-stride.
                const bob = u.done
                    ? Math.abs(Math.sin(now / 1000 * 6)) * 3
                    : bodyBob(u.cycle, spd);
                const lean = u.done ? -4 : bodyLean(spd);

                rig.root.setAttribute(
                    'transform',
                    `translate(${(u.x - c).toFixed(1)},${LANE_Y[u.lane]}) scale(${BIRD_SCALE})`,
                );

                const bd = BUILDS[RACERS[i].build];
                rig.body?.setAttribute(
                    'transform',
                    `translate(0,${(-bob).toFixed(1)}) rotate(${lean.toFixed(1)} 0 -100) scale(${bd.bx},${bd.by})`,
                );

                // Head stabilisation: cancel most of the body's bob and pitch so the
                // head holds still in space. This is the single thing that makes it
                // read as a chicken rather than a bouncing toy.
                const hx = Math.sin(u.cycle * Math.PI * 2) * (1 + spd * 2.2);
                rig.head?.setAttribute(
                    'transform',
                    `translate(${hx.toFixed(1)},${(bob * 0.92).toFixed(1)}) rotate(${(-lean * 0.85).toFixed(1)} 66 -182)`,
                );

                rig.tail?.setAttribute(
                    'transform',
                    `translate(-46,-124) rotate(${(Math.sin(u.cycle * Math.PI * 2 + 1) * 3).toFixed(1)})`,
                );
                rig.wing?.setAttribute(
                    'transform',
                    `translate(-4,-108) rotate(${(Math.sin(u.cycle * Math.PI * 2) * 4).toFixed(1)})`,
                );
                rig.shadow?.setAttribute('rx', (46 - bob * 0.8).toFixed(1));
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <svg
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            preserveAspectRatio="xMidYMid slice"
            style={{ display: 'block', width: '100%', height: '100%' }}
            aria-label="Chicken race track"
        >
            <BackdropDefs rig={backdrop.current} />
            <SkyLayers />
            <GroundLayers />
            <LaneLines />
            <TrackMarks groupRef={(el) => { trackG.current = el; }} />
            <g>
                {RACERS.map((r, i) => <Bird key={r.id} racer={r} rig={rigs.current[i]} />)}
            </g>
            <Foreground />
        </svg>
    );
};

export default Stage;