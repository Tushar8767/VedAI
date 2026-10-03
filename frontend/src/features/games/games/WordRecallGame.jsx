import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generateWordRecallSet } from '../utils/wordRecallSets';
import { CheckCircle2, Clock, Eye, Sparkles } from 'lucide-react';

const MEMORIZE_DURATION_SECONDS = 8;

export default function WordRecallGame({
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
    gameType: 'word-recall',
    difficulty
  });

  // 'memorize' | 'recall' | 'completed'
  const [phase, setPhase] = useState('memorize');
  const [memorizeCountdown, setMemorizeCountdown] = useState(MEMORIZE_DURATION_SECONDS);
  const [wordSet, setWordSet] = useState(null);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [feedback, setFeedback] = useState(null);

  const initGame = useCallback(() => {
    const wordCount = difficulty === 'hard' ? 7 : difficulty === 'medium' ? 6 : 5;
    const distractorCount = difficulty === 'hard' ? 7 : 5;
    const generated = generateWordRecallSet(wordCount, distractorCount);

    setWordSet(generated);
    setPhase('memorize');
    setMemorizeCountdown(MEMORIZE_DURATION_SECONDS);
    setSelectedWords(new Set());
    setFeedback(null);
    startGame();
  }, [difficulty, startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Memorize phase timer
  useEffect(() => {
    if (status !== 'playing' || phase !== 'memorize') return;

    if (memorizeCountdown <= 0) {
      setPhase('recall');
      return;
    }

    const interval = setInterval(() => {
      setMemorizeCountdown(c => c - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, phase, memorizeCountdown]);

  const toggleSelectWord = (word) => {
    if (status !== 'playing' || phase !== 'recall' || feedback) return;

    incrementMoves();
    const nextSelected = new Set(selectedWords);
    if (nextSelected.has(word)) {
      nextSelected.delete(word);
    } else {
      nextSelected.add(word);
    }
    setSelectedWords(nextSelected);

    const progressPct = Math.min(100, Math.round((nextSelected.size / wordSet.targetWords.length) * 100));
    if (onProgressUpdate) onProgressUpdate(progressPct);
  };

  const handleVerify = () => {
    if (!wordSet || selectedWords.size === 0) return;

    const targets = new Set(wordSet.targetWords);
    let correct = 0;
    let incorrect = 0;

    selectedWords.forEach(w => {
      if (targets.has(w)) correct++;
      else incorrect++;
    });

    const missed = wordSet.targetWords.length - correct;
    const accuracy = Math.round((correct / wordSet.targetWords.length) * 100);
    const roundScore = Math.max(0, (correct * 20) - (incorrect * 10));

    incrementScore(roundScore);
    setFeedback({
      correct,
      incorrect,
      missed,
      accuracy
    });

    setTimeout(() => {
      finishGame({
        accuracy,
        correctCount: correct,
        targetCount: wordSet.targetWords.length
      });
    }, 1500);
  };

  if (!wordSet) return null;

  return (
    <GameContainer
      title="Word Recall Practice"
      category="Memory Practice"
      instructions={
        phase === 'memorize'
          ? `Memorize as many words as you can before the ${memorizeCountdown}s timer expires.`
          : `Select the ${wordSet.targetWords.length} words that were in the original list.`
      }
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Phase', value: phase === 'memorize' ? 'Memorize' : 'Recall', icon: '★' },
        { label: 'Selected', value: `${selectedWords.size}/${wordSet.targetWords.length}`, icon: '✓' }
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
        {/* Phase 1: Memorization */}
        {phase === 'memorize' && (
          <div className="w-full text-center py-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold mb-5">
              <Clock className="w-3.5 h-3.5" />
              <span>Memorize time remaining: {memorizeCountdown}s</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6">
              {wordSet.targetWords.map((word, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg shadow-sm"
                >
                  {word}
                </span>
              ))}
            </div>

            <button
              onClick={() => setPhase('recall')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Ready now? Skip timer →
            </button>
          </div>
        )}

        {/* Phase 2: Recall & Pick */}
        {phase === 'recall' && (
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {wordSet.candidates.map((word, idx) => {
                const isSelected = selectedWords.has(word);
                const isTarget = wordSet.targetWords.includes(word);

                let btnStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
                if (isSelected) {
                  btnStyle = 'bg-emerald-600 border-emerald-600 text-white';
                }

                if (feedback) {
                  if (isSelected && isTarget) {
                    btnStyle = 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-400';
                  } else if (isSelected && !isTarget) {
                    btnStyle = 'bg-rose-600 border-rose-600 text-white';
                  } else if (!isSelected && isTarget) {
                    btnStyle = 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSelectWord(word)}
                    disabled={Boolean(feedback)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 ${btnStyle}`}
                  >
                    <span>{word}</span>
                    {isSelected && !feedback && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            {!feedback && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={selectedWords.size === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  selectedWords.size > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                Confirm Selection ({selectedWords.size} words)
              </button>
            )}

            {feedback && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-xs text-gray-700 dark:text-gray-300">
                Found {feedback.correct} of {wordSet.targetWords.length} words correctly.
              </div>
            )}
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Word Recall Completed"
        duration={timer}
        score={score}
        moves={moves}
        accuracy={feedback?.accuracy}
        extraMetrics={[
          { label: 'Words Recalled', value: `${feedback?.correct || 0}/${wordSet?.targetWords.length || 0}` }
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
