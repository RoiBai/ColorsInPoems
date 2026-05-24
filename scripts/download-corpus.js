import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, RAW_DIR, ROOT, ensureDir, writeJson } from './utils.js';

const now = new Date().toISOString();
const seedPath = path.join(ROOT, 'data', 'seed', 'seed_poems.json');

const remoteSources = [
  {
    source_id: 'chinese_poetry_tang_0',
    source_name: 'chinese-poetry 全唐诗样本 0',
    url: 'https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.0.json',
    license: 'MIT License, chinese-poetry/chinese-poetry',
    dynasty_coverage: ['唐'],
    file_name: 'chinese_poetry_tang_0.json',
  },
  {
    source_id: 'chinese_poetry_tang_1000',
    source_name: 'chinese-poetry 全唐诗样本 1000',
    url: 'https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.tang.1000.json',
    license: 'MIT License, chinese-poetry/chinese-poetry',
    dynasty_coverage: ['唐'],
    file_name: 'chinese_poetry_tang_1000.json',
  },
  {
    source_id: 'chinese_poetry_song_0',
    source_name: 'chinese-poetry 宋诗样本 0',
    url: 'https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/%E5%85%A8%E5%94%90%E8%AF%97/poet.song.0.json',
    license: 'MIT License, chinese-poetry/chinese-poetry',
    dynasty_coverage: ['宋'],
    file_name: 'chinese_poetry_song_0.json',
  },
  {
    source_id: 'chinese_poetry_ci_song_0',
    source_name: 'chinese-poetry 宋词样本 0',
    url: 'https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/%E5%AE%8B%E8%AF%8D/ci.song.0.json',
    license: 'MIT License, chinese-poetry/chinese-poetry',
    dynasty_coverage: ['宋'],
    file_name: 'chinese_poetry_ci_song_0.json',
  },
];

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await ensureDir(RAW_DIR);
  const manifest = [];

  for (const source of remoteSources) {
    const filePath = path.join(RAW_DIR, source.file_name);
    try {
      const text = await fetchText(source.url);
      JSON.parse(text);
      await fs.writeFile(filePath, text, 'utf8');
      manifest.push({
        source_id: source.source_id,
        source_name: source.source_name,
        url: source.url,
        license: source.license,
        dynasty_coverage: source.dynasty_coverage,
        downloaded_at: now,
        file_paths: [path.relative(ROOT, filePath).replaceAll('\\', '/')],
      });
      console.log(`downloaded ${source.source_id}`);
    } catch (error) {
      try {
        const cachedText = await fs.readFile(filePath, 'utf8');
        JSON.parse(cachedText);
        manifest.push({
          source_id: source.source_id,
          source_name: source.source_name,
          url: source.url,
          license: source.license,
          dynasty_coverage: source.dynasty_coverage,
          downloaded_at: now,
          cached: true,
          cache_note: `Network download failed (${error.message}); reused existing data/raw cache.`,
          file_paths: [path.relative(ROOT, filePath).replaceAll('\\', '/')],
        });
        console.warn(`cached ${source.source_id}: ${error.message}`);
      } catch {
        console.warn(`skip ${source.source_id}: ${error.message}`);
      }
    }
  }

  const seedRawPath = path.join(RAW_DIR, 'seed_public_domain.json');
  await fs.copyFile(seedPath, seedRawPath);
  manifest.push({
    source_id: 'seed_public_domain',
    source_name: '公版古典诗词离线种子语料',
    url: 'local:data/seed/seed_poems.json',
    license: 'Public domain classical texts; curated for reproducible offline demos',
    dynasty_coverage: ['先秦', '汉', '魏晋', '南北朝', '唐', '五代', '宋', '元', '明', '清'],
    downloaded_at: now,
    file_paths: [path.relative(ROOT, seedRawPath).replaceAll('\\', '/')],
  });

  await writeJson(path.join(DATA_DIR, 'source_manifest.json'), manifest);
  await writeJson(path.join(ROOT, 'public', 'data', 'source_manifest.json'), manifest);
  console.log(`source manifest written: ${manifest.length} source(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
