import React, { useState, useEffect, useCallback } from 'react';
import useGameEngine from '../hooks/useGameEngine';
import GameContainer from '../components/GameContainer';
import GameResultModal from '../components/GameResultModal';
import { generateSudoku, validateSudokuMove, isSudokuSolved } from '../utils/sudokuGenerator';

export default function SudokuGame({
  difficulty = 'easy',
  onBack,
  multiplayerMode = false,
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
    gameType: 'sudoku',
    difficulty
  });

  const [puzzleData, setPuzzleData] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // [row, col]
  const [mistakes, setMistakes] = useState(0);

  // Initialize or restart board
  const initBoard = useCallback(() => {
    const data = generateSudoku(difficulty);
    setPuzzleData(data);
    setBoard(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setMistakes(0);
    startGame();
  }, [difficulty, startGame]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Handle cell entry
  const handleInput = useCallback((num) => {
    if (status !== 'playing' || !selectedCell || !puzzleData) return;
    const [r, c] = selectedCell;

    // Fixed initial clue cannot be changed
    if (puzzleData.initial[r][c] !== 0) return;

    incrementMoves();

    if (num === 0) {
      // Erase
      const nextBoard = board.map(row => [...row]);
      nextBoard[r][c] = 0;
      setBoard(nextBoard);
      return;
    }

    const isValid = validateSudokuMove(puzzleData.solution, r, c, num);
    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = num;
    setBoard(nextBoard);

    if (isValid) {
      incrementScore(10);
      // Calculate progress percentage
      const totalCellsToFill = 81 - puzzleData.puzzle.flat().filter(v => v !== 0).length;
      let filledCorrect = 0;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (puzzleData.initial[i][j] === 0 && nextBoard[i][j] === puzzleData.solution[i][j]) {
            filledCorrect++;
          }
        }
      }
      const progressPct = Math.round((filledCorrect / (totalCellsToFill || 1)) * 100);
      if (onProgressUpdate) onProgressUpdate(progressPct);

      if (isSudokuSolved(nextBoard, puzzleData.solution)) {
        finishGame({
          accuracy: Math.max(0, 1 - (mistakes / (moves + 1))),
          solved: true
        });
      }
    } else {
      setMistakes(m => m + 1);
    }
  }, [status, selectedCell, puzzleData, board, incrementMoves, incrementScore, onProgressUpdate, finishGame, mistakes, moves]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (status !== 'playing') return;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(0);
      } else if (e.key === 'ArrowUp' && selectedCell && selectedCell[0] > 0) {
        setSelectedCell([selectedCell[0] - 1, selectedCell[1]]);
      } else if (e.key === 'ArrowDown' && selectedCell && selectedCell[0] < 8) {
        setSelectedCell([selectedCell[0] + 1, selectedCell[1]]);
      } else if (e.key === 'ArrowLeft' && selectedCell && selectedCell[1] > 0) {
        setSelectedCell([selectedCell[0], selectedCell[1] - 1]);
      } else if (e.key === 'ArrowRight' && selectedCell && selectedCell[1] < 8) {
        setSelectedCell([selectedCell[0], selectedCell[1] + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, selectedCell, status]);

  if (!board) return null;

  return (
    <GameContainer
      title="Sudoku Focus Practice"
      category="Logical Practice"
      instructions="Fill each row, column, and 3×3 square with numbers 1 to 9 without repeating. Tap a cell and use numpad or keyboard numbers."
      status={status}
      timer={timer}
      score={score}
      moves={moves}
      extraStats={[
        { label: 'Mistakes', value: mistakes, icon: '!' }
      ]}
      onPause={pauseGame}
      onResume={resumeGame}
      onRestart={() => {
        restartGame();
        initBoard();
      }}
      onBack={onBack}
    >
      <div className="flex flex-col items-center">
        {/* 9x9 Sudoku Grid */}
        <div className="grid grid-cols-9 border-2 border-gray-900 dark:border-gray-100 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-md">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isInitial = puzzleData.initial[r][c] !== 0;
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const isError = val !== 0 && !isInitial && val !== puzzleData.solution[r][c];

              // Thick borders for 3x3 blocks
              const borderBottom = (r === 2 || r === 5) ? 'border-b-2 border-gray-900 dark:border-gray-200' : 'border-b border-gray-200 dark:border-gray-800';
              const borderRight = (c === 2 || c === 5) ? 'border-r-2 border-gray-900 dark:border-gray-200' : 'border-r border-gray-200 dark:border-gray-800';

              let bg = 'hover:bg-gray-100 dark:hover:bg-gray-800';
              if (isSelected) bg = 'bg-emerald-100 dark:bg-emerald-950/70 ring-2 ring-emerald-500 z-10';
              else if (isError) bg = 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400';

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setSelectedCell([r, c])}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center font-bold text-base sm:text-lg transition-colors select-none ${borderBottom} ${borderRight} ${bg} ${
                    isInitial ? 'text-gray-900 dark:text-gray-100 font-extrabold' : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                  aria-label={`Row ${r + 1} Column ${c + 1} value ${val || 'empty'}`}
                >
                  {val !== 0 ? val : ''}
                </button>
              );
            })
          )}
        </div>

        {/* Numpad Controls */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-6 max-w-md w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleInput(num)}
              className="py-2.5 rounded-xl font-bold bg-gray-100 hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-950/40 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all text-sm shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleInput(0)}
            className="py-2.5 rounded-xl font-bold bg-gray-200 hover:bg-rose-100 dark:bg-gray-700 dark:hover:bg-rose-950/40 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 transition-all text-xs shadow-xs"
          >
            Clear
          </button>
        </div>
      </div>

      <GameResultModal
        isOpen={status === 'finished'}
        title="Sudoku Practice Complete"
        duration={timer}
        score={score}
        moves={moves}
        extraMetrics={[
          { label: 'Mistakes', value: mistakes }
        ]}
        onPlayAgain={() => {
          restartGame();
          initBoard();
        }}
        onExit={onBack}
      />
    </GameContainer>
  );
}
