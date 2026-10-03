/**
 * Strict Gita Knowledge Base Validator
 * 
 * Verifies canonical integrity, chapter distribution, field completeness,
 * zero duplication, provenance tracking, and service compatibility.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHAPTERS_PATH = path.join(__dirname, '../../knowledge-base/gita_chapters.json');
const VERSES_PATH = path.join(__dirname, '../../knowledge-base/gita_verses.json');
const gitaService = require('../src/services/gitaService');

const CANONICAL_COUNTS = {
  1: 47,
  2: 72,
  3: 43,
  4: 42,
  5: 29,
  6: 47,
  7: 30,
  8: 28,
  9: 34,
  10: 42,
  11: 55,
  12: 20,
  13: 34,
  14: 27,
  15: 20,
  16: 24,
  17: 28,
  18: 78
};

const CURATED_12_IDS = [
  'BG_2_47', 'BG_2_14', 'BG_2_62', 'BG_2_63', 'BG_2_70',
  'BG_3_35', 'BG_6_5', 'BG_6_6', 'BG_6_16', 'BG_6_35',
  'BG_12_13', 'BG_18_66'
];

function runValidation() {
  console.log('=== RUNNING RIGOROUS GITA KNOWLEDGE BASE VALIDATION ===\n');

  // 1. Chapter File Integrity
  assert.ok(fs.existsSync(CHAPTERS_PATH), 'Chapters file must exist');
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS_PATH, 'utf8'));
  assert.strictEqual(chapters.length, 18, 'There must be exactly 18 chapters');

  let totalChapterVersesSum = 0;
  for (let i = 1; i <= 18; i++) {
    const ch = chapters.find(c => c.chapterNumber === i);
    assert.ok(ch, `Chapter ${i} must exist in chapters file`);
    assert.strictEqual(ch.versesCount, CANONICAL_COUNTS[i], `Chapter ${i} versesCount must be ${CANONICAL_COUNTS[i]}`);
    totalChapterVersesSum += ch.versesCount;
  }
  assert.strictEqual(totalChapterVersesSum, 700, 'Sum of all chapter verse counts must equal exactly 700');
  console.log('✅ Rule 1: 18 Chapters structure and canonical counts verified (Sum = 700)');

  // 2. Verses File Integrity
  assert.ok(fs.existsSync(VERSES_PATH), 'Verses file must exist');
  const verses = JSON.parse(fs.readFileSync(VERSES_PATH, 'utf8'));
  assert.strictEqual(verses.length, 700, `Expected 700 verses, but got ${verses.length}`);
  console.log('✅ Rule 2: Total verse count is exactly 700');

  // 3. Duplicate checks & verse distribution
  const idSet = new Set();
  const pairSet = new Set();
  const countsPerChapter = {};

  for (const v of verses) {
    // Unique ID
    assert.ok(v.id, `Verse must have id: ${JSON.stringify(v)}`);
    assert.ok(!idSet.has(v.id), `Duplicate verse id detected: ${v.id}`);
    idSet.add(v.id);

    // Unique (chapter, verse) pair
    const pair = `${v.chapter}:${v.verse}`;
    assert.ok(!pairSet.has(pair), `Duplicate chapter:verse pair detected: ${pair}`);
    pairSet.add(pair);

    // Count per chapter
    countsPerChapter[v.chapter] = (countsPerChapter[v.chapter] || 0) + 1;

    // Field completeness
    assert.ok(typeof v.chapter === 'number' && v.chapter >= 1 && v.chapter <= 18, `Invalid chapter in ${v.id}`);
    assert.ok(typeof v.verse === 'number' && v.verse >= 1, `Invalid verse number in ${v.id}`);
    assert.ok(typeof v.sanskrit === 'string' && v.sanskrit.trim().length > 0, `Missing sanskrit in ${v.id}`);
    assert.ok(typeof v.transliteration === 'string' && v.transliteration.trim().length > 0, `Missing transliteration in ${v.id}`);
    assert.ok(typeof v.translation === 'string' && v.translation.trim().length > 0, `Missing translation in ${v.id}`);
    assert.ok(typeof v.source === 'string' && v.source.trim().length > 0, `Missing source in ${v.id}`);
    assert.ok(Array.isArray(v.themes) && v.themes.length > 0, `Themes array empty in ${v.id}`);
    assert.ok(typeof v.simpleExplanation === 'string' && v.simpleExplanation.trim().length > 0, `Missing simpleExplanation in ${v.id}`);
    assert.ok(typeof v.whyThisVerse === 'string' && v.whyThisVerse.trim().length > 0, `Missing whyThisVerse in ${v.id}`);

    // Provenance verification
    assert.ok(v.provenance, `Missing provenance in ${v.id}`);
    assert.ok(v.provenance.sourceName, `Missing provenance.sourceName in ${v.id}`);
    assert.ok(v.provenance.sourceEdition, `Missing provenance.sourceEdition in ${v.id}`);
    assert.ok(v.provenance.sourceReference, `Missing provenance.sourceReference in ${v.id}`);
    assert.ok(v.provenance.translationSource, `Missing provenance.translationSource in ${v.id}`);

    // AI Assistance separation
    assert.ok(v.aiAssistance, `Missing aiAssistance in ${v.id}`);
    assert.ok(typeof v.aiAssistance.generatedMetadata === 'boolean', `Missing aiAssistance.generatedMetadata boolean in ${v.id}`);
  }

  console.log('✅ Rule 3: Zero duplicate IDs and zero duplicate (chapter, verse) pairs');
  console.log('✅ Rule 4: All 700 verses have non-empty Sanskrit, Transliteration, Translation, Themes, Explanations, and Provenance');

  // Verify chapter verse counts match canonical distribution
  for (let ch = 1; ch <= 18; ch++) {
    const actual = countsPerChapter[ch];
    const expected = CANONICAL_COUNTS[ch];
    assert.strictEqual(actual, expected, `Chapter ${ch} count mismatch: expected ${expected}, got ${actual}`);
    
    // Check consecutive sequence 1..expected
    for (let num = 1; num <= expected; num++) {
      const exists = verses.some(v => v.chapter === ch && v.verse === num);
      assert.ok(exists, `Missing verse ${ch}.${num} in chapter ${ch}`);
    }
  }
  console.log('✅ Rule 5: Canonical chapter-by-chapter verse distribution verified (1:47 to 18:78)');

  // 4. Curated 12 Verses Preservation
  for (const cid of CURATED_12_IDS) {
    const v = verses.find(x => x.id === cid);
    assert.ok(v, `Curated verse ${cid} must exist`);
    assert.strictEqual(v.aiAssistance.generatedMetadata, false, `Curated verse ${cid} must have generatedMetadata: false`);
    assert.ok(v.themes.length >= 4, `Curated verse ${cid} must retain rich themes`);
  }

  // Specifically check BG_2_47
  const bg247 = verses.find(x => x.id === 'BG_2_47');
  assert.ok(bg247.sanskrit.includes('कर्मण्येवाधिकारस्ते'));
  assert.ok(bg247.translation.includes('fruits of your actions'));
  assert.ok(bg247.themes.includes('Exam Stress'));
  console.log('✅ Rule 6: All 12 curated existing verses preserved with high-fidelity human explanations and themes');

  // 5. Backend Service Verification
  const chaptersFromService = gitaService.getAllChapters();
  assert.strictEqual(chaptersFromService.length, 18, 'Service must return 18 chapters');

  const ch2Verses = gitaService.getVersesByChapter(2);
  assert.strictEqual(ch2Verses.length, 72, 'Service getVersesByChapter(2) must return 72 verses');

  const verseLookup = gitaService.getVerse(2, 47);
  assert.ok(verseLookup, 'Service getVerse(2, 47) must return BG_2_47');
  assert.strictEqual(verseLookup.id, 'BG_2_47');

  const searchResults = gitaService.searchVerses('duty');
  assert.ok(searchResults.length > 0, 'searchVerses should return results');

  const relevant = gitaService.findRelevantVerses('I am overwhelmed with my exam results', 2);
  assert.ok(relevant.length > 0, 'findRelevantVerses should return recommendations');
  assert.strictEqual(relevant[0].verse.id, 'BG_2_47');
  console.log('✅ Rule 7: Backend gitaService methods fully functional with 700 verses');

  console.log('\n======================================================');
  console.log('🎉 ALL RIGOROUS GITA KNOWLEDGE BASE TESTS PASSED! (700/700)');
  console.log('======================================================\n');
}

runValidation();
