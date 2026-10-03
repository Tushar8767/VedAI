import React, { useState, useEffect, useCallback, useRef } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generateStroopTrial, STROOP_COLORS } from '../utils/stroopGenerator';
import { CheckCircle2, XCircle } from 'lucide-react';

const TOTAL_ROUNDS = 10;

export default function StroopGame({
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
    gameType: 'stroop-effect',
    difficulty
  });

  const [currentRound, setCurrentRound] = useState(1);
  const [trial, setTrial] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);

  const trialStartRef = useRef(null);

  const loadTrial = useCallback(() => {
    const nextTrial = generateStroopTrial();
    setTrial(nextTrial);
    setFeedback(null);
    trialStartRef.current = performance.now();
  }, []);

  const initGame = useCallback(() => {
    setCurrentRound(1);
    setCorrectCount(0);
    setReactionTimes([]);
    loadTrial();
    startGame();
  }, [loadTrial, startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSelectColor = (colorName) => {
    if (status !== 'playing' || feedback !== null || !trial) return;

    const reactionTime = Math.round(performance.now() - trialStartRef.current);
    incrementMoves();

    const isCorrect = colorName.toLowerCase() === trial.displayColorName.toLowerCase();

    if (isCorrect) {
      setFeedback('correct');
      incrementScore(15);
      setCorrectCount(c => c + 1);
    } else {
      setFeedback('wrong');
    }

    const nextReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(nextReactionTimes);

    const progressPct = Math.round((currentRound / TOTAL_ROUNDS) * 100);
    if (onProgressUpdate) onProgressUpdate(progressPct);

    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        const finalCorrect = correctCount + (isCorrect ? 1 : 0);
        const avgReaction = Math.round(nextReactionTimes.reduce((a, b) => a + b, 0) / nextReactionTimes.length);
        finishGame({
          accuracy: Math.round((finalCorrect / TOTAL_ROUNDS) * 100),
          averageReactionMs: avgReaction,
          roundsCompleted: TOTAL_ROUNDS
        });
      } else {
        setCurrentRound(r => r + 1);
        loadTrial();
      }
    }, 700);
  };

  if (!trial) return null;

  return (
    <GameContainer
      title="Stroop Inhibitory Focus"
      category="Focus Practice"
      instructions="Name the COLOR of the ink/font, NOT the word itself! For example, if the word RED is written in Blue ink, choose Blue."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Round', value: `${currentRound}/${TOTAL_ROUNDS}`, icon: '⟳' },
        { label: 'Score', value: `${correctCount}/${currentRound - 1 + (feedback ? 1 : 0)}`, icon: '✓' }
      ]}
      onPause={pauseGame}
      onResume={resumeGame}
      onRestart={() => {
        restartGame();
        initGame();
      }}
      onBack={onBack}
    >
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Stimulus Word */}
        <div className="h-32 flex items-center justify-center mb-8 w-full">
          <div
            className="text-5xl sm:text-6xl font-black tracking-wider uppercase transition-transform select-none drop-shadow-xs"
            style={{ color: trial.displayHex }}
          >
            {trial.word}
          </div>
        </div>

        {/* Color Choice Buttons */}
        <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-3">
          Select ink color:
        </div>
        <div className="grid grid-cols-2 gap-3 w-full mb-4">
          {STROOP_COLORS.map((col) => {
            const isTarget = col.name.toLowerCase() === trial.displayColorName.toLowerCase();
            let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400 text-gray-800 dark:text-gray-200';

            if (feedback) {
              if (isTarget) {
                btnClass = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-600 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500';
              }
            }

            return (
              <button
                key={col.name}
                type="button"
                onClick={() => handleSelectColor(col.name)}
                disabled={feedback !== null}
                className={`py-3.5 px-4 rounded-xl border-2 font-bold text-base shadow-xs transition-all flex items-center justify-center gap-2 ${btnClass}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block"
                  style={{ backgroundColor: col.hex }}
                />
                <span>{col.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Stroop Practice Completed"
        duration={timer}
        score={score}
        moves={moves}
        accuracy={Math.round((correctCount / TOTAL_ROUNDS) * 100)}
        extraMetrics={[
          { label: 'Rounds Correct', value: `${correctCount}/${TOTAL_ROUNDS}` },
          {
            label: 'Avg Response Time',
            value: reactionTimes.length
              ? `${Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)} ms`
              : '--'
          }
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
