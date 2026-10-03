import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TOTAL_TRIALS = 5;

export default function ReactionFocusGame({
  difficulty = 'easy',
  onBack,
  onProgressUpdate
}) {
  const {
    status,
    timer,
    score,
    moves,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    incrementMoves,
    incrementScore,
    finishGame
  } = useGameEngine({
    gameType: 'reaction-focus',
    difficulty
  });

  // 'waiting' | 'ready' | 'too-early' | 'recorded'
  const [stage, setStage] = useState('waiting');
  const [trial, setTrial] = useState(1);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [lastMs, setLastMs] = useState(null);

  const startTimeRef = useRef(null);
  const timerTimeoutRef = useRef(null);

  const startTrial = useCallback(() => {
    setStage('waiting');
    setLastMs(null);

    // Random delay between 1500ms and 4500ms
    const delay = 1500 + Math.floor(Math.random() * 3000);
    timerTimeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setStage('ready');
    }, delay);
  }, []);

  const initGame = useCallback(() => {
    setTrial(1);
    setReactionTimes([]);
    setLastMs(null);
    startGame();
    startTrial();
  }, [startGame, startTrial]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, [initGame]);

  const handleBoxClick = () => {
    if (status !== 'playing') return;

    if (stage === 'waiting') {
      // Clicked too early
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      setStage('too-early');
      incrementMoves();
      setTimeout(() => {
        startTrial();
      }, 1500);
      return;
    }

    if (stage === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      incrementMoves();
      setLastMs(elapsed);
      setStage('recorded');

      const nextTimes = [...reactionTimes, elapsed];
      setReactionTimes(nextTimes);

      // Score: faster = higher points (e.g. 500 - elapsed)
      const trialScore = Math.max(10, 500 - elapsed);
      incrementScore(trialScore);

      const progressPct = Math.round((trial / TOTAL_TRIALS) * 100);
      if (onProgressUpdate) onProgressUpdate(progressPct);

      setTimeout(() => {
        if (trial >= TOTAL_TRIALS) {
          const avg = Math.round(nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length);
          finishGame({
            averageReactionMs: avg,
            fastestMs: Math.min(...nextTimes),
            trials: TOTAL_TRIALS
          });
        } else {
          setTrial(t => t + 1);
          startTrial();
        }
      }, 1200);
    }
  };

  const avgMs = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : '--';

  return (
    <GameContainer
      title="Reaction & Focus Practice"
      category="Focus Practice"
      instructions="Wait until the box turns GREEN, then click or tap as quickly as you can. Clicking while red counts as a false start."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Trial', value: `${trial}/${TOTAL_TRIALS}`, icon: '⟳' },
        { label: 'Avg Speed', value: `${avgMs} ms`, icon: '⚡' }
      ]}
      onPause={() => {
        if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
        pauseGame();
      }}
      onResume={() => {
        resumeGame();
        startTrial();
      }}
      onRestart={() => {
        if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
        restartGame();
        initGame();
      }}
      onBack={onBack}
    >
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Interactive Click Area */}
        <button
          type="button"
          onClick={handleBoxClick}
          disabled={status !== 'playing' || stage === 'recorded'}
          className={`w-full aspect-video rounded-3xl flex flex-col items-center justify-center p-6 transition-all duration-150 select-none shadow-md ${
            stage === 'waiting'
              ? 'bg-rose-600 text-white cursor-pointer active:scale-98'
              : stage === 'ready'
              ? 'bg-emerald-500 text-white cursor-pointer scale-102 ring-4 ring-emerald-300 animate-pulse'
              : stage === 'too-early'
              ? 'bg-amber-600 text-white'
              : 'bg-teal-700 text-white'
          }`}
          aria-label="Reaction target"
        >
          {stage === 'waiting' && (
            <div className="text-center">
              <div className="text-3xl font-extrabold mb-1 tracking-tight">Wait for Green...</div>
              <p className="text-xs text-rose-100">Do not click yet</p>
            </div>
          )}

          {stage === 'ready' && (
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-2 animate-bounce" />
              <div className="text-4xl font-black tracking-tight">CLICK NOW!</div>
            </div>
          )}

          {stage === 'too-early' && (
            <div className="text-center flex flex-col items-center">
              <AlertTriangle className="w-10 h-10 mb-2 text-amber-200" />
              <div className="text-2xl font-bold">Too Early!</div>
              <p className="text-xs text-amber-100 mt-1">Wait for green before clicking</p>
            </div>
          )}

          {stage === 'recorded' && (
            <div className="text-center flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 mb-1 text-emerald-200" />
              <div className="text-4xl font-mono font-black">{lastMs} ms</div>
              <p className="text-xs text-emerald-100 mt-1">Measured speed</p>
            </div>
          )}
        </button>

        {/* History of trials */}
        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: TOTAL_TRIALS }).map((_, i) => {
            const time = reactionTimes[i];
            return (
              <div
                key={i}
                className={`w-14 py-1.5 px-1 rounded-lg text-center text-xs font-mono font-medium border ${
                  time
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                }`}
              >
                {time ? `${time}ms` : `--`}
              </div>
            );
          })}
        </div>
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Reaction & Focus Completed"
        duration={timer}
        score={score}
        moves={moves}
        extraMetrics={[
          { label: 'Average Reaction Time', value: `${avgMs} ms` },
          { label: 'Fastest Trial', value: `${reactionTimes.length ? Math.min(...reactionTimes) : '--'} ms` }
        ]}
        onPlayAgain={() => {
          restartGame();
          initGame();
        }}
        onExit={onBack}
      />
    </GameContainer>
  );
}
