import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generatePatternPuzzle } from '../utils/patternGenerator';
import { CheckCircle2, XCircle } from 'lucide-react';

const TOTAL_ROUNDS = 5;

export default function PatternRecognitionGame({
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
    gameType: 'pattern-recognition',
    difficulty
  });

  const [currentRound, setCurrentRound] = useState(1);
  const [puzzle, setPuzzle] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  const loadRound = useCallback(() => {
    const nextPuzzle = generatePatternPuzzle(difficulty);
    setPuzzle(nextPuzzle);
    setSelectedOption(null);
    setFeedback(null);
  }, [difficulty]);

  const initGame = useCallback(() => {
    setCurrentRound(1);
    setCorrectCount(0);
    loadRound();
    startGame();
  }, [loadRound, startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSelectOption = (idx) => {
    if (status !== 'playing' || feedback !== null) return;

    incrementMoves();
    setSelectedOption(idx);

    const isCorrect = idx === puzzle.correctOptionIndex;

    if (isCorrect) {
      setFeedback('correct');
      incrementScore(20);
      setCorrectCount(c => c + 1);
    } else {
      setFeedback('wrong');
    }

    const progressPct = Math.round((currentRound / TOTAL_ROUNDS) * 100);
    if (onProgressUpdate) onProgressUpdate(progressPct);

    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        finishGame({
          accuracy: Math.round(((correctCount + (isCorrect ? 1 : 0)) / TOTAL_ROUNDS) * 100),
          roundsCompleted: TOTAL_ROUNDS
        });
      } else {
        setCurrentRound(r => r + 1);
        loadRound();
      }
    }, 1200);
  };

  if (!puzzle) return null;

  return (
    <GameContainer
      title="Pattern Recognition Practice"
      category="Logical Practice"
      instructions="Inspect the 3×3 matrix to determine the visual pattern or orientation rule, then pick the tile that completes the grid."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Round', value: `${currentRound}/${TOTAL_ROUNDS}`, icon: '⟳' },
        { label: 'Correct', value: `${correctCount}/${currentRound - 1 + (feedback ? 1 : 0)}`, icon: '✓' }
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
        {/* 3x3 Matrix Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 shadow-xs">
          {puzzle.grid.map((cell, idx) => {
            const isMissing = cell.isMissing;
            return (
              <div
                key={idx}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center border transition-all ${
                  isMissing
                    ? 'border-2 border-dashed border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xs'
                }`}
              >
                {isMissing ? (
                  <span className="text-3xl font-black">?</span>
                ) : (
                  <span
                    className="text-3xl select-none"
                    style={{
                      transform: `rotate(${cell.rotation || 0}deg)`,
                      display: 'inline-block'
                    }}
                  >
                    {cell.symbol}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 4 Options Grid */}
        <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
          Select the missing tile:
        </div>
        <div className="grid grid-cols-4 gap-3 w-full mb-4">
          {puzzle.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-500';

            if (feedback && isSelected) {
              btnClass = feedback === 'correct'
                ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-600 ring-2 ring-emerald-500'
                : 'bg-rose-100 dark:bg-rose-950 border-rose-600 ring-2 ring-rose-500';
            } else if (feedback && idx === puzzle.correctOptionIndex) {
              btnClass = 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={feedback !== null}
                className={`aspect-square rounded-xl border-2 flex items-center justify-center p-2 shadow-xs transition-all ${btnClass}`}
              >
                <span
                  className="text-2xl select-none"
                  style={{
                    transform: `rotate(${opt.rotation || 0}deg)`,
                    display: 'inline-block'
                  }}
                >
                  {opt.symbol}
                </span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full text-center">
            {feedback === 'correct' ? 'Pattern correctly identified!' : 'Pattern rule: Rotate clockwise per step.'}
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Pattern Recognition Completed"
        duration={timer}
        score={score}
        moves={moves}
        accuracy={Math.round((correctCount / TOTAL_ROUNDS) * 100)}
        extraMetrics={[
          { label: 'Rounds Solved', value: `${correctCount}/${TOTAL_ROUNDS}` }
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
