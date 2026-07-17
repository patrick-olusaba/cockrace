import React from 'react';
import { ChickenData, GamePhase } from '../types';
import { BET_STEP, MAX_BET, MIN_BET, PRESET_BETS } from '../game/constants';

interface GameUIProps {
  balance: number;
  betAmount: number;
  selectedChicken: number | null;
  phase: GamePhase;
  countdown: number;
  chickens: ChickenData[];
  resultMessage: string;
  onBetChange: (amount: number) => void;
  onSelectChicken: (id: number) => void;
  onRandomChoice: () => void;
  onStartRace: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
                                         balance, betAmount, selectedChicken, phase, countdown,
                                         chickens, resultMessage,
                                         onBetChange, onSelectChicken, onRandomChoice, onStartRace,
                                       }) => {
  const canBet = phase === 'betting' || phase === 'result';
  const canStart = phase === 'betting' && selectedChicken !== null;
  const pickedChicken = selectedChicken !== null ? chickens.find(c => c.id === selectedChicken) : null;

  return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          {/* ─── Header ─── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '64px', padding: '0 16px',
            background: 'linear-gradient(180deg, #1a0a00 0%, #2d1200 100%)',
            borderBottom: '3px solid #6b3a10', pointerEvents: 'auto',
          }}>
            <div style={logoStyle}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>COCK</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffd700', lineHeight: 1, letterSpacing: '2px' }}>4CAST</span>
            </div>
            <div style={signBoardStyle}>
              <span style={{ fontSize: '14px', color: '#4a2c00', fontWeight: 700 }}>Balance: </span>
              <span style={{ fontSize: '18px', color: '#fff8e0', fontWeight: 900 }}>
              {balance.toLocaleString()} $
            </span>
            </div>
            <div style={{ width: '62px' }} />
          </div>

          {/* ─── Countdown overlay ─── */}
          {phase === 'countdown' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)', zIndex: 100,
              }}>
                <div style={{
                  fontSize: '120px', fontWeight: 900, color: '#ffd700',
                  textShadow: '0 0 30px rgba(255,200,0,0.9), 0 4px 10px rgba(0,0,0,0.8), 4px 4px 0 #a06000',
                  animation: 'countdownPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                }} key={countdown}>
                  {countdown}
                </div>
              </div>
          )}

          {/* The result announcement lives in ResultModal now. This used to be a
            second copy of it at zIndex 100, which painted straight over the
            podium regardless of DOM order. */}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* ─── Bet Panel ─── */}
          <div style={{
            background: 'linear-gradient(180deg, #2d5a1b 0%, #1a3a0d 100%)',
            borderTop: '3px solid #1a3a0d', pointerEvents: 'auto',
          }}>
            <div style={{
              height: '10px',
              background: 'repeating-linear-gradient(90deg, #3a7a20 0px, #3a7a20 4px, #2d6618 4px, #2d6618 8px)',
              borderTop: '2px solid #4a9428',
            }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px', flexWrap: 'nowrap',
            }}>
              {/* Lane selector — each button wears its racer's colour */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: '#a8d888', fontWeight: 700, textTransform: 'uppercase' }}>
                Your pick:
              </span>
                {chickens.map((c) => (
                    <button key={c.id} onClick={() => canBet && onSelectChicken(c.id)} disabled={!canBet}
                            aria-label={`Pick ${c.name}, lane ${c.id}`}
                            aria-pressed={selectedChicken === c.id}
                            title={`${c.name} — ${c.tagline}`}
                            style={laneBtnStyle(c.bodyColor, selectedChicken === c.id, canBet)}>{c.id}</button>
                ))}
              </div>

              {/* Who you picked */}
              <div style={{ width: '132px', flexShrink: 0 }}>
                {pickedChicken ? (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: pickedChicken.bodyColor, lineHeight: 1.2 }}>
                        {pickedChicken.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#a8d888', fontStyle: 'italic' }}>
                        {pickedChicken.tagline}
                      </div>
                    </>
                ) : (
                    <div style={{ fontSize: '12px', color: 'rgba(168,216,136,0.5)' }}>No bird picked</div>
                )}
              </div>

              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

              {/* Bet controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => canBet && onBetChange(MIN_BET)} disabled={!canBet}
                        style={miniBtnStyle}>MIN</button>
                <button onClick={() => canBet && betAmount > MIN_BET && onBetChange(Math.max(MIN_BET, betAmount - BET_STEP))}
                        disabled={!canBet || betAmount <= MIN_BET} style={stepperStyle}>−</button>
                <div style={betBoxStyle}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffd700' }}>{betAmount.toLocaleString()}</span>
                  <span style={{ fontSize: '13px', color: '#a8d888', fontWeight: 700 }}>$</span>
                </div>
                <button onClick={() => canBet && betAmount < MAX_BET && onBetChange(Math.min(MAX_BET, betAmount + BET_STEP))}
                        disabled={!canBet || betAmount >= MAX_BET} style={stepperStyle}>+</button>
                <button onClick={() => canBet && onBetChange(MAX_BET)} disabled={!canBet}
                        style={miniBtnStyle}>MAX</button>
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {PRESET_BETS.map((p) => (
                    <button key={p} onClick={() => canBet && onBetChange(p)} disabled={!canBet}
                            style={presetStyle(betAmount === p, canBet)}>{p}</button>
                ))}
              </div>

              {/* Result message */}
              {phase === 'result' && resultMessage && (
                  <div style={{
                    fontSize: '16px', fontWeight: 900, padding: '8px 16px', borderRadius: '8px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    color: resultMessage.includes('Win') ? '#7fff50' : '#ff6060',
                    background: resultMessage.includes('Win') ? 'rgba(0,80,0,0.4)' : 'rgba(80,0,0,0.4)',
                    border: `1px solid ${resultMessage.includes('Win') ? 'rgba(100,255,50,0.3)' : 'rgba(255,80,80,0.3)'}`,
                  }}>
                    {resultMessage}
                  </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
                {canStart && (
                    <button onClick={onStartRace} style={startBtnStyle}>🏁 START RACE</button>
                )}
                <button onClick={onRandomChoice} disabled={!canBet}
                        style={randomBtnStyle(canBet)}>🎲 RANDOM CHOICE</button>
              </div>
            </div>
          </div>
        </div>

        {/* CSS animations injected once */}
        <style>{`
        @keyframes countdownPop {
          0%   { transform: scale(0.4); opacity: 0; }
          40%  { transform: scale(1.3); opacity: 1; }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes resultBounce {
          0%   { transform: translateY(-40px) scale(0.7); opacity: 0; }
          60%  { transform: translateY(8px) scale(1.05); opacity: 1; }
          80%  { transform: translateY(-4px) scale(0.98); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
      </div>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const logoStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: 'radial-gradient(circle at 50% 40%, #cc0000, #880000)',
  border: '3px solid #fff', borderRadius: '50%',
  width: '62px', height: '62px', justifyContent: 'center',
  boxShadow: '0 0 0 2px #cc0000, 0 4px 12px rgba(0,0,0,0.6)',
};
const signBoardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #c49a28 0%, #a07820 40%, #8B6914 100%)',
  border: '3px solid #6b4e10', borderRadius: '6px', padding: '8px 24px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
};
const miniBtnStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer',
  fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.4)',
  fontSize: '10px', padding: '6px 8px', letterSpacing: '0.5px',
};
const stepperStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer',
  fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.4)',
  fontSize: '20px', width: '34px', height: '34px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const betBoxStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.25)',
  borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center',
  gap: '4px', minWidth: '90px', justifyContent: 'center',
};
const startBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a8c1a 0%, #0f6010 100%)',
  border: '2px solid #4ac84a', borderRadius: '10px', color: '#fff',
  fontSize: '14px', fontWeight: 900, padding: '10px 20px', cursor: 'pointer',
  letterSpacing: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
};
const randomBtnStyle = (canBet: boolean): React.CSSProperties => ({
  background: 'linear-gradient(135deg, #e8c000 0%, #b89000 100%)',
  border: '2px solid #ffd700', borderRadius: '10px', color: '#2a1a00',
  fontSize: '14px', fontWeight: 900, padding: '10px 20px',
  cursor: canBet ? 'pointer' : 'not-allowed', opacity: canBet ? 1 : 0.5,
  boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px #a07800',
});
// The button IS the bird: same colour, same number as the silk on its back.
const laneBtnStyle = (birdColor: string, active: boolean, canBet: boolean): React.CSSProperties => ({
  width: '38px', height: '38px', borderRadius: '8px',
  border: `2px solid ${active ? '#fff' : 'rgba(0,0,0,0.35)'}`,
  background: birdColor,
  color: '#fff', fontSize: '18px', fontWeight: 900,
  textShadow: '0 1px 2px rgba(0,0,0,0.55)',
  cursor: canBet ? 'pointer' : 'not-allowed',
  opacity: canBet ? (active ? 1 : 0.72) : 0.4,
  transform: active ? 'translateY(-2px)' : 'none',
  boxShadow: active ? `0 0 0 2px ${birdColor}, 0 4px 14px rgba(0,0,0,0.5)` : 'inset 0 -2px 0 rgba(0,0,0,0.25)',
  transition: 'transform 0.12s ease, opacity 0.12s ease',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});
const presetStyle = (active: boolean, canBet: boolean): React.CSSProperties => ({
  background: active ? '#4a9e28' : 'rgba(60,130,40,0.7)',
  border: `2px solid ${active ? '#a8d888' : 'rgba(255,255,255,0.2)'}`,
  borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: 700,
  padding: '6px 14px', cursor: canBet ? 'pointer' : 'not-allowed',
  opacity: canBet ? 1 : 0.4,
  boxShadow: active ? '0 0 10px rgba(100,200,60,0.5)' : 'none',
});

export default GameUI;