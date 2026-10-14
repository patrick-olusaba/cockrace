import React, { useEffect, useRef } from 'react';
import { RACERS } from '../racers';
import { GamePhase } from '../types';
import {
  BIRD_SCALE, CAM_EASE, CROWD_BOB, FINISH_X, INTRO_BOX, INTRO_MS,
  JITTER, LANE_Y, PARALLAX, REF_SPEED, STAGE_H, STAGE_W, SURGE, TILE_W,
  VIEW_W_MAX, VIEW_W_MIN,
} from '../game/constants';
import { bodyBob, bodyLean, bodySurge, footAngle, headThrust, legPose, strideHz } from '../game/gait';
import { BirdRig, LegRig, Runner, emptyRig, makeRunners, resetRunners } from '../game/rig';
import { BUILDS } from '../racers';
import Bird from './Bird';
import { BackdropDefs, BackdropRig, Foreground, GroundLayers, SkyLayers, emptyBackdropRig } from './Backdrop';
import { LaneLines, TrackMarks } from './TrackLayer';
import './Stage.css';

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
  const svgEl = useRef<SVGSVGElement | null>(null);
  /** 0 = tight on the stand, 1 = race framing. Advances during countdown. */
  const intro = useRef(1);
  /** viewBox width for the current container aspect. Height is always STAGE_H,
   *  so all four lanes are on screen whatever the device. */
  const viewW = useRef(STAGE_W);

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
      intro.current = 0; // kick off the pan down to the track
    }
  }, [phase]);

  // The viewBox width tracks the container's aspect. A ResizeObserver rather
  // than a resize listener, because the stage can change size without the
  // window doing so — a rotated phone, a split view, a CSS change.
  useEffect(() => {
    const el = svgEl.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || STAGE_W;
      const h = el.clientHeight || STAGE_H;
      viewW.current = Math.max(VIEW_W_MIN, Math.min(VIEW_W_MAX, STAGE_H * (w / h)));
      if (intro.current >= 1) {
        el.setAttribute('viewBox', `0 0 ${viewW.current.toFixed(1)} ${STAGE_H}`);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const setPattern = (el: SVGPatternElement | null, offset: number, tile: number, y = 0) => {
      if (!el) return;
      // Modulo the tile width: the seam is invisible and the float stays small
      // however long the race runs.
      el.setAttribute(
        'patternTransform',
        `translate(${(offset % tile).toFixed(2)},${y.toFixed(2)})`,
      );
    };

    // Smoothstep. The camera should arrive, not bounce — no overshoot.
    const ease = (t: number) => t * t * (3 - 2 * t);

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

      // ─── Camera: frame the field ─────────────────────────────────────────
      // Holding the leader at a fixed fraction works until the view narrows.
      // A phone shows 420 units, not 800, and the pack spreads up to 387 by the
      // finish — so a leader-locked camera drops the back marker in ~46% of
      // races. A race camera follows the field: centre the pack, bias forward.
      let lead = us[0];
      let tail = us[0];
      for (const u of us) {
        if (u.x > lead.x) lead = u;
        if (u.x < tail.x) tail = u;
      }
      // Pack centred exactly. Biasing forward (0.38, 0.44) still dropped the
      // leader off the right in 9% / 0.1% of races at viewW 420; dead centre is
      // 0.0% on every device. The leader drifts right naturally as the field
      // strings out, which reads as a chase anyway.
      const vw = viewW.current;
      const mid = (lead.x + tail.x) / 2;
      const want = Math.max(0, Math.min(mid - vw * 0.5, FINISH_X - vw * 0.5));
      cam.current += (want - cam.current) * Math.min(1, dt * CAM_EASE);
      const c = cam.current;

      // ─── Parallax ────────────────────────────────────────────────────────
      const b = backdrop.current;
      setPattern(b.clouds, -c * PARALLAX.clouds, TILE_W.clouds);
      setPattern(b.mountains, -c * PARALLAX.mountains, TILE_W.mountains);
      setPattern(b.far, -c * PARALLAX.far, TILE_W.far);
      setPattern(b.treeline, -c * PARALLAX.treeline, TILE_W.treeline);
      setPattern(b.hills, -c * PARALLAX.hills, TILE_W.hills);

      // Stand and crowd share an x-rate; only the bob differs, or the
      // spectators would drift off their seats.
      const sx = -c * PARALLAX.stand;
      const t = now / 1000;
      setPattern(b.stand, sx, TILE_W.stand);
      setPattern(b.crowdB, sx, TILE_W.crowdB,
        Math.sin(t * CROWD_BOB[0].hz + CROWD_BOB[0].phase) * CROWD_BOB[0].amp);
      setPattern(b.crowdC, sx, TILE_W.crowdC,
        Math.sin(t * CROWD_BOB[1].hz + CROWD_BOB[1].phase) * CROWD_BOB[1].amp);

      setPattern(b.fence, -c * PARALLAX.fence, TILE_W.fence);
      setPattern(b.grass, -c * PARALLAX.grass, TILE_W.grass);
      setPattern(b.dirt, -c * PARALLAX.dirt, TILE_W.dirt);
      const fx = -c * PARALLAX.grassFg;
      setPattern(b.grassFg, fx, TILE_W.grassFg);
      setPattern(b.turf, fx, TILE_W.turf);
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
        const surge = u.done ? 0 : bodySurge(u.cycle, spd);
        rig.body?.setAttribute(
          'transform',
          `translate(${surge.toFixed(1)},${(-bob).toFixed(1)}) rotate(${lean.toFixed(1)} 0 -100) scale(${bd.bx},${bd.by})`,
        );

        // Head stabilisation: cancel most of the body's bob and pitch so the
        // head holds still in space. This is the single thing that makes it
        // read as a chicken rather than a bouncing toy. headThrust does the
        // same job fore-aft — and it also has to undo `surge`, or the body's
        // lurch would drag the head along with it.
        const hx = (u.done ? 0 : headThrust(u.cycle, spd)) - surge;
        rig.head?.setAttribute(
          'transform',
          `translate(${hx.toFixed(1)},${(bob * 0.92).toFixed(1)}) rotate(${(-lean * 0.85).toFixed(1)} 66 -182)`,
        );

        // Tail and wing pump on the same push-off beat as the bob, not on a
        // free-running sine — a tail that flicks off-beat reads as wind, not
        // effort. Wing amplitude scales with speed; a walking bird holds it in.
        rig.tail?.setAttribute(
          'transform',
          `translate(-46,-124) rotate(${(bob * -0.9).toFixed(1)})`,
        );
        rig.wing?.setAttribute(
          'transform',
          `translate(-4,-108) rotate(${(bob * (0.5 + spd * 0.9)).toFixed(1)})`,
        );
        // Shadow shrinks AND fades as the bird lifts. Constant opacity is what
        // makes a jump look like a slide.
        rig.shadow?.setAttribute('rx', (46 - bob * 1.4).toFixed(1));
        rig.shadow?.setAttribute('opacity', (1 - bob * 0.055).toFixed(2));
      }

      // ─── Opening camera: stand -> track ────────────────────────────────
      // Driven here, not from React state — a viewBox lerp through setState
      // would re-render the whole tree 60x/sec.
      if (intro.current < 1) {
        intro.current = Math.min(1, intro.current + (dt * 1000) / INTRO_MS);
        const k = ease(intro.current);
        const vx = INTRO_BOX.x * (1 - k);
        const vy = INTRO_BOX.y * (1 - k);
        const bw = INTRO_BOX.w + (viewW.current - INTRO_BOX.w) * k;
        const bh = INTRO_BOX.h + (STAGE_H - INTRO_BOX.h) * k;
        svgEl.current?.setAttribute(
          'viewBox',
          `${vx.toFixed(1)} ${vy.toFixed(1)} ${bw.toFixed(1)} ${bh.toFixed(1)}`,
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      ref={svgEl}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="race-canvas"
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
