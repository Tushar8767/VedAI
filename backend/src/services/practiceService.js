/**
 * Daily Practice Service
 * 
 * Provides guided, non-competitive mindfulness routines across 7 core categories:
 * 1. Breathing (Sama Vritti / Box Breathing)
 * 2. Meditation (Mindful Stillness / Dhyana)
 * 3. Gita Practice (Gita Verse Contemplation)
 * 4. Reflection Practice (Inquiry & Thought Clarification)
 * 5. Focus Practice (Single-Point Focus & Breath Counting)
 * 6. Gratitude / Appreciation (Three Quiet Blessings)
 * 7. Self-discipline (Tapasya & Mindful Resolve)
 * 
 * Strictly records factual participation (e.g. "Completed 3-min Box Breathing"),
 * never claims clinical cure or computes synthetic "wellness points" or scores.
 */

const PRACTICES = [
  {
    id: 'box-breathing',
    title: 'Box Breathing (Sama Vritti)',
    category: 'Breathing',
    durationMinutes: 3,
    description: 'A 4-part rhythmic breathing cycle (Inhale 4s, Hold 4s, Exhale 4s, Rest 4s) to steady the nervous system.',
    instructions: [
      'Sit comfortably with a relaxed, upright spine.',
      'Inhale slowly through your nose for 4 counts.',
      'Gently hold your breath for 4 counts.',
      'Smoothly exhale through your mouth for 4 counts.',
      'Rest empty for 4 counts before the next cycle.'
    ],
    recommendedFor: ['stress_overwhelm', 'anxiety_fear', 'anger_frustration']
  },
  {
    id: 'mindful-stillness',
    title: 'Mindful Stillness (Dhyana)',
    category: 'Meditation',
    durationMinutes: 5,
    description: 'Quiet sitting observing the natural flow of breath without attempting to alter it.',
    instructions: [
      'Close your eyes gently or soften your gaze downward.',
      'Notice the sensation of cool air entering and warm air leaving.',
      'When your mind wanders into thoughts, simply notice and gently return to the breath.'
    ],
    recommendedFor: ['stress_overwhelm', 'general', 'calm_peace']
  },
  {
    id: 'gita-contemplation',
    title: 'Gita Verse Contemplation',
    category: 'Gita Practice',
    durationMinutes: 4,
    description: 'Read a verse slowly three times, reflecting on its meaning in your personal life.',
    instructions: [
      'Read the Sanskrit or translation quietly.',
      'Close your eyes and reflect: How does this apply to what I am facing today?',
      'Write down one insight that resonates with you.'
    ],
    recommendedFor: ['all']
  },
  {
    id: 'reflection-inquiry',
    title: 'Daily Reflection & Inquiry (Vichara)',
    category: 'Reflection Practice',
    durationMinutes: 5,
    description: 'Clarify current dilemmas or heavy emotions by observing them as an objective witness.',
    instructions: [
      'Identify what thought is occupying most of your attention today.',
      'Ask yourself: What about this is within my power, and what is beyond my control?',
      'Notice what changes in your body when you release the need to control the uncontrollable.'
    ],
    recommendedFor: ['stress_overwhelm', 'anxiety_fear', 'general']
  },
  {
    id: 'single-point-focus',
    title: 'Single-Point Breath Focus (Trataka / Dharana)',
    category: 'Focus Practice',
    durationMinutes: 3,
    description: 'Sharpen concentration by counting 10 mindful breaths without losing track.',
    instructions: [
      'Anchor your attention at the tip of your nostrils or the rising of your chest.',
      'Silently count "one" on the inhale, "one" on the exhale, up to "ten".',
      'If your mind wanders, begin again gently at "one" without self-reproach.'
    ],
    recommendedFor: ['stress_overwhelm', 'distraction', 'general']
  },
  {
    id: 'gratitude-reflection',
    title: 'Three Quiet Blessings (Santosh)',
    category: 'Gratitude',
    durationMinutes: 3,
    description: 'Identify three quiet blessings in your life that are easy to take for granted.',
    instructions: [
      'Think of one person whose kindness you appreciate.',
      'Think of one small comfort you enjoyed today (warm tea, fresh breeze, quiet moment).',
      'Acknowledge your own steady resilience in reaching this moment.'
    ],
    recommendedFor: ['sadness_grief', 'general']
  },
  {
    id: 'mindful-discipline',
    title: 'Mindful Resolve & Self-Discipline (Tapasya)',
    category: 'Self-discipline',
    durationMinutes: 4,
    description: 'Consciously commit to one intentional, virtuous action today regardless of mood or hesitation.',
    instructions: [
      'Name one important responsibility or task you have been putting off.',
      'Recognize that reluctance is merely temporary mental weather.',
      'Commit to taking the very first small step for just 5 focused minutes today.'
    ],
    recommendedFor: ['distraction', 'procrastination', 'general']
  }
];

const getPractices = () => PRACTICES;

const getPracticeById = (id) => PRACTICES.find(p => p.id === id) || null;

module.exports = {
  getPractices,
  getPracticeById
};
