import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DATA_DIR,
  RAW_DIR,
  PUBLIC_DATA_DIR,
  cleanText,
  ensureDir,
  normalizeDynasty,
  splitLines,
  stableId,
  readJson,
  writeJson,
} from './utils.js';

function sourceIdFromFile(fileName) {
  if (fileName.includes('seed_public_domain')) return 'seed_public_domain';
  if (fileName.includes('tang')) return fileName.replace('.json', '');
  if (fileName.includes('song')) return fileName.replace('.json', '');
  return fileName.replace('.json', '');
}

function inferDynasty(fileName, entry) {
  if (entry.dynasty) return normalizeDynasty(entry.dynasty);
  if (/tang/i.test(fileName)) return '唐';
  if (/song/i.test(fileName)) return '宋';
  return normalizeDynasty(`${entry.author || ''}${entry.source_ref || ''}`);
}

function normalizeEntry(entry, fileName, index) {
  const paragraphs = entry.paragraphs || entry.paragraph || entry.content || [];
  const paragraphArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  const content = paragraphArray.map(cleanText).filter(Boolean).join('\n');
  const title = cleanText(entry.title || entry.rhythmic || '无题');
  const author = cleanText(entry.author || entry.poet || '佚名');
  const dynasty = inferDynasty(fileName, entry);
  const lines = splitLines(content);
  if (!content || !lines.length) return null;
  const source_id = sourceIdFromFile(fileName);
  const poem_id = `poem_${stableId(source_id, title, author, content, String(index))}`;
  return {
    poem_id,
    title,
    author,
    dynasty,
    content,
    lines,
    source_id,
    source_ref: entry.source_ref || entry.id || `${fileName}#${index}`,
  };
}

async function main() {
  await ensureDir(PUBLIC_DATA_DIR);
  const manifest = await readJson(path.join(DATA_DIR, 'source_manifest.json'), []);
  const files = manifest.flatMap((source) => source.file_paths || []).map((filePath) => path.basename(filePath)).filter((file) => file.endsWith('.json'));
  const poems = [];
  const seen = new Set();

  for (const fileName of files) {
    const raw = JSON.parse(await fs.readFile(path.join(RAW_DIR, fileName), 'utf8'));
    const entries = Array.isArray(raw) ? raw : raw.poems || raw.data || [];
    entries.forEach((entry, index) => {
      const poem = normalizeEntry(entry, fileName, index);
      if (!poem) return;
      const duplicateKey = `${poem.author}|${poem.title}|${poem.content}`;
      if (seen.has(duplicateKey)) return;
      seen.add(duplicateKey);
      poems.push(poem);
    });
  }

  poems.sort((a, b) => a.dynasty.localeCompare(b.dynasty, 'zh-Hans-CN') || a.author.localeCompare(b.author, 'zh-Hans-CN'));
  await writeJson(path.join(PUBLIC_DATA_DIR, 'poems.json'), poems);
  console.log(`normalized poems: ${poems.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
