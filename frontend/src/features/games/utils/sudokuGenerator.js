/**
 * VedAI 2.0 — Sudoku Generator and Solver Utility
 * 
 * Generates solvable 9x9 Sudoku boards across Easy, Medium, and Hard difficulties.
 */

// Full valid baseline template
const SAMPLE_SOLUTIONS = [
  [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9]
  ],
  [
    [1,2,3,4,5,6,7,8,9],
    [4,5,6,7,8,9,1,2,3],
    [7,8,9,1,2,3,4,5,6],
    [2,3,1,5,6,4,8,9,7],
    [5,6,4,8,9,7,2,3,1],
    [8,9,7,2,3,1,5,6,4],
    [3,1,2,6,4,5,9,7,8],
    [6,4,5,9,7,8,3,1,2],
    [9,7,8,3,1,2,6,4,5]
  ]
];

export function generateSudoku(difficulty = 'easy') {
  const base = SAMPLE_SOLUTIONS[Math.floor(Math.random() * SAMPLE_SOLUTIONS.length)];
  // Deep clone
  const solution = base.map(row => [...row]);

  // Remove numbers based on difficulty
  // Easy: ~36 cells removed; Medium: ~46 removed; Hard: ~54 removed
  const blanksCount = difficulty === 'hard' ? 52 : (difficulty === 'medium' ? 44 : 34);

  const puzzle = solution.map(row => [...row]);
  let removed = 0;

  while (removed < blanksCount) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  // Pre-calculate initial immutable cells
  const initialMask = puzzle.map(row => row.map(cell => cell !== 0));

  return {
    initialBoard: puzzle,
    puzzle,
    initial: puzzle,
    solution,
    initialMask
  };
}

export function validateSudokuMove(solution, r, c, num) {
  if (r < 0 || r >= 9 || c < 0 || c >= 9) return false;
  return solution[r][c] === num;
}

export function isSudokuComplete(board, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0 || board[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

export const isSudokuSolved = isSudokuComplete;
