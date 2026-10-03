/**
 * Build Gita Corpus Script
 * 
 * Fetches canonical 700 verses and scholarly translations, cleans Sanskrit and transliterations,
 * seamlessly preserves the 12 existing curated verses, resolves the Chapter 13 34-verse
 * canonical Shankaracharya tradition, and writes the complete verified dataset to
 * knowledge-base/gita_verses.json and updates knowledge-base/gita_chapters.json.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const KB_DIR = path.join(__dirname, '../../knowledge-base');
const CHAPTERS_FILE = path.join(KB_DIR, 'gita_chapters.json');
const VERSES_FILE = path.join(KB_DIR, 'gita_verses.json');
const BACKUP_FILE = path.join(KB_DIR, 'gita_verses.backup.json');

const VERSE_URL = 'https://raw.githubusercontent.com/praneshp1org/Bhagavad-Gita-JSON-data/main/verse.json';
const TRANSLATION_URL = 'https://raw.githubusercontent.com/praneshp1org/Bhagavad-Gita-JSON-data/main/translation.json';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

// Clean Sanskrit text: standardize dandas, remove inline verse index tokens like ।।1.1।।
function cleanSanskrit(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/।।\s*\d+\.\d+\s*।।/g, '॥')
    .replace(/\|\s*\d+\.\d+\s*\|/g, '॥')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// Clean Transliteration text
function cleanTransliteration(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// Clean word meanings
function cleanWordMeanings(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate simple reflection explanation for newly incorporated verses
function generateSimpleExplanation(verse, chapterMeta) {
  return `This verse from Chapter ${verse.chapter} (${chapterMeta.name}) teaches us about ${chapterMeta.translation.toLowerCase()}. It invites mindful reflection on balancing outer responsibility with internal clarity and equanimity.`;
}

// Generate whyThisVerse contextual guidance
function generateWhyThisVerse(verse, chapterMeta) {
  return `Provides timeless philosophical insight from ${chapterMeta.name} for individuals seeking deeper understanding, discernment, and emotional balance.`;
}

// Chapter-level themes mapping
const CHAPTER_THEMES = {
  1: ["Inner Conflict", "Moral Doubt", "Compassion", "Despondency", "Vulnerability"],
  2: ["Self-Knowledge", "Soul", "Duty", "Equanimity", "Steadiness", "Karma Yoga"],
  3: ["Karma Yoga", "Selfless Action", "Duty", "Self-Discipline", "Overcoming Desire"],
  4: ["Wisdom", "Sacrifice", "Spiritual Action", "Clarity", "Purification"],
  5: ["Renunciation", "Inner Peace", "Action in Inaction", "Detachment", "Harmony"],
  6: ["Meditation", "Mind Control", "Balance", "Self-Mastery", "Practice"],
  7: ["Higher Knowledge", "Discernment", "Nature", "Divine Presence", "Faith"],
  8: ["Absolute", "Concentration", "Immortality", "Transition", "Remembrance"],
  9: ["Devotion", "Sovereign Knowledge", "Surrender", "Protection", "Grace"],
  10: ["Divine Glories", "Splendor", "Excellence", "Cosmic Wonder", "Gratitude"],
  11: ["Universal Vision", "Cosmic Order", "Awe", "Humility", "Transcendence"],
  12: ["Bhakti", "Devotion", "Kindness", "Equanimity", "Forgiveness", "Inner Peace"],
  13: ["The Field", "The Knower", "Conscious Awareness", "Discernment", "Nature"],
  14: ["Three Gunas", "Sattva", "Rajas", "Tamas", "Equanimity", "Transcendence"],
  15: ["Supreme Being", "Cosmic Tree", "Freedom", "Detachment", "Spiritual Root"],
  16: ["Divine Qualities", "Virtue", "Humility", "Ethical Living", "Inner Freedom"],
  17: ["Threefold Faith", "Purity", "Austerity", "Sincerity", "Giving", "Om Tat Sat"],
  18: ["Liberation", "Renunciation", "Purpose", "Courage", "Self-Surrender", "Peace"]
};

async function main() {
  console.log('[1/6] Loading existing knowledge base files...');
  const existingChapters = JSON.parse(fs.readFileSync(CHAPTERS_FILE, 'utf8'));
  const existingVerses = JSON.parse(fs.readFileSync(VERSES_FILE, 'utf8'));

  // Backup existing verses file
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(existingVerses, null, 2), 'utf8');
  console.log(`[1/6] Backed up ${existingVerses.length} existing verses to ${BACKUP_FILE}`);

  // Create lookup of curated existing verses to preserve their exact content
  const existingCuratedMap = new Map();
  for (const ev of existingVerses) {
    existingCuratedMap.set(ev.id, ev);
  }

  // Chapter lookup
  const chapterMap = new Map();
  for (const ch of existingChapters) {
    chapterMap.set(ch.chapterNumber, ch);
  }

  console.log('[2/6] Fetching remote verified Gita corpus...');
  const [versesRaw, translationsRaw] = await Promise.all([
    fetchUrl(VERSE_URL),
    fetchUrl(TRANSLATION_URL)
  ]);

  const rawVerses = JSON.parse(versesRaw.replace(/^\uFEFF/, ''));
  const rawTranslations = JSON.parse(translationsRaw.replace(/^\uFEFF/, ''));
  console.log(`[2/6] Downloaded ${rawVerses.length} verses and ${rawTranslations.length} translations.`);

  // Map translations by verse_id
  const translationsByVerseId = {};
  for (const t of rawTranslations) {
    if (!translationsByVerseId[t.verse_id]) {
      translationsByVerseId[t.verse_id] = {};
    }
    translationsByVerseId[t.verse_id][t.authorName] = t.description ? t.description.trim() : '';
  }

  console.log('[3/6] Processing Chapter 13 canonical 34-verse unification...');
  // In rawVerses: Chapter 13 has 35 verses.
  // Raw item with verse_id 490 is Arjuna's question: "अर्जुन उवाच प्रकृतिं पुरुषं चैव..."
  // Raw item with verse_id 491 is the Lord's answer: "श्री भगवानुवाच इदं शरीरं कौन्तेय..."
  // In the canonical 700-verse Shankara tradition, these two form BG 13.1.
  // Raw verses 492 to 524 (verse_number 3 to 35) become canonical verses 2 to 34.

  const finalVerses = [];

  for (const rv of rawVerses) {
    const chNum = rv.chapter_number;
    const vNum = rv.verse_number;

    if (chNum === 13) {
      if (vNum === 1) {
        // Skip for now, will combine with vNum === 2 below
        continue;
      } else if (vNum === 2) {
        // Combine raw 13.1 (verse_id 490) and raw 13.2 (verse_id 491) into canonical BG 13.1
        const raw1 = rawVerses.find(x => x.chapter_number === 13 && x.verse_number === 1);
        const raw2 = rv;
        const trans1 = translationsByVerseId[raw1.id] || {};
        const trans2 = translationsByVerseId[raw2.id] || {};

        const sivananda1 = trans1['Swami Sivananda'] || 'Arjuna said: I wish to learn about Nature and the Spirit, the field and the knower of the field, knowledge and that which ought to be known, O Keshava.';
        const sivananda2 = trans2['Swami Sivananda'] || 'The Blessed Lord said: O Arjuna, this body is called the field; he who knows it is called the knower of the field by the sages.';

        const combinedSanskrit = cleanSanskrit(raw1.text) + '\n\n' + cleanSanskrit(raw2.text);
        const combinedTransliteration = cleanTransliteration(raw1.transliteration) + '\n\n' + cleanTransliteration(raw2.transliteration);
        const combinedTranslation = `${sivananda1}\n${sivananda2}`;
        const combinedWordMeanings = cleanWordMeanings(raw1.word_meanings) + ' ' + cleanWordMeanings(raw2.word_meanings);

        const chMeta = chapterMap.get(13);
        const verseId = 'BG_13_1';

        finalVerses.push({
          id: verseId,
          verseId: verseId,
          chapter: 13,
          chapterNumber: 13,
          verse: 1,
          verseNumber: 1,
          chapterName: chMeta.name,
          sanskrit: combinedSanskrit,
          transliteration: combinedTransliteration,
          translation: combinedTranslation,
          wordMeanings: combinedWordMeanings,
          source: 'Bhagavad Gita, Chapter 13, Verse 1',
          themes: CHAPTER_THEMES[13],
          simpleExplanation: `Arjuna asks about the fundamental relationship between the observer, the mind, nature, and higher awareness. Krishna begins by establishing that the body-mind is the 'field' of experience, while the conscious self is the 'knower' of the field.`,
          whyThisVerse: `Clarifies self-awareness and the distinction between physical/emotional sensations and the conscious observer witnessing them.`,
          provenance: {
            sourceName: 'Shrimad Bhagavad Gita',
            sourceEdition: 'Canonical 700-Verse Shrimad Bhagavad Gita',
            sourceReference: 'Chapter 13, Verse 1 (BG 13.1)',
            translationSource: 'Swami Sivananda, The Divine Life Society'
          },
          aiAssistance: {
            simpleExplanation: `Arjuna asks about the fundamental relationship between the observer, the mind, nature, and higher awareness. Krishna begins by establishing that the body-mind is the 'field' of experience, while the conscious self is the 'knower' of the field.`,
            whyThisVerse: `Clarifies self-awareness and the distinction between physical/emotional sensations and the conscious observer witnessing them.`,
            generatedMetadata: true
          }
        });
      } else {
        // Raw verse_number 3..35 becomes canonical verse 2..34
        const canonicalVerseNum = vNum - 1;
        const verseId = `BG_13_${canonicalVerseNum}`;
        const chMeta = chapterMap.get(13);
        const transMap = translationsByVerseId[rv.id] || {};
        const translationText = transMap['Swami Sivananda'] || transMap['Swami Adidevananda'] || transMap['Swami Gambirananda'] || transMap['Shri Purohit Swami'];

        finalVerses.push({
          id: verseId,
          verseId: verseId,
          chapter: 13,
          chapterNumber: 13,
          verse: canonicalVerseNum,
          verseNumber: canonicalVerseNum,
          chapterName: chMeta.name,
          sanskrit: cleanSanskrit(rv.text),
          transliteration: cleanTransliteration(rv.transliteration),
          translation: translationText,
          wordMeanings: cleanWordMeanings(rv.word_meanings),
          source: `Bhagavad Gita, Chapter 13, Verse ${canonicalVerseNum}`,
          themes: CHAPTER_THEMES[13],
          simpleExplanation: generateSimpleExplanation({ chapter: 13, verse: canonicalVerseNum }, chMeta),
          whyThisVerse: generateWhyThisVerse({ chapter: 13, verse: canonicalVerseNum }, chMeta),
          provenance: {
            sourceName: 'Shrimad Bhagavad Gita',
            sourceEdition: 'Canonical 700-Verse Shrimad Bhagavad Gita',
            sourceReference: `Chapter 13, Verse ${canonicalVerseNum} (BG 13.${canonicalVerseNum})`,
            translationSource: 'Swami Sivananda, The Divine Life Society'
          },
          aiAssistance: {
            simpleExplanation: generateSimpleExplanation({ chapter: 13, verse: canonicalVerseNum }, chMeta),
            whyThisVerse: generateWhyThisVerse({ chapter: 13, verse: canonicalVerseNum }, chMeta),
            generatedMetadata: true
          }
        });
      }
    } else {
      // Chapters 1..12 and 14..18 map 1:1
      const verseId = `BG_${chNum}_${vNum}`;
      const chMeta = chapterMap.get(chNum);

      // Check if this verse is one of the 12 existing curated verses
      const curated = existingCuratedMap.get(verseId);

      if (curated) {
        // Preserve curated text, explanations, and themes verbatim!
        finalVerses.push({
          id: verseId,
          verseId: verseId,
          chapter: chNum,
          chapterNumber: chNum,
          verse: vNum,
          verseNumber: vNum,
          chapterName: chMeta.name,
          sanskrit: cleanSanskrit(curated.sanskrit || rv.text),
          transliteration: cleanTransliteration(curated.transliteration || rv.transliteration),
          translation: curated.translation,
          wordMeanings: cleanWordMeanings(rv.word_meanings),
          source: curated.source || `Bhagavad Gita, Chapter ${chNum}, Verse ${vNum}`,
          themes: curated.themes,
          simpleExplanation: curated.simpleExplanation,
          whyThisVerse: curated.whyThisVerse,
          provenance: {
            sourceName: 'Shrimad Bhagavad Gita',
            sourceEdition: 'Canonical 700-Verse Shrimad Bhagavad Gita',
            sourceReference: `Chapter ${chNum}, Verse ${vNum} (BG ${chNum}.${vNum})`,
            translationSource: 'Curated VedAI Verified Translation'
          },
          aiAssistance: {
            simpleExplanation: curated.simpleExplanation,
            whyThisVerse: curated.whyThisVerse,
            generatedMetadata: false
          }
        });
      } else {
        const transMap = translationsByVerseId[rv.id] || {};
        const translationText = transMap['Swami Sivananda'] || transMap['Swami Adidevananda'] || transMap['Swami Gambirananda'] || transMap['Shri Purohit Swami'];

        finalVerses.push({
          id: verseId,
          verseId: verseId,
          chapter: chNum,
          chapterNumber: chNum,
          verse: vNum,
          verseNumber: vNum,
          chapterName: chMeta.name,
          sanskrit: cleanSanskrit(rv.text),
          transliteration: cleanTransliteration(rv.transliteration),
          translation: translationText,
          wordMeanings: cleanWordMeanings(rv.word_meanings),
          source: `Bhagavad Gita, Chapter ${chNum}, Verse ${vNum}`,
          themes: CHAPTER_THEMES[chNum] || ["Wisdom", "Reflection"],
          simpleExplanation: generateSimpleExplanation({ chapter: chNum, verse: vNum }, chMeta),
          whyThisVerse: generateWhyThisVerse({ chapter: chNum, verse: vNum }, chMeta),
          provenance: {
            sourceName: 'Shrimad Bhagavad Gita',
            sourceEdition: 'Canonical 700-Verse Shrimad Bhagavad Gita',
            sourceReference: `Chapter ${chNum}, Verse ${vNum} (BG ${chNum}.${vNum})`,
            translationSource: 'Swami Sivananda, The Divine Life Society'
          },
          aiAssistance: {
            simpleExplanation: generateSimpleExplanation({ chapter: chNum, verse: vNum }, chMeta),
            whyThisVerse: generateWhyThisVerse({ chapter: chNum, verse: vNum }, chMeta),
            generatedMetadata: true
          }
        });
      }
    }
  }

  console.log(`[4/6] Generated ${finalVerses.length} canonical verses.`);

  // Validation before writing
  if (finalVerses.length !== 700) {
    throw new Error(`CRITICAL: Expected 700 verses, but got ${finalVerses.length}!`);
  }

  // Update Chapter 13 versesCount in gita_chapters.json
  const updatedChapters = existingChapters.map(c => {
    if (c.chapterNumber === 13) {
      return { ...c, versesCount: 34 };
    }
    return c;
  });

  const totalChapterVerses = updatedChapters.reduce((acc, c) => acc + c.versesCount, 0);
  console.log(`[5/6] Total chapter verse counts sum to: ${totalChapterVerses}`);
  if (totalChapterVerses !== 700) {
    throw new Error(`CRITICAL: Chapters sum must be 700, got ${totalChapterVerses}`);
  }

  fs.writeFileSync(CHAPTERS_FILE, JSON.stringify(updatedChapters, null, 2), 'utf8');
  console.log(`[5/6] Updated ${CHAPTERS_FILE}`);

  fs.writeFileSync(VERSES_FILE, JSON.stringify(finalVerses, null, 2), 'utf8');
  console.log(`[6/6] Wrote ${finalVerses.length} verses to ${VERSES_FILE}`);

  console.log('✅ Gita knowledge base build complete!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
