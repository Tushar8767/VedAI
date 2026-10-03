const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');

const userRepository = require('../src/repositories/userRepository');
const journalRepository = require('../src/repositories/journalRepository');
const noteRepository = require('../src/repositories/noteRepository');
const practiceRepository = require('../src/repositories/practiceRepository');
const bookmarkRepository = require('../src/repositories/bookmarkRepository');

const { processUniversalInput } = require('../src/services/universalInputService');
const { resolveValidatedContext } = require('../src/services/validationService');
const { getPractices } = require('../src/services/practiceService');
const { getCuratedResources } = require('../src/services/resourceService');
const { assessSafety } = require('../src/services/safetyService');

test('VedAI 2.0 — Phase 1 Core Implementation Verification Suite', async (t) => {
  // Test Users
  const userA_Email = `usera_${Date.now()}@gmail.com`;
  const userB_Email = `userb_${Date.now()}@gmail.com`;
  let userA = null;
  let userB = null;

  let userA_JournalId = null;
  let userA_NoteId = null;
  let userA_BookmarkId = null;

  // SETUP: Create two distinct users
  await t.test('Setup: Create User A and User B', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('SecurePassword123!', salt);

    userA = await userRepository.create({
      name: 'Seeker Arjuna',
      email: userA_Email,
      passwordHash: hash
    });
    assert.ok(userA && userA._id);

    userB = await userRepository.create({
      name: 'Seeker Bhima',
      email: userB_Email,
      passwordHash: hash
    });
    assert.ok(userB && userB._id);
    assert.notStrictEqual(String(userA._id), String(userB._id));
  });

  // PHASE 1B: USER WORKSPACE OWNERSHIP & ISOLATION
  await t.test('Phase 1B: User A creates records (Journal, Notes, Practices, Bookmarks)', async () => {
    // 1. Journal Entry
    const journal = await journalRepository.create({
      userId: userA._id,
      rawUserInput: 'I feel tense about results',
      finalWorkingContext: 'Tension regarding performance',
      userReflectionNotes: 'Focus on today',
      tags: ['study']
    });
    userA_JournalId = journal._id;
    assert.ok(userA_JournalId);

    // 2. Note
    const note = await noteRepository.create({
      userId: userA._id,
      title: 'Private Study Plan',
      content: 'Chapter 2 contemplation',
      tags: ['reflection']
    });
    userA_NoteId = note._id;
    assert.ok(userA_NoteId);

    // 3. Practice Log
    await practiceRepository.create({
      userId: userA._id,
      practiceId: 'box-breathing',
      practiceTitle: 'Box Breathing (Sama Vritti)',
      category: 'Breathing',
      durationMinutes: 4,
      userNote: 'Felt calm'
    });

    // 4. Bookmark
    const bm = await bookmarkRepository.create({
      userId: userA._id,
      verseId: 'BG_2_47',
      chapter: 2,
      verse: 47,
      sanskrit: 'कर्मण्येवाधिकारस्ते',
      translation: 'You have a right to action alone'
    });
    userA_BookmarkId = bm._id;
    assert.ok(userA_BookmarkId);
  });

  await t.test('Phase 1B: User B CANNOT view or access User A data (Strict Isolation)', async () => {
    // User B checks journals
    const userB_Journals = await journalRepository.findByUser(userB._id);
    assert.strictEqual(userB_Journals.length, 0, 'User B must see 0 journals');

    // User B checks notes
    const userB_Notes = await noteRepository.findByUser(userB._id);
    assert.strictEqual(userB_Notes.length, 0, 'User B must see 0 notes');

    // User B checks practices
    const userB_Practices = await practiceRepository.findByUser(userB._id);
    assert.strictEqual(userB_Practices.length, 0, 'User B must see 0 practices');

    // User B checks bookmarks
    const userB_Bookmarks = await bookmarkRepository.findByUser(userB._id);
    assert.strictEqual(userB_Bookmarks.length, 0, 'User B must see 0 bookmarks');
  });

  await t.test('Phase 1B: User B CANNOT modify or delete User A records (Unauthorized Mutation Blocked)', async () => {
    // User B tries to update User A's note
    const updateAttempt = await noteRepository.update(userA_NoteId, userB._id, {
      title: 'Hacked by User B'
    });
    assert.strictEqual(updateAttempt, null, 'User B update on User A note must return null');

    // Verify User A's note remains unaltered
    const noteLookup = await noteRepository.findByUser(userA._id);
    assert.strictEqual(noteLookup[0].title, 'Private Study Plan');

    // User B tries to delete User A's journal
    const deleteJournalAttempt = await journalRepository.deleteByIdAndUser(userA_JournalId, userB._id);
    assert.strictEqual(deleteJournalAttempt, null, 'User B cannot delete User A journal');

    // User B tries to delete User A's bookmark
    const deleteBookmarkAttempt = await bookmarkRepository.deleteByIdAndUser(userA_BookmarkId, userB._id);
    assert.strictEqual(deleteBookmarkAttempt, null, 'User B cannot delete User A bookmark');
  });

  // PHASE 1C: UNIVERSAL INPUT PIPELINE
  await t.test('Phase 1C: Universal Input preserves raw text and correctly parses multilingual signals', () => {
    const rawMarathi = "mala khup bhiti vat-te... kahi suchat nahi";
    const parsedMarathi = processUniversalInput(rawMarathi);
    assert.strictEqual(parsedMarathi.rawText, rawMarathi, 'Raw user input must never be mutated');
    assert.strictEqual(parsedMarathi.language.primary, 'Marathi-English');
    assert.strictEqual(parsedMarathi.isInsufficient, false);

    // Emojis & slang
    const rawSlang = "bro im cooked 😭 sooooo strest";
    const parsedSlang = processUniversalInput(rawSlang);
    assert.strictEqual(parsedSlang.rawText, rawSlang);
    assert.ok(parsedSlang.normalizedText.includes('overwhelmed'));

    // Meaningless / gibberish rejection without inventing fake emotions
    const gibberish = "......";
    const parsedGibberish = processUniversalInput(gibberish);
    assert.strictEqual(parsedGibberish.isInsufficient, true);
    assert.ok(parsedGibberish.clarificationPrompt.includes('share a little more'));
  });

  // PHASE 1D: HUMAN-IN-THE-LOOP VALIDATION
  await t.test('Phase 1D: User correction overrides AI output and updates working context', () => {
    const mockAiSignal = {
      fusedSignal: 'stress_overwhelm',
      confidenceLevel: 'Tentative',
      displaySummary: 'Signals associated with stress or feeling overwhelmed.'
    };

    // Case 1: User agrees (Accurate)
    const confirmed = resolveValidatedContext({
      rawInput: 'I have too much to do',
      aiInterpretation: mockAiSignal,
      validationChoice: 'ACCURATE'
    });
    assert.strictEqual(confirmed.finalValidatedContext, 'stress_overwhelm');

    // Case 2: User corrects ("Not really, I am actually grieving")
    const corrected = resolveValidatedContext({
      rawInput: 'I feel heavy',
      aiInterpretation: mockAiSignal,
      validationChoice: 'USER_CORRECTED',
      userCorrection: 'I am actually grieving the loss of my mentor.'
    });
    assert.strictEqual(corrected.finalValidatedContext, 'I am actually grieving the loss of my mentor.');
    assert.ok(corrected.workingRationale.includes('User stated context has highest priority'));
  });

  // PHASE 1F: JOURNAL & NOTES CLEAR DISTINCTION
  await t.test('Phase 1F: Journal clearly distinguishes user content from AI content', async () => {
    const rawInput = "I am afraid I will disappoint my parents.";
    const userNote = "My real fear is losing their respect.";
    const aiSignal = "anxiety_fear";
    const gitaRef = "BG 2.47";

    const entry = await journalRepository.create({
      userId: userA._id,
      rawUserInput: rawInput,
      aiEstimatedSignal: aiSignal,
      userValidationChoice: 'ACCURATE',
      finalWorkingContext: 'Fear of disappointing parents',
      linkedVerseRef: gitaRef,
      userReflectionNotes: userNote
    });

    assert.strictEqual(entry.rawUserInput, rawInput, 'User original input kept separate');
    assert.strictEqual(entry.userReflectionNotes, userNote, 'User personal notes kept separate');
    assert.strictEqual(entry.aiEstimatedSignal, aiSignal, 'AI signal labeled separately');
    assert.strictEqual(entry.linkedVerseRef, gitaRef, 'Gita scripture linked separately');
  });

  // PHASE 1H: DAILY PRACTICE SUITE
  await t.test('Phase 1H: Practice suite contains all 7 required categories', () => {
    const practices = getPractices();
    assert.strictEqual(practices.length >= 7, true, 'Must have at least 7 practices');

    const categories = practices.map(p => p.category);
    assert.ok(categories.includes('Breathing'), 'Must include Breathing');
    assert.ok(categories.includes('Meditation'), 'Must include Meditation');
    assert.ok(categories.includes('Gita Practice'), 'Must include Gita Practice');
    assert.ok(categories.includes('Reflection Practice'), 'Must include Reflection Practice');
    assert.ok(categories.includes('Focus Practice'), 'Must include Focus Practice');
    assert.ok(categories.includes('Gratitude'), 'Must include Gratitude');
    assert.ok(categories.includes('Self-discipline'), 'Must include Self-discipline');
  });

  // PHASE 1I: RESOURCES MODULE
  await t.test('Phase 1I: Resources contain all 6 controlled categories', () => {
    const allResources = getCuratedResources('All');
    assert.ok(allResources.length >= 6);

    const categories = new Set(allResources.map(r => r.category));
    assert.ok(categories.has('Gita'));
    assert.ok(categories.has('Meditation'));
    assert.ok(categories.has('Breathing'));
    assert.ok(categories.has('Focus'));
    assert.ok(categories.has('Reflection'));
    assert.ok(categories.has('Learning'));

    // Check external URL integrity
    for (const res of allResources) {
      assert.ok(res.url.startsWith('https://www.youtube.com/'), 'External links must be controlled YouTube links');
    }
  });

  // PHASE 1J: PRIVACY, DATA EXPORT & DATA PURGE
  await t.test('Phase 1J: Content Deletion vs Account Purge verification', async () => {
    // 1. Content Deletion: Delete user content only, account stays active
    await journalRepository.deleteByUser(userA._id);
    await noteRepository.deleteByUser(userA._id);
    await practiceRepository.deleteByUser(userA._id);
    await bookmarkRepository.deleteByUser(userA._id);

    const journalsAfterWipe = await journalRepository.findByUser(userA._id);
    assert.strictEqual(journalsAfterWipe.length, 0, 'Journals wiped');

    const userStillExists = await userRepository.findById(userA._id);
    assert.ok(userStillExists, 'User account must still exist after content-only deletion');

    // 2. Account Purge: Completely delete user record
    await userRepository.deleteById(userA._id);
    const userAfterPurge = await userRepository.findById(userA._id);
    assert.strictEqual(userAfterPurge, null, 'User account must be permanently deleted from DB');
  });

  // CLEANUP USER B
  await t.test('Cleanup: Delete User B record', async () => {
    if (userB && userB._id) {
      await journalRepository.deleteByUser(userB._id);
      await noteRepository.deleteByUser(userB._id);
      await practiceRepository.deleteByUser(userB._id);
      await bookmarkRepository.deleteByUser(userB._id);
      await userRepository.deleteById(userB._id);
    }
  });

});
