const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CHAPTERS_PATH = path.join(__dirname, '../../knowledge-base/gita_chapters.json');
const VERSES_PATH = path.join(__dirname, '../../knowledge-base/gita_verses.json');
const gitaService = require('../src/services/gitaService');

const CANONICAL_COUNTS = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
};

const CURATED_12_IDS = [
  'BG_2_47', 'BG_2_14', 'BG_2_62', 'BG_2_63', 'BG_2_70',
  'BG_3_35', 'BG_6_5', 'BG_6_6', 'BG_6_16', 'BG_6_35',
  'BG_12_13', 'BG_18_66'
];

test('VedAI 2.0 — Phase 2A Verified Gita Knowledge Base Test Suite', async (t) => {

  await t.test('1. Chapter metadata integrity: exactly 18 chapters and exactly 700 canonical verses', () => {
    assert.ok(fs.existsSync(CHAPTERS_PATH), 'Chapters file must exist');
    const chapters = JSON.parse(fs.readFileSync(CHAPTERS_PATH, 'utf8'));
    assert.strictEqual(chapters.length, 18, 'There must be exactly 18 chapters');

    let totalVerses = 0;
    for (let i = 1; i <= 18; i++) {
      const ch = chapters.find(c => c.chapterNumber === i);
      assert.ok(ch, `Chapter ${i} must exist in chapters file`);
      assert.strictEqual(ch.versesCount, CANONICAL_COUNTS[i], `Chapter ${i} versesCount must be ${CANONICAL_COUNTS[i]}`);
      totalVerses += ch.versesCount;
    }
    assert.strictEqual(totalVerses, 700, 'Sum of all chapter verse counts must equal exactly 700');
  });

  await t.test('2. Total verses count: exactly 700 verses in knowledge-base/gita_verses.json', () => {
    assert.ok(fs.existsSync(VERSES_PATH), 'Verses file must exist');
    const verses = JSON.parse(fs.readFileSync(VERSES_PATH, 'utf8'));
    assert.strictEqual(verses.length, 700, `Expected 700 verses, but got ${verses.length}`);
  });

  await t.test('3. No duplicates and canonical sequential distribution across all 18 chapters', () => {
    const verses = JSON.parse(fs.readFileSync(VERSES_PATH, 'utf8'));
    const idSet = new Set();
    const pairSet = new Set();
    const countsPerChapter = {};

    for (const v of verses) {
      assert.ok(!idSet.has(v.id), `Duplicate ID: ${v.id}`);
      idSet.add(v.id);

      const pair = `${v.chapter}:${v.verse}`;
      assert.ok(!pairSet.has(pair), `Duplicate chapter:verse pair: ${pair}`);
      pairSet.add(pair);

      countsPerChapter[v.chapter] = (countsPerChapter[v.chapter] || 0) + 1;
    }

    for (let ch = 1; ch <= 18; ch++) {
      assert.strictEqual(countsPerChapter[ch], CANONICAL_COUNTS[ch], `Chapter ${ch} count mismatch`);
      for (let num = 1; num <= CANONICAL_COUNTS[ch]; num++) {
        assert.ok(verses.some(v => v.chapter === ch && v.verse === num), `Missing verse ${ch}.${num}`);
      }
    }
  });

  await t.test('4. Complete schema and provenance metadata on all 700 verses', () => {
    const verses = JSON.parse(fs.readFileSync(VERSES_PATH, 'utf8'));
    for (const v of verses) {
      assert.ok(v.sanskrit && v.sanskrit.trim().length > 0, `Missing sanskrit in ${v.id}`);
      assert.ok(v.transliteration && v.transliteration.trim().length > 0, `Missing transliteration in ${v.id}`);
      assert.ok(v.translation && v.translation.trim().length > 0, `Missing translation in ${v.id}`);
      assert.ok(Array.isArray(v.themes) && v.themes.length > 0, `Missing themes in ${v.id}`);
      assert.ok(v.simpleExplanation && v.simpleExplanation.trim().length > 0, `Missing simpleExplanation in ${v.id}`);
      assert.ok(v.whyThisVerse && v.whyThisVerse.trim().length > 0, `Missing whyThisVerse in ${v.id}`);

      // Provenance
      assert.ok(v.provenance, `Missing provenance in ${v.id}`);
      assert.ok(v.provenance.sourceName, `Missing sourceName in ${v.id}`);
      assert.ok(v.provenance.sourceEdition, `Missing sourceEdition in ${v.id}`);
      assert.ok(v.provenance.sourceReference, `Missing sourceReference in ${v.id}`);
      assert.ok(v.provenance.translationSource, `Missing translationSource in ${v.id}`);

      // AI Assistance separation
      assert.ok(v.aiAssistance, `Missing aiAssistance in ${v.id}`);
      assert.strictEqual(typeof v.aiAssistance.generatedMetadata, 'boolean');
    }
  });

  await t.test('5. Backward compatibility and preservation of 12 curated verses', () => {
    const verses = JSON.parse(fs.readFileSync(VERSES_PATH, 'utf8'));
    for (const cid of CURATED_12_IDS) {
      const v = verses.find(x => x.id === cid);
      assert.ok(v, `Curated verse ${cid} must exist`);
      assert.strictEqual(v.aiAssistance.generatedMetadata, false);
      assert.ok(v.themes.length >= 4);
    }

    const bg247 = verses.find(x => x.id === 'BG_2_47');
    assert.ok(bg247.sanskrit.includes('कर्मण्येवाधिकारस्ते'));
    assert.ok(bg247.translation.includes('fruits of your actions'));
    assert.ok(bg247.themes.includes('Exam Stress'));
  });

  await t.test('6. Gita Service queries correctly across full 700-verse corpus', () => {
    const chapters = gitaService.getAllChapters();
    assert.strictEqual(chapters.length, 18);

    const ch18Verses = gitaService.getVersesByChapter(18);
    assert.strictEqual(ch18Verses.length, 78);

    const ch13Verses = gitaService.getVersesByChapter(13);
    assert.strictEqual(ch13Verses.length, 34);

    const verse13_1 = gitaService.getVerse(13, 1);
    assert.ok(verse13_1);
    assert.strictEqual(verse13_1.id, 'BG_13_1');

    const searchResults = gitaService.searchVerses('duty');
    assert.ok(searchResults.length > 0);

    const recommendations = gitaService.findRelevantVerses('exam stress anxiety', 2);
    assert.ok(recommendations.length > 0);
    assert.strictEqual(recommendations[0].verse.id, 'BG_2_47');
  });

});
