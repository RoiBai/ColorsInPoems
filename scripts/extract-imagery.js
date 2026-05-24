import path from 'node:path';
import { PUBLIC_DATA_DIR, readJson, stableId, writeJson } from './utils.js';

const imageryRules = [
  ['自然', ['山', '水', '江', '河', '海', '云', '月', '日', '星', '风', '雨', '雪', '霜', '露', '烟', '霞', '天']],
  ['植物', ['花', '柳', '梅', '桃', '竹', '松', '草', '荷', '菊', '兰', '枫', '桑', '梧桐', '桂']],
  ['动物', ['鸟', '雁', '鹤', '马', '鱼', '莺', '燕', '猿', '蝉', '鹂', '鸦', '鸭']],
  ['季节', ['春', '夏', '秋', '冬', '暮春', '寒', '晚秋']],
  ['人物', ['美人', '佳人', '君', '客', '故人', '将军', '游子', '伊人', '王孙']],
  ['器物', ['酒', '杯', '灯', '镜', '琴', '剑', '舟', '帘', '衣', '袍', '樽']],
  ['空间', ['楼', '台', '宫', '城', '关', '塞', '庭', '院', '窗', '门', '寺']],
  ['时间', ['夜', '晓', '夕', '暮', '晨', '年', '岁', '朝', '古']]
];

function findImagery(line, colorStart, colorEnd) {
  const nearStart = Math.max(0, colorStart - 8);
  const nearEnd = Math.min(line.length, colorEnd + 8);
  const near = line.slice(nearStart, nearEnd);
  const results = [];

  for (const [category, words] of imageryRules) {
    for (const word of words) {
      const nearIndex = near.indexOf(word);
      const wholeIndex = line.indexOf(word);
      const index = nearIndex >= 0 ? nearStart + nearIndex : wholeIndex;
      if (index >= 0) {
        const distance = index >= colorEnd ? index - colorEnd : colorStart - (index + word.length);
        results.push({
          imagery_word: word,
          imagery_category: category,
          distance_to_color: Math.max(0, distance),
          priority: nearIndex >= 0 ? 0 : 1,
        });
      }
    }
  }

  const seen = new Set();
  return results
    .sort((a, b) => a.priority - b.priority || a.distance_to_color - b.distance_to_color || b.imagery_word.length - a.imagery_word.length)
    .filter((item) => {
      const key = `${item.imagery_category}:${item.imagery_word}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

async function main() {
  const colorOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'color_occurrences.json'), []);
  const imageryOccurrences = [];
  for (const colorOccurrence of colorOccurrences) {
    const hits = findImagery(colorOccurrence.line_text, colorOccurrence.start_index, colorOccurrence.end_index);
    hits.forEach((hit, index) => {
      imageryOccurrences.push({
        occurrence_id: `imagery_${stableId(colorOccurrence.occurrence_id, hit.imagery_word, String(index))}`,
        color_occurrence_id: colorOccurrence.occurrence_id,
        poem_id: colorOccurrence.poem_id,
        imagery_word: hit.imagery_word,
        imagery_category: hit.imagery_category,
        distance_to_color: hit.distance_to_color,
      });
    });
  }
  await writeJson(path.join(PUBLIC_DATA_DIR, 'imagery_occurrences.json'), imageryOccurrences);
  console.log(`imagery occurrences: ${imageryOccurrences.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
