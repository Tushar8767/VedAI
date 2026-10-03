import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { Sparkles, Sun, Moon, TreePine, Flame, Compass, Feather, Flower2, Heart, Award } from 'lucide-react';

const ICONS = [
  { id: 'sun', icon: Sun, label: 'Sun' },
  { id: 'moon', icon: Moon, label: 'Moon' },
  { id: 'tree', icon: TreePine, label: 'Tree' },
  { id: 'flame', icon: Flame, label: 'Flame' },
  { id: 'compass', icon: Compass, label: 'Compass' },
  { id: 'feather', icon: Feather, label: 'Feather' },
  { id: 'flower', icon: Flower2, label: 'Flower' },
  { id: 'sparkles', icon: Sparkles, label: 'Sparkles' }
];

export default function MemoryMatchGame({
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
    gameType: 'memory-match',
    difficulty
  });

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Initialize deck
  const initGame = useCallback(() => {
    // 8 pairs = 16 cards
    const deck = [...ICONS, ...ICONS]
      .map((item, index) => ({
        uniqueId: `${item.id}-${index}`,
        iconId: item.id,
        icon: item.icon,
        label: item.label
      }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds(new Set());
    setIsEvaluating(false);
    startGame();
  }, [startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (index) => {
    if (
      status !== 'playing' ||
      isEvaluating ||
      flippedIndices.includes(index) ||
      matchedIds.has(cards[index].iconId)
    ) {
      return;
    }

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      incrementMoves();
      setIsEvaluating(true);
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.iconId === secondCard.iconId) {
        // Matched
        const nextMatched = new Set(matchedIds);
        nextMatched.add(firstCard.iconId);
        setMatchedIds(nextMatched);
        incrementScore(25);
        setFlippedIndices([]);
        setIsEvaluating(false);

        const progressPct = Math.round((nextMatched.size / ICONS.length) * 100);
        if (onProgressUpdate) onProgressUpdate(progressPct);

        if (nextMatched.size === ICONS.length) {
          finishGame({
            totalPairs: ICONS.length,
            accuracy: Math.round((ICONS.length / (moves + 1)) * 100)
          });
        }
      } else {
        // No match - brief timeout then flip back
        setTimeout(() => {
          setFlippedIndices([]);
          setIsEvaluating(false);
        }, 900);
      }
    }
  };

  return (
    <GameContainer
      title="Memory Match Practice"
      category="Memory Practice"
      instructions="Flip over two cards at a time to find matching pairs. Remember the location of previously revealed symbols."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Pairs Found', value: `${matchedIds.size}/${ICONS.length}`, icon: '★' }
      ]}
      onPause={pauseGame}
      onResume={resumeGame}
      onRestart={() => {
        restartGame();
        initGame();
      }}
      onBack={onBack}
    >
      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md w-full">
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || matchedIds.has(card.iconId);
          const isMatched = matchedIds.has(card.iconId);
          const IconComponent = card.icon;

          return (
            <button
              key={card.uniqueId}
              onClick={() => handleCardClick(index)}
              disabled={isFlipped || isEvaluating}
              className={`aspect-square rounded-2xl p-3 flex items-center justify-center font-bold text-2xl transition-all duration-300 shadow-sm ${
                isFlipped
                  ? isMatched
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rotate-y-180'
                    : 'bg-white dark:bg-gray-800 border-2 border-emerald-400 text-emerald-600 dark:text-emerald-300 rotate-y-180'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white hover:brightness-105 active:scale-95'
              }`}
              aria-label={isFlipped ? card.label : `Hidden card ${index + 1}`}
            >
              {isFlipped ? (
                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 animate-in zoom-in-50 duration-200" />
              ) : (
                <span className="text-white/40 text-lg font-mono">?</span>
              )}
            </button>
          );
        })}
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Memory Match Completed"
        duration={timer}
        score={score}
        moves={moves}
        extraMetrics={[
          { label: 'Pairs Found', value: `${matchedIds.size}/${ICONS.length}` }
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
