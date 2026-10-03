import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generateMaze } from '../utils/mazeGenerator';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flag, Navigation } from 'lucide-react';

export default function MazeGame({
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
    gameType: 'maze-escape',
    difficulty
  });

  const [maze, setMaze] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [visited, setVisited] = useState(new Set(['0,0']));

  const initGame = useCallback(() => {
    // 9x9 for easy, 13x13 for medium, 17x17 for hard
    const size = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 11 : 9;
    const generated = generateMaze(size, size);
    setMaze(generated);
    setPlayerPos({ x: 0, y: 0 });
    setVisited(new Set(['0,0']));
    startGame();
  }, [difficulty, startGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const movePlayer = useCallback((dx, dy) => {
    if (status !== 'playing' || !maze) return;

    const { x, y } = playerPos;
    const currentCell = maze.grid[y][x];

    // Check walls before moving
    if (dy === -1 && currentCell.top) return; // Wall above
    if (dx === 1 && currentCell.right) return; // Wall right
    if (dy === 1 && currentCell.bottom) return; // Wall below
    if (dx === -1 && currentCell.left) return; // Wall left

    const newX = x + dx;
    const newY = y + dy;

    if (newX < 0 || newX >= maze.width || newY < 0 || newY >= maze.height) return;

    incrementMoves();
    setPlayerPos({ x: newX, y: newY });

    const key = `${newX},${newY}`;
    const nextVisited = new Set(visited);
    if (!nextVisited.has(key)) {
      nextVisited.add(key);
      setVisited(nextVisited);
      incrementScore(5);
    }

    // Manhattan distance progress
    const totalDist = (maze.width - 1) + (maze.height - 1);
    const currDist = (maze.width - 1 - newX) + (maze.height - 1 - newY);
    const progressPct = Math.min(100, Math.round(((totalDist - currDist) / totalDist) * 100));
    if (onProgressUpdate) onProgressUpdate(progressPct);

    // Check destination reached
    if (newX === maze.end.x && newY === maze.end.y) {
      finishGame({
        cellsVisited: nextVisited.size,
        accuracy: Math.round(((maze.width + maze.height) / (moves + 1)) * 100)
      });
    }
  }, [status, maze, playerPos, incrementMoves, visited, incrementScore, onProgressUpdate, finishGame, moves]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (status !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        movePlayer(1, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, status]);

  if (!maze) return null;

  return (
    <GameContainer
      title="Spatial Maze Practice"
      category="Spatial Practice"
      instructions="Navigate from the top-left start to the golden flag destination at the bottom-right. Use Arrow keys, WASD, or the D-pad below."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Visited', value: `${visited.size} cells`, icon: '✦' }
      ]}
      onPause={pauseGame}
      onResume={resumeGame}
      onRestart={() => {
        restartGame();
        initGame();
      }}
      onBack={onBack}
    >
      <div className="flex flex-col items-center">
        {/* Maze Grid Display */}
        <div
          className="border-2 border-gray-900 dark:border-gray-100 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-md mb-6"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${maze.width}, minmax(0, 1fr))`
          }}
        >
          {maze.grid.map((row, y) =>
            row.map((cell, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isStart = x === maze.start.x && y === maze.start.y;
              const isEnd = x === maze.end.x && y === maze.end.y;
              const hasBeenVisited = visited.has(`${x},${y}`);

              let cellClass = '';
              if (cell.top) cellClass += ' border-t border-gray-900 dark:border-gray-200';
              if (cell.right) cellClass += ' border-r border-gray-900 dark:border-gray-200';
              if (cell.bottom) cellClass += ' border-b border-gray-900 dark:border-gray-200';
              if (cell.left) cellClass += ' border-l border-gray-900 dark:border-gray-200';

              return (
                <div
                  key={`${x}-${y}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center relative transition-colors ${cellClass} ${
                    hasBeenVisited ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {isPlayer && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-300 animate-pulse z-20 shadow-xs" />
                  )}
                  {isEnd && !isPlayer && (
                    <Flag className="w-4 h-4 text-amber-500 fill-amber-500 z-10" />
                  )}
                  {isStart && !isPlayer && !hasBeenVisited && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* On-screen D-Pad for Touch and Mobile */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => movePlayer(0, -1)}
            aria-label="Move Up"
            className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-emerald-600 active:text-white rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-xs transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => movePlayer(-1, 0)}
              aria-label="Move Left"
              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-emerald-600 active:text-white rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400">
              <Navigation className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={() => movePlayer(1, 0)}
              aria-label="Move Right"
              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-emerald-600 active:text-white rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-xs transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => movePlayer(0, 1)}
            aria-label="Move Down"
            className="w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-emerald-600 active:text-white rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-xs transition-colors"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Maze Practice Completed"
        duration={timer}
        score={score}
        moves={moves}
        extraMetrics={[
          { label: 'Cells Visited', value: visited.size }
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
