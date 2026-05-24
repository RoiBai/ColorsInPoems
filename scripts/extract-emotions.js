import path from 'node:path';
import { PUBLIC_DATA_DIR, readJson, stableId, writeJson } from './utils.js';

const emotionRules = [
  ['思乡', ['乡', '故园', '归', '客', '梦', '故人', '天涯']],
  ['离愁', ['别', '离', '送', '远', '断肠', '恨', '愁']],
  ['孤独', ['独', '孤', '寂', '冷', '寒', '空']],
  ['忧郁', ['泪', '凄', '惨', '黯', '残', '悲']],
  ['壮美', ['山河', '关', '塞', '天', '万里', '长风', '大江', '瀑布']],
  ['喜庆', ['喜', '乐', '春', '花', '酒', '宴', '笑']],
  ['禅意', ['禅', '僧', '寺', '钟', '空', '静']],
  ['爱国', ['国', '家书', '山河', '将军', '沙场', '故国']],
  ['怀古', ['古', '千古', '秦汉', '宫阙', '英雄', '往事']],
  ['自然', ['山', '水', '云', '月', '风', '雨', '花', '草', '鸟']],
  ['清新', ['清', '新', '晴', '翠', '碧', '绿', '晓']],
  ['相思', ['相思', '伊人', '君', '梦', '月', '无题']],
  ['高洁', ['白', '素', '清白', '竹', '松', '霜', '雪']],
  ['柔美', ['桃', '柳', '胭脂', '红', '美人', '佳人']],
  ['豪放', ['酒', '剑', '长风', '大江', '金樽', '豪杰']],
  ['悲凉', ['秋', '寒', '断肠', '黄昏', '白发', '西风']]
];

async function main() {
  const poems = await readJson(path.join(PUBLIC_DATA_DIR, 'poems.json'), []);
  const emotionOccurrences = [];
  for (const poem of poems) {
    for (const line of poem.lines) {
      for (const [emotion, keywords] of emotionRules) {
        const matched = keywords.filter((word) => line.includes(word) || poem.title.includes(word));
        if (!matched.length) continue;
        emotionOccurrences.push({
          occurrence_id: `emotion_${stableId(poem.poem_id, line, emotion)}`,
          poem_id: poem.poem_id,
          line_text: line,
          emotion_tag: emotion,
          confidence: Math.min(1, 0.45 + matched.length * 0.18),
          matched_keywords: matched,
        });
      }
    }
  }
  await writeJson(path.join(PUBLIC_DATA_DIR, 'emotion_occurrences.json'), emotionOccurrences);
  console.log(`emotion occurrences: ${emotionOccurrences.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
