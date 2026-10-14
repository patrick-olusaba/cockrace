import React from 'react';
import { ChickenData, GamePhase } from '../types';
import { BET_STEP, MAX_BET, MIN_BET, PRESET_BETS } from '../game/constants';
import { CURRENCY } from '../game/money';
import './BetPanel.css';

// The controls used to live inside the stage overlay: one nowrap flex row,
// every child flexShrink: 0, inside a container with overflow: hidden. That
// needs 1325px. On a 390px phone 71% of it was clipped — and START RACE sits
// at the far right, so it was the first thing to disappear. The game was
// literally unplayable on a phone.
//
// So the panel now lives in normal document flow BELOW the stage, and it
// wraps. Flow layout means it always reserves its own height, and wrapping
// means nothing can ever be pushed out of reach. The stage takes what's left.
//
// Layout is CSS-driven (BetPanel.css) rather than inline, because the whole
// point is media queries — which inline styles can't express. The only inline
// styles left are the racer colours, which come from racers.ts at runtime.

interface BetPanelProps {
  betAmount: number;
  selectedChicken: number | null;
  phase: GamePhase;
  chickens: ChickenData[];
  resultMessage: string;
  onBetChange: (amount: number) => void;
  onSelectChicken: (id: number) => void;
  onRandomChoice: () => void;
  onStartRace: () => void;
}

const BetPanel: React.FC<BetPanelProps> = ({
  betAmount, selectedChicken, phase, chickens, resultMessage,
  onBetChange, onSelectChicken, onRandomChoice, onStartRace,
}) => {
  const canBet = phase === 'betting' || phase === 'result';
  const canStart = phase === 'betting' && selectedChicken !== null;
  const picked = selectedChicken !== null ? chickens.find((c) => c.id === selectedChicken) : null;

  return (
    <div className="bet-panel">
      <div className="bp-strip" />

      <div className="bp-rows">
        {/* Row 1 — picking a bird is the primary action, so it leads. */}
        <div className="bp-row bp-row-pick">
          <span className="bp-label">Your pick</span>
          <div className="bp-lanes">
            {chickens.map((c) => (
              <button
                key={c.id}
                className={`bp-lane${selectedChicken === c.id ? ' is-on' : ''}`}
                style={{ background: c.bodyColor, boxShadow: selectedChicken === c.id ? `0 0 0 2px ${c.bodyColor}, 0 4px 14px rgba(0,0,0,0.5)` : undefined }}
                onClick={() => canBet && onSelectChicken(c.id)}
                disabled={!canBet}
                aria-label={`Pick ${c.name}, lane ${c.id}`}
                aria-pressed={selectedChicken === c.id}
                title={`${c.name} — ${c.tagline}`}
              >
                {c.id}
              </button>
            ))}
          </div>
          {/* Redundant on a phone — the chosen lane button is already lit. */}
          <div className="bp-picked">
            {picked ? (
              <>
                <div className="bp-picked-name" style={{ color: picked.bodyColor }}>{picked.name}</div>
                <div className="bp-picked-tag">{picked.tagline}</div>
              </>
            ) : (
              <div className="bp-picked-none">No bird picked</div>
            )}
          </div>
        </div>

        {/* Row 2 — stake. */}
        <div className="bp-row bp-row-bet">
          <div className="bp-stepper">
            <button className="bp-mini" onClick={() => canBet && onBetChange(MIN_BET)} disabled={!canBet}>MIN</button>
            <button
              className="bp-step"
              onClick={() => canBet && betAmount > MIN_BET && onBetChange(Math.max(MIN_BET, betAmount - BET_STEP))}
              disabled={!canBet || betAmount <= MIN_BET}
              aria-label="Decrease bet"
            >−</button>
            <div className="bp-amount">
              <span className="bp-amount-c">{CURRENCY}</span>
              <span className="bp-amount-n">{betAmount.toLocaleString('en-KE')}</span>
            </div>
            <button
              className="bp-step"
              onClick={() => canBet && betAmount < MAX_BET && onBetChange(Math.min(MAX_BET, betAmount + BET_STEP))}
              disabled={!canBet || betAmount >= MAX_BET}
              aria-label="Increase bet"
            >+</button>
            <button className="bp-mini" onClick={() => canBet && onBetChange(MAX_BET)} disabled={!canBet}>MAX</button>
          </div>

          <div className="bp-presets">
            {PRESET_BETS.map((p) => (
              <button
                key={p}
                className={`bp-preset${betAmount === p ? ' is-on' : ''}`}
                onClick={() => canBet && onBetChange(p)}
                disabled={!canBet}
              >{p}</button>
            ))}
          </div>
        </div>

        {/* Row 3 — actions. Full width on a phone so they're always thumb-sized. */}
        <div className="bp-row bp-row-go">
          {phase === 'result' && resultMessage && (
            <div className={`bp-result${resultMessage.includes('Win') ? ' is-win' : ' is-loss'}`}>
              {resultMessage}
            </div>
          )}
          <div className="bp-actions">
            <button className="bp-random" onClick={onRandomChoice} disabled={!canBet}>🎲 Random</button>
            <button className="bp-start" onClick={onStartRace} disabled={!canStart}>🏁 Start race</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetPanel;
