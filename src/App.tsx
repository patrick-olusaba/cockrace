import React, { useCallback, useEffect, useRef, useState } from 'react';
import Stage from './components/Stage';
import GameUI from './components/GameUI';
import ResultModal from './components/ResultModal';
import { RACERS } from './racers';
import { GamePhase } from './types';
import { PAYOUT_MULT } from './game/constants';
import './App.css';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [selectedChicken, setSelected] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [balance, setBalance] = useState(10_000_000);
  /** Racer ids, winner first. Non-null only once a race has been decided. */
  const [order, setOrder] = useState<number[] | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [resultMessage, setResultMsg] = useState('');

  // Handlers read these without needing to be re-created.
  const pickRef = useRef(selectedChicken);
  const betRef = useRef(betAmount);
  useEffect(() => { pickRef.current = selectedChicken; }, [selectedChicken]);
  useEffect(() => { betRef.current = betAmount; }, [betAmount]);

  // Timers are tracked so a unmount mid-countdown doesn't leave them running.
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    let n = 3;
    const iv = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(iv);
        setPhase('racing');
      } else {
        setCountdown(n);
      }
    }, 1000);
    timers.current.push(iv);
  }, []);

  const handleSelectChicken = (id: number) => {
    if (phase !== 'betting' && phase !== 'result') return;
    setSelected(id);
  };

  const handleRandomChoice = () => {
    if (phase !== 'betting' && phase !== 'result') return;
    setSelected(RACERS[Math.floor(Math.random() * RACERS.length)].id);
  };

  const handleStartRace = () => {
    if (phase !== 'betting') return;
    setBalance((b) => b - betAmount);
    setOrder(null);
    setResultMsg('');
    startCountdown();
  };

  // Called by Stage the frame the first bird crosses the line, with the full
  // finishing order — the podium needs 2nd and 3rd.
  const handleFinish = useCallback((finishOrder: number[]) => {
    setOrder(finishOrder);
    setPhase('result');

    const bet = betRef.current;
    const winnerId = finishOrder[0];
    if (pickRef.current !== null) {
      if (pickRef.current === winnerId) {
        // Stake was taken at start, so a 3.5x payout nets 2.5x profit.
        setBalance((b) => b + Math.floor(bet * PAYOUT_MULT));
        setResultMsg(`You win! +${Math.floor(bet * (PAYOUT_MULT - 1)).toLocaleString()} $`);
      } else {
        setResultMsg(`You lose. -${bet.toLocaleString()} $`);
      }
    }
    // No auto-dismiss any more: the modal owns the wait, the player closes it.
  }, []);

  const handleCloseResult = useCallback(() => {
    setOrder(null);
    setResultMsg('');
    setPhase('betting');
  }, []);

  return (
      <div className="app-root">
        <div className="stage-wrap">
          <Stage phase={phase} onFinish={handleFinish} />
          <GameUI
              balance={balance}
              betAmount={betAmount}
              selectedChicken={selectedChicken}
              phase={phase}
              countdown={countdown}
              chickens={RACERS}
              resultMessage={resultMessage}
              onBetChange={setBetAmount}
              onSelectChicken={handleSelectChicken}
              onRandomChoice={handleRandomChoice}
              onStartRace={handleStartRace}
          />
          {order && (
              <ResultModal
                  order={order}
                  picked={selectedChicken}
                  betAmount={betAmount}
                  onClose={handleCloseResult}
              />
          )}
        </div>
      </div>
  );
};

export default App;