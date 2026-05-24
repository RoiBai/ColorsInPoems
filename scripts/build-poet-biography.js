import path from 'node:path';
import { DATA_DIR, PUBLIC_DATA_DIR, readJson, writeJson } from './utils.js';

function validatePoet(poet) {
  const required = ['poet_id', 'name', 'dynasty', 'stages', 'events'];
  for (const field of required) {
    if (!(field in poet)) throw new Error(`poet biography missing field ${field}: ${poet.name || poet.poet_id}`);
  }
  for (const stage of poet.stages) {
    const stageFields = ['stage_id', 'label', 'start_year', 'end_year', 'type', 'description', 'source_ref'];
    for (const field of stageFields) {
      if (!(field in stage)) throw new Error(`stage missing field ${field}: ${poet.name}/${stage.label || stage.stage_id}`);
    }
    if (stage.start_year > stage.end_year) throw new Error(`stage start_year > end_year: ${poet.name}/${stage.label}`);
  }
  for (const event of poet.events) {
    const eventFields = ['event_id', 'label', 'year', 'type', 'description', 'source_ref'];
    for (const field of eventFields) {
      if (!(field in event)) throw new Error(`event missing field ${field}: ${poet.name}/${event.label || event.event_id}`);
    }
  }
}

async function main() {
  const seed = await readJson(path.join(DATA_DIR, 'poet_biographies.seed.json'), { poets: [] });
  if (!Array.isArray(seed.poets)) throw new Error('poet_biographies.seed.json must contain a poets array');
  seed.poets.forEach(validatePoet);
  const output = {
    generated_at: new Date().toISOString(),
    note: '生平阶段为研究型 seed 数据，source_ref 保留人工校订说明；正式论文使用前应据专门年谱复核。',
    poets: seed.poets,
  };
  await writeJson(path.join(PUBLIC_DATA_DIR, 'poet_biographies.json'), output);
  console.log(`poet biographies written: ${seed.poets.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
