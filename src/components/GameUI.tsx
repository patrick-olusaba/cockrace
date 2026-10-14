import React from 'react';
import { ChickenData, GamePhase } from '../types';
import { money } from '../game/money';
import './GameUI.css';

interface GameUIProps {
  balance: number;
  selectedChicken: number | null;
  phase: GamePhase;
  countdown: number;
  chickens: ChickenData[];
}

const GameUI: React.FC<GameUIProps> = ({
  balance, selectedChicken, phase, countdown, chickens,
}) => {
  const pickedChicken = selectedChicken !== null ? chickens.find(c => c.id === selectedChicken) : null;

  return (
    <div className="hud-root">
      <div className="hud-stack">
        {/* ─── Header ─── */}
        {/* Logo removed. The bar is an overlay, so every pixel it takes is a
            pixel of track hidden — hence the phone rules in GameUI.css. */}
        <div className="hud-bar">
          <div className="hud-balance">
            <span className="hud-balance-label">Balance</span>
            <span className="hud-balance-value">{money(balance)}</span>
          </div>
        </div>

        {/* ─── Countdown overlay ─── */}
        {phase === 'countdown' && (
          <div className="hud-countdown">
            <div className="hud-countdown-n" key={countdown}>{countdown}</div>
          </div>
        )}

        {/* The result announcement lives in ResultModal now. This used to be a
            second copy of it at zIndex 100, which painted straight over the
            podium regardless of DOM order. */}

        <div className="hud-spacer" />

      </div>

    </div>
  );
};

export default GameUI;
