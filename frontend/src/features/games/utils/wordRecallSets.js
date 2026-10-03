/**
 * VedAI 2.0 — Word Recall Word Pools
 * 
 * Provides thematic and Sanskrit-inspired philosophical vocabulary for exposure and delayed recall.
 */

export const WORD_POOLS = {
  nature: [
    'Banyan', 'Lotus', 'River', 'Forest', 'Mountain', 'Cloud', 'Sunrise', 'Ocean',
    'Rain', 'Breeze', 'Stone', 'Leaf', 'Meadow', 'Horizon', 'Thunder', 'Valley'
  ],
  virtues: [
    'Clarity', 'Patience', 'Courage', 'Equanimity', 'Compassion', 'Truth', 'Discipline', 'Gratitude',
    'Harmony', 'Sincerity', 'Gentleness', 'Stillness', 'Contentment', 'Resolve', 'Humility', 'Wisdom'
  ],
  philosophical: [
    'Dharma', 'Karma', 'Sadhana', 'Prana', 'Shanti', 'Moksha', 'Atman', 'Dhyana',
    'Satya', 'Ahimsa', 'Santosha', 'Viveka', 'Vairagya', 'Bhakti', 'Jnana', 'Samadhi'
  ]
};

export function getWordSet(category = 'nature', count = 6) {
  const pool = WORD_POOLS[category] || WORD_POOLS.nature;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return {
    targetWords: shuffled.slice(0, count),
    distractors: shuffled.slice(count, count + 6)
  };
}

export function generateWordRecallSet(targetCount = 5, distractorCount = 6) {
  const categories = Object.keys(WORD_POOLS);
  const chosenCat = categories[Math.floor(Math.random() * categories.length)];
  const pool = [...WORD_POOLS[chosenCat]].sort(() => Math.random() - 0.5);

  const targetWords = pool.slice(0, targetCount);
  const distractors = pool.slice(targetCount, targetCount + distractorCount);
  const candidates = [...targetWords, ...distractors].sort(() => Math.random() - 0.5);

  return {
    category: chosenCat,
    targetWords,
    distractors,
    candidates
  };
}
