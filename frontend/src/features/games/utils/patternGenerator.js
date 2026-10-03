/**
 * VedAI 2.0 — Pattern Recognition Generator Utility
 * 
 * Generates 3x3 matrix pattern deduction puzzles with geometric symbols and rotations.
 */

const SYMBOLS = ['▲', '◆', '●', '■', '★', '✚', '✦', '▼'];
const ROTATIONS = [0, 90, 180, 270];

export function generatePatternPuzzle(level = 1) {
  const pool = [...SYMBOLS].sort(() => Math.random() - 0.5);
  const s1 = pool[0];
  const s2 = pool[1];
  const s3 = pool[2];

  // Cyclic pattern:
  // Row 0: s1, s2, s3
  // Row 1: s2, s3, s1
  // Row 2: s3, s1, [s2]
  const patternSymbols = [
    s1, s2, s3,
    s2, s3, s1,
    s3, s1, s2
  ];

  const grid = patternSymbols.map((sym, idx) => {
    if (idx === 8) {
      return { isMissing: true, symbol: '?', rotation: 0 };
    }
    return { isMissing: false, symbol: sym, rotation: 0 };
  });

  const correctOption = { symbol: s2, rotation: 0 };
  const distractorSymbols = pool.slice(3, 7);

  const options = [
    correctOption,
    { symbol: distractorSymbols[0] || '●', rotation: 0 },
    { symbol: distractorSymbols[1] || '■', rotation: 0 },
    { symbol: distractorSymbols[2] || '▲', rotation: 0 }
  ].sort(() => Math.random() - 0.5);

  const correctOptionIndex = options.findIndex(o => o.symbol === s2);

  const matrix = [
    [s1, s2, s3],
    [s2, s3, s1],
    [s3, s1, '?']
  ];

  return {
    grid,
    matrix,
    answer: s2,
    correctOptionIndex,
    options,
    hint: 'Each row contains a cyclic rotation of the same three geometric symbols.'
  };
}
