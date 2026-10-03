import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { LOGIC_PUZZLES } from '../utils/logicPuzzlesData';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';

const TOTAL_PUZZLES = 3;

export default function LogicPuzzlesGame({
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
    gameType: 'logic-puzzles',
    difficulty
  });

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Pick 3 puzzles
  const [activePuzzles, setActivePuzzles] = useState([]);

  const initGame = useCallback(() => {
    const shuffled = [...LOGIC_PUZZLES].sort(() => Math.random() - 0.5).slice(0, TOTAL_PUZZLES);
    setActivePuzzles(shuffled);
    setPuzzleIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setCorrectCount(0);
    startGame();
  }, [startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentPuzzle = activePuzzles[puzzleIndex];

  const handleSelectOption = (idx) => {
    if (status !== 'playing' || answered) return;

    incrementMoves();
    setSelectedOption(idx);
    setAnswered(true);

    const isCorrect = idx === currentPuzzle.correctAnswer;
    if (isCorrect) {
      incrementScore(30);
      setCorrectCount(c => c + 1);
    }

    const progressPct = Math.round(((puzzleIndex + 1) / TOTAL_PUZZLES) * 100);
    if (onProgressUpdate) onProgressUpdate(progressPct);
  };

  const handleNextPuzzle = () => {
    if (puzzleIndex + 1 >= TOTAL_PUZZLES) {
      finishGame({
        accuracy: Math.round(((correctCount) / TOTAL_PUZZLES) * 100),
        puzzlesSolved: correctCount,
        totalPuzzles: TOTAL_PUZZLES
      });
    } else {
      setPuzzleIndex(p => p + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  };

  if (!currentPuzzle) return null;

  return (
    <GameContainer
      title="Deductive Logic Practice"
      category="Logical Practice"
      instructions="Read the premises carefully and use pure deductive reasoning to identify the single logically certain answer."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Puzzle', value: `${puzzleIndex + 1}/${TOTAL_PUZZLES}`, icon: '⟳' },
        { label: 'Correct', value: `${correctCount}/${puzzleIndex + (answered ? 1 : 0)}`, icon: '✓' }
      ]}
      onPause={pauseGame}
      onResume={resumeGame}
      onRestart={() => {
        restartGame();
        initGame();
      }}
      onBack={onBack}
    >
      <div className="max-w-xl w-full">
        {/* Puzzle Header */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
            Scenario {puzzleIndex + 1}:
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {currentPuzzle.title}
          </h2>
        </div>

        {/* Premises Card */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80 mb-5 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Given Premises:
          </div>
          {currentPuzzle.premises.map((p, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          {currentPuzzle.question}
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-6">
          {currentPuzzle.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentPuzzle.correctAnswer;

            let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-gray-800 dark:text-gray-200';

            if (answered) {
              if (isSelected && isCorrect) {
                btnClass = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-600 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnClass = 'bg-rose-100 dark:bg-rose-950 border-rose-600 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500';
              } else if (isCorrect) {
                btnClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={answered}
                className={`w-full p-3.5 rounded-xl border-2 text-left font-medium text-sm transition-all flex items-center justify-between shadow-xs ${btnClass}`}
              >
                <span>{option}</span>
                {answered && isSelected && (
                  isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Step */}
        {answered && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Deductive Proof:</strong> {currentPuzzle.explanation}
              </div>
            </div>

            <button
              onClick={handleNextPuzzle}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>{puzzleIndex + 1 >= TOTAL_PUZZLES ? 'Finish Practice' : 'Next Puzzle'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Deductive Logic Completed"
        duration={timer}
        score={score}
        moves={moves}
        accuracy={Math.round((correctCount / TOTAL_PUZZLES) * 100)}
        extraMetrics={[
          { label: 'Puzzles Solved', value: `${correctCount}/${TOTAL_PUZZLES}` }
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
