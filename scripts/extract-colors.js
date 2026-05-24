import path from 'node:path';
import { DATA_DIR, PUBLIC_DATA_DIR, readJson, stableId, writeJson } from './utils.js';

function buildLexicon(entries) {
  const tokens = [];
  for (const entry of entries) {
    const words = [entry.color_word, ...(entry.aliases || [])].filter(Boolean);
    for (const word of words) {
      tokens.push({ word, entry });
    }
  }
  tokens.sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word, 'zh-Hans-CN'));
  return tokens;
}

function findMatches(text, lexicon) {
  const matches = [];
  let index = 0;
  while (index < text.length) {
    const hit = lexicon.find((item) => text.startsWith(item.word, index));
    if (hit) {
      const start = index;
      const end = index + hit.word.length;
      matches.push({ hit, start, end });
      index = end;
    } else {
      index += 1;
    }
  }
  return matches;
}

function occurrenceFromMatch(poem, lineText, sourcePosition, match, order) {
  const entry = match.hit.entry;
  const colorWord = match.hit.word;
  const before = lineText.slice(Math.max(0, match.start - 8), match.start);
  const after = lineText.slice(match.end, Math.min(lineText.length, match.end + 8));
  const ambiguity = colorWord.length === 1 || /多义|不一定|需|可能/.test(entry.ambiguity_note || '');
  return {
    occurrence_id: `color_${stableId(poem.poem_id, sourcePosition, lineText, colorWord, String(match.start), String(order))}`,
    poem_id: poem.poem_id,
    title: poem.title,
    author: poem.author,
    dynasty: poem.dynasty,
    line_text: lineText,
    color_word: colorWord,
    normalized_color: entry.normalized_name,
    color_group: entry.color_group,
    hex: entry.hex,
    start_index: match.start,
    end_index: match.end,
    source_position: sourcePosition,
    context_before: before,
    context_after: after,
    ambiguity_flag: ambiguity,
  };
}

async function main() {
  const poems = await readJson(path.join(PUBLIC_DATA_DIR, 'poems.json'), []);
  const colorEntries = await readJson(path.join(DATA_DIR, 'color_lexicon.json'), []);
  const lexicon = buildLexicon(colorEntries);
  const occurrences = [];

  for (const poem of poems) {
    let order = 0;
    for (const match of findMatches(poem.title, lexicon)) {
      occurrences.push(occurrenceFromMatch(poem, poem.title, 'title', match, order));
      order += 1;
    }
    for (const line of poem.lines) {
      for (const match of findMatches(line, lexicon)) {
        occurrences.push(occurrenceFromMatch(poem, line, 'line', match, order));
        order += 1;
      }
    }
  }

  await writeJson(path.join(PUBLIC_DATA_DIR, 'color_occurrences.json'), occurrences);
  console.log(`color occurrences: ${occurrences.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
