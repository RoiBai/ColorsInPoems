import path from 'node:path';
import { DATA_DIR, PUBLIC_DATA_DIR, readJson, writeJson } from './utils.js';
import { toSimplified } from './zh-convert.js';

const certaintyValues = new Set(['exact', 'estimated', 'range', 'stage', 'unknown']);

function textKey(value = '') {
  return toSimplified(String(value))
    .replace(/[·・\s《》〈〉「」『』，,。！？!?；;：:]/g, '')
    .replace(/[臺台]/g, '台')
    .replace(/[辭辞]/g, '辞')
    .replace(/[將将]/g, '将')
    .replace(/[歸归]/g, '归')
    .replace(/[鶴鹤]/g, '鹤')
    .replace(/[黃黄]/g, '黄')
    .replace(/[靑青]/g, '青')
    .toLowerCase();
}

function findStage(bio, stageId) {
  return bio?.stages?.find((stage) => stage.stage_id === stageId) || null;
}

function normalizeOverride(override) {
  if (!certaintyValues.has(override.date_certainty)) {
    throw new Error(`invalid date_certainty in override: ${override.author}/${override.title}`);
  }
  return override;
}

async function main() {
  const poems = await readJson(path.join(PUBLIC_DATA_DIR, 'poems.json'), []);
  const biographyFile = await readJson(path.join(PUBLIC_DATA_DIR, 'poet_biographies.json'), { poets: [] });
  const overrides = (await readJson(path.join(DATA_DIR, 'poem_time_overrides.seed.json'), [])).map(normalizeOverride);
  const bioByName = new Map(biographyFile.poets.map((poet) => [poet.name, poet]));
  const overrideByExactKey = new Map(overrides.map((item) => [`${item.author}|${textKey(item.title)}`, item]));

  const timedPoems = poems.map((poem) => {
    const bio = bioByName.get(poem.author);
    const override = overrideByExactKey.get(`${poem.author}|${textKey(poem.title)}`);
    const stage = override ? findStage(bio, override.life_stage_id) : null;
    const year = override?.year ?? null;
    const yearRange = override?.year_range ?? (year ? [year, year] : null);
    const dateCertainty = override?.date_certainty || 'unknown';
    return {
      ...poem,
      year,
      year_range: yearRange,
      date_certainty: dateCertainty,
      life_stage_id: override?.life_stage_id || null,
      life_stage_label: stage?.label || null,
      time_source_ref: override?.source_ref || '无可用定年 seed；未强行推断具体年份或阶段。',
    };
  });

  await writeJson(path.join(PUBLIC_DATA_DIR, 'poems_timed.json'), timedPoems);
  const dated = timedPoems.filter((poem) => poem.date_certainty !== 'unknown').length;
  console.log(`timed poems written: ${timedPoems.length}, dated/staged: ${dated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
