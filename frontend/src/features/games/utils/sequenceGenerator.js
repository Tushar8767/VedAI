/**
 * VedAI 2.0 — Number Sequence Generator Utility
 * 
 * Generates arithmetic, geometric, square, and Fibonacci number puzzles.
 */

export function generateSequencePuzzle(level = 1) {
  const types = ['arithmetic', 'geometric', 'squares', 'fibonacci_variant', 'alternating'];
  const type = types[Math.floor(Math.random() * (level > 2 ? types.length : 2))];

  let sequence = [];
  let answer = 0;
  let ruleDescription = '';

  switch (type) {
    case 'arithmetic': {
      const start = Math.floor(Math.random() * 20) + 1;
      const step = Math.floor(Math.random() * 7) + 2;
      sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      answer = start + step * 5;
      ruleDescription = `Add ${step} each step`;
      break;
    }
    case 'geometric': {
      const start = Math.floor(Math.random() * 4) + 2;
      const mult = Math.floor(Math.random() * 2) + 2;
      sequence = [start, start * mult, start * mult * mult, start * mult * mult * mult];
      answer = start * Math.pow(mult, 4);
      ruleDescription = `Multiply by ${mult} each step`;
      break;
    }
    case 'squares': {
      const offset = Math.floor(Math.random() * 5) + 1;
      sequence = [
        Math.pow(offset, 2),
        Math.pow(offset + 1, 2),
        Math.pow(offset + 2, 2),
        Math.pow(offset + 3, 2)
      ];
      answer = Math.pow(offset + 4, 2);
      ruleDescription = 'Consecutive squared integers';
      break;
    }
    case 'fibonacci_variant': {
      let a = Math.floor(Math.random() * 4) + 1;
      let b = Math.floor(Math.random() * 4) + 2;
      sequence = [a, b, a + b, b + (a + b), (a + b) + (b + (a + b))];
      answer = sequence[3] + sequence[4];
      ruleDescription = 'Sum of the two preceding numbers';
      break;
    }
    case 'alternating':
    default: {
      const start = Math.floor(Math.random() * 10) + 5;
      const add = 3;
      const sub = 1;
      sequence = [start, start + add, start + add - sub, start + add - sub + add, start + add - sub + add - sub];
      answer = sequence[sequence.length - 1] + add;
      ruleDescription = `Alternating +${add} and -${sub}`;
      break;
    }
  }

  // Generate 3 plausible distractors
  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + delta;
    if (candidate > 0 && candidate !== answer) {
      options.add(candidate);
    }
  }

  return {
    sequence,
    answer,
    ruleDescription,
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
}
