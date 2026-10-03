/**
 * VedAI 2.0 — Stroop Task Stimulus Generator Utility
 * 
 * Generates congruent and incongruent color-word stimulus pairs for selective focus practice.
 */

export const STROOP_COLORS = [
  { name: 'Red', hex: '#dc2626', key: 'red' },
  { name: 'Blue', hex: '#2563eb', key: 'blue' },
  { name: 'Green', hex: '#16a34a', key: 'green' },
  { name: 'Yellow', hex: '#ca8a04', key: 'yellow' },
  { name: 'Purple', hex: '#9333ea', key: 'purple' }
];

export function generateStroopTrial(congruentRatio = 0.3) {
  const isCongruent = Math.random() < congruentRatio;
  const wordObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];

  let inkObj;
  if (isCongruent) {
    inkObj = wordObj;
  } else {
    let diff = STROOP_COLORS.filter(c => c.name !== wordObj.name);
    inkObj = diff[Math.floor(Math.random() * diff.length)];
  }

  // Target answer is the INK color name
  return {
    word: wordObj.name,
    inkColor: inkObj.hex,
    displayHex: inkObj.hex,
    correctAnswer: inkObj.name,
    displayColorName: inkObj.name,
    isCongruent,
    options: STROOP_COLORS.map(c => c.name)
  };
}
