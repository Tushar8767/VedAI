import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generateSequencePuzzle } from '../utils/sequenceGenerator';
import { CheckCircle2, XCircle } from 'lucide-react';

const TOTAL_ROUNDS = 5;

export default function NumberSequenceGame({
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
    gameType: 'number-sequence',
    difficulty
  });

  const [currentRound, setCurrentRound] = useState(1);
  const [puzzle, setPuzzle] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [correctCount, setCorrectCount] = useState(0);

  const loadRound = useCallback((roundNum) => {
    const nextPuzzle = generateSequencePuzzle(difficulty);
    setPuzzle(nextPuzzle);
    setSelectedOption(null);
    setFeedback(null);
  }, [difficulty]);

  const initGame = useCallback(() => {
    setCurrentRound(1);
    setCorrectCount(0);
    loadRound(1);
    startGame();
  }, [loadRound, startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSelectOption = (option) => {
    if (status !== 'playing' || feedback !== null) return;

    incrementMoves();
    setSelectedOption(option);

    const isCorrect = option === puzzle.correctAnswer;

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
        loadRound(currentRound + 1);
      }
    }, 1200);
  };

  if (!puzzle) return null;

  return (
    <GameContainer
      title="Number Sequence Practice"
      category="Logical Practice"
      instructions="Examine the pattern in the number sequence and determine which number replaces the question mark."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Round', value: `${currentRound}/${TOTAL_ROUNDS}`, icon: '⟳' },
        { label: 'Accuracy', value: `${correctCount}/${currentRound - 1 + (feedback ? 1 : 0)}`, icon: '✓' }
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
        {/* Sequence Display */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-8 w-full">
          {puzzle.sequence.map((val, idx) => (
            <div
              key={idx}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center font-mono font-bold text-xl sm:text-2xl shadow-xs border transition-all ${
                val === '?'
                  ? 'border-2 border-dashed border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-pulse'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {val}
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          {puzzle.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-gray-900 dark:text-white';

            if (feedback && isSelected) {
              btnClass = feedback === 'correct'
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-rose-600 border-rose-600 text-white';
            } else if (feedback && option === puzzle.correctAnswer) {
              btnClass = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={feedback !== null}
                className={`py-4 px-4 rounded-xl border-2 font-mono font-bold text-xl shadow-xs transition-all flex items-center justify-center gap-2 ${btnClass}`}
              >
                <span>{option}</span>
                {feedback && isSelected && (
                  feedback === 'correct' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Explanation */}
        {feedback && (
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700 w-full text-center animate-in fade-in duration-200">
            <strong>Rule:</strong> {puzzle.rule}
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Number Sequence Completed"
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
