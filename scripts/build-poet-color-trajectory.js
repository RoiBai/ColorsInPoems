import path from 'node:path';
import {
  DATA_DIR,
  PUBLIC_DATA_DIR,
  STATS_DIR,
  increment,
  readJson,
  sampleUnique,
  topN,
  writeJson,
} from './utils.js';

const extraEmotionRules = [
  ['旷达', ['放', '笑', '何妨', '归去', '任', '悠然', '得意']],
  ['闲适', ['闲', '悠然', '清泉', '田园', '归隐', '睡', '小舟']],
];

const sceneRules = [
  ['山水', ['山', '水', '溪', '泉', '瀑布', '峰']],
  ['月夜', ['月', '夜', '明月', '月光']],
  ['江河', ['江', '河', '湖', '海', '潮', '浪']],
  ['春景', ['春', '花', '柳', '桃', '莺', '燕']],
  ['秋景', ['秋', '枫', '霜', '落木', '西风']],
  ['风雨', ['风', '雨', '阴', '雷']],
  ['雪霜', ['雪', '霜', '寒', '冰']],
  ['酒宴', ['酒', '杯', '樽', '宴', '醉']],
  ['送别', ['送', '别', '离', '远']],
  ['边塞', ['关', '塞', '沙场', '胡', '戍']],
  ['宫廷', ['宫', '阙', '金门', '朱门', '长安']],
  ['田园', ['田', '园', '草', '桑', '竹', '松']],
  ['旅途', ['客', '舟', '马', '道', '行', '天涯']],
  ['归隐', ['归', '隐', '庐', '闲', '山居']],
  ['贬谪', ['谪', '贬', '黄州', '惠州', '儋州']],
  ['怀古', ['古', '千古', '赤壁', '秦汉', '故国']],
];

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function countDistinct(items, keyFn) {
  return new Set(items.map(keyFn)).size;
}

function charCount(poems) {
  return poems.reduce((sum, poem) => sum + String(poem.content || '').replace(/\s/g, '').length, 0);
}

function colorKey(occurrence) {
  return `${occurrence.normalized_color}|${occurrence.color_group}|${occurrence.hex}`;
}

function compactLine(occurrence, poem) {
  return {
    poem_id: occurrence.poem_id,
    title: occurrence.title,
    author: occurrence.author,
    dynasty: occurrence.dynasty,
    line_text: occurrence.line_text,
    year: poem?.year ?? null,
    year_range: poem?.year_range ?? null,
    date_certainty: poem?.date_certainty || 'unknown',
    source_ref: poem?.time_source_ref || '未记录定年来源。',
  };
}

function inferExtraEmotions(line) {
  return extraEmotionRules
    .filter(([, words]) => words.some((word) => line.includes(word)))
    .map(([emotion]) => ({ emotion_tag: emotion, confidence: 0.55, matched_keywords: [] }));
}

function inferScenes(line, imageries) {
  const labels = new Set();
  for (const imagery of imageries) {
    if (imagery.imagery_category === '自然') {
      if (['山', '水', '溪', '泉'].includes(imagery.imagery_word)) labels.add('山水');
      if (['月'].includes(imagery.imagery_word)) labels.add('月夜');
      if (['江', '河', '海'].includes(imagery.imagery_word)) labels.add('江河');
      if (['风', '雨'].includes(imagery.imagery_word)) labels.add('风雨');
      if (['雪', '霜'].includes(imagery.imagery_word)) labels.add('雪霜');
    }
    if (imagery.imagery_category === '季节') {
      if (imagery.imagery_word.includes('春')) labels.add('春景');
      if (imagery.imagery_word.includes('秋')) labels.add('秋景');
    }
    if (imagery.imagery_category === '器物' && ['酒', '杯', '樽'].includes(imagery.imagery_word)) labels.add('酒宴');
    if (imagery.imagery_category === '空间' && ['宫', '城', '关', '塞'].includes(imagery.imagery_word)) {
      labels.add(['关', '塞'].includes(imagery.imagery_word) ? '边塞' : '宫廷');
    }
  }
  for (const [scene, words] of sceneRules) {
    if (words.some((word) => line.includes(word))) labels.add(scene);
  }
  return [...labels];
}

function certaintyMix(poems) {
  const mix = { exact: 0, estimated: 0, range: 0, stage: 0, unknown: 0 };
  poems.forEach((poem) => {
    mix[poem.date_certainty || 'unknown'] += 1;
  });
  return mix;
}

function dominantColors(colorRows) {
  return colorRows
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => ({ color: item.color, hex: item.hex, count: item.count, share: item.share }));
}

function changes(currentRows, previousRows) {
  const prev = new Map(previousRows.map((row) => [row.color, row.share]));
  const curr = new Map(currentRows.map((row) => [row.color, row.share]));
  const rising = [];
  const falling = [];
  const newColors = [];
  for (const row of currentRows) {
    const delta = row.share - (prev.get(row.color) || 0);
    if (!prev.has(row.color) && row.count > 0) newColors.push(row.color);
    if (delta > 0.025) rising.push({ color: row.color, delta_share: Number(delta.toFixed(4)) });
  }
  for (const row of previousRows) {
    const delta = (curr.get(row.color) || 0) - row.share;
    if (delta < -0.025) falling.push({ color: row.color, delta_share: Number(delta.toFixed(4)) });
  }
  return {
    rising_colors: rising.sort((a, b) => b.delta_share - a.delta_share).slice(0, 5),
    falling_colors: falling.sort((a, b) => a.delta_share - b.delta_share).slice(0, 5),
    new_colors: newColors.slice(0, 5),
  };
}

function generateStageInterpretation(stage) {
  if (stage.poem_count < 2 || stage.color_total < 3) {
    return {
      summary: `该阶段共收录 ${stage.poem_count} 首诗，识别出 ${stage.color_total} 次颜色词。`,
      dominantColorSentence: '该阶段可定位诗作数量较少，当前结果更适合作为探索线索，而非稳定结论。',
      changeSentence: '',
      emotionSceneSentence: '',
      caution: '该阶段样本不足，需补充更可靠的定年语料后再做文学解释。',
    };
  }
  const top = stage.dominant_colors.slice(0, 3);
  const first = top[0];
  const rising = stage.change_from_previous.rising_colors.map((item) => item.color).slice(0, 3).join('、') || '无明显上升颜色';
  const falling = stage.change_from_previous.falling_colors.map((item) => item.color).slice(0, 3).join('、') || '无明显下降颜色';
  const emotions = stage.emotions.slice(0, 3).map((item) => item.emotion).join('、') || '暂无明显情绪';
  const scenes = stage.scenes.slice(0, 3).map((item) => item.scene).join('、') || '暂无明显场景';
  const hasUncertain = stage.date_certainty_mix.range + stage.date_certainty_mix.stage + stage.date_certainty_mix.unknown > 0;
  return {
    summary: `该阶段共收录 ${stage.poem_count} 首诗，识别出 ${stage.color_total} 次颜色词。`,
    dominantColorSentence: `主导颜色为 ${top.map((item) => item.color).join('、')}，其中 ${first?.color || '无'} 占该阶段颜色词的 ${((first?.share || 0) * 100).toFixed(1)}%。`,
    changeSentence: `与上一阶段相比，${rising} 的占比上升，${falling} 的占比下降。`,
    emotionSceneSentence: `这些颜色较多与 ${scenes} 等场景，以及 ${emotions} 等情绪共同出现。`,
    caution: hasUncertain ? '该阶段包含若干未精确定年的作品，结果仅供探索。' : '该阶段诗作均有较明确时间或阶段归属。'
  };
}

function generatePoetTrajectorySummary(poet) {
  const validBins = poet.time_bins.filter((bin) => bin.color_total > 0);
  if (!validBins.length) return '当前语料中该诗人缺少可用于色彩轨迹的定年或分阶段颜色数据。';
  const colorTotals = new Map();
  validBins.forEach((bin) => bin.colors.forEach((color) => increment(colorTotals, color.color, color.count)));
  const topColors = topN(colorTotals, 5).map((item) => item.key).join('、');
  const late = validBins[validBins.length - 1];
  const lateTop = late.dominant_colors.slice(0, 3).map((item) => item.color).join('、');
  return `${poet.name} 当前可定位阶段中，高频颜色包括 ${topColors || '暂无'}。末段「${late.life_stage_label}」的主导颜色为 ${lateTop || '暂无'}；若定年样本较少，该结论应视为探索线索。`;
}

function enrichOccurrence(occurrence, poem, imageryByOccurrence, emotionsByPoemLine) {
  const imageries = imageryByOccurrence.get(occurrence.occurrence_id) || [];
  const emotionKey = `${occurrence.poem_id}|${occurrence.line_text}`;
  const emotions = [...(emotionsByPoemLine.get(emotionKey) || []), ...inferExtraEmotions(occurrence.line_text)];
  const scenes = inferScenes(occurrence.line_text, imageries);
  return { ...occurrence, poem, imageries, emotions, scenes };
}

function ambiguityFor(lexiconMap, color) {
  return lexiconMap.get(color)?.ambiguity_note || '';
}

function buildBin(poet, stage, stagePoems, occurrences, previousColors, lexiconMap) {
  const poemIds = new Set(stagePoems.map((poem) => poem.poem_id));
  const stageOccurrences = occurrences.filter((occurrence) => poemIds.has(occurrence.poem_id));
  const stageChars = charCount(stagePoems);
  const total = stageOccurrences.length;
  const colors = topN(
    stageOccurrences.reduce((map, occurrence) => {
      increment(map, colorKey(occurrence));
      return map;
    }, new Map()),
    100,
  ).map(({ key, count }) => {
    const [color, group, hex] = key.split('|');
    const related = stageOccurrences.filter((occurrence) => occurrence.normalized_color === color);
    return {
      color,
      normalized_color: color,
      color_group: group,
      hex,
      ambiguity_note: ambiguityFor(lexiconMap, color),
      count,
      per_poem: stagePoems.length ? Number((count / stagePoems.length).toFixed(3)) : 0,
      per_1000_chars: stageChars ? Number(((count / stageChars) * 1000).toFixed(3)) : 0,
      share: total ? Number((count / total).toFixed(4)) : 0,
      sample_lines: sampleUnique(related, (item) => `${item.poem_id}:${item.line_text}`, 6).map((item) => compactLine(item, item.poem)),
    };
  });

  const emotionRows = topN(
    stageOccurrences.flatMap((occurrence) => occurrence.emotions || []).reduce((map, emotion) => {
      increment(map, emotion.emotion_tag);
      return map;
    }, new Map()),
    12,
  ).map(({ key, count }) => {
    const related = stageOccurrences.filter((occurrence) => (occurrence.emotions || []).some((emotion) => emotion.emotion_tag === key));
    return {
      emotion: key,
      count,
      top_colors: topN(
        related.reduce((map, occurrence) => {
          increment(map, `${occurrence.normalized_color}|${occurrence.hex}`);
          return map;
        }, new Map()),
        5,
      ).map(({ key: colorKeyValue, count: colorCount }) => {
        const [color, hex] = colorKeyValue.split('|');
        return { color, hex, count: colorCount };
      }),
    };
  });

  const sceneRows = topN(
    stageOccurrences.flatMap((occurrence) => occurrence.scenes || []).reduce((map, scene) => {
      increment(map, scene);
      return map;
    }, new Map()),
    12,
  ).map(({ key, count }) => {
    const related = stageOccurrences.filter((occurrence) => (occurrence.scenes || []).includes(key));
    return {
      scene: key,
      count,
      top_colors: topN(
        related.reduce((map, occurrence) => {
          increment(map, `${occurrence.normalized_color}|${occurrence.hex}`);
          return map;
        }, new Map()),
        5,
      ).map(({ key: colorKeyValue, count: colorCount }) => {
        const [color, hex] = colorKeyValue.split('|');
        return { color, hex, count: colorCount };
      }),
    };
  });

  const bin = {
    bin_id: stage.stage_id,
    label: stage.label,
    start_year: stage.start_year,
    end_year: stage.end_year,
    age_start: poet.birth_year ? stage.start_year - poet.birth_year : null,
    age_end: poet.birth_year ? stage.end_year - poet.birth_year : null,
    life_stage_id: stage.stage_id,
    life_stage_label: stage.label,
    stage_type: stage.type,
    stage_description: stage.description,
    stage_source_ref: stage.source_ref,
    poem_count: stagePoems.length,
    color_total: total,
    char_count: stageChars,
    date_certainty_mix: certaintyMix(stagePoems),
    colors,
    dominant_colors: dominantColors(colors),
    emotions: emotionRows,
    scenes: sceneRows,
    sample_lines: sampleUnique(stageOccurrences, (item) => `${item.poem_id}:${item.line_text}`, 8).map((item) => compactLine(item, item.poem)),
    change_from_previous: changes(colors, previousColors),
  };
  return {
    ...bin,
    interpretation: generateStageInterpretation(bin),
  };
}

function buildUnknownBin(poet, unknownPoems, occurrences, lexiconMap) {
  const poemIds = new Set(unknownPoems.map((poem) => poem.poem_id));
  const related = occurrences.filter((occurrence) => poemIds.has(occurrence.poem_id));
  const total = related.length;
  const colors = topN(
    related.reduce((map, occurrence) => {
      increment(map, colorKey(occurrence));
      return map;
    }, new Map()),
    20,
  ).map(({ key, count }) => {
    const [color, group, hex] = key.split('|');
    return {
      color,
      normalized_color: color,
      color_group: group,
      hex,
      ambiguity_note: ambiguityFor(lexiconMap, color),
      count,
      per_poem: unknownPoems.length ? Number((count / unknownPoems.length).toFixed(3)) : 0,
      per_1000_chars: 0,
      share: total ? Number((count / total).toFixed(4)) : 0,
      sample_lines: sampleUnique(related.filter((item) => item.normalized_color === color), (item) => `${item.poem_id}:${item.line_text}`, 6).map((item) => compactLine(item, item.poem)),
    };
  });
  const bin = {
    bin_id: 'unknown',
    label: '未定年',
    start_year: null,
    end_year: null,
    age_start: null,
    age_end: null,
    life_stage_id: null,
    life_stage_label: '未定年',
    stage_type: 'unknown',
    stage_description: '缺少可靠写作时间或阶段信息，未强行放入时间轴。',
    stage_source_ref: '无可用定年 seed；未强行推断。',
    poem_count: unknownPoems.length,
    color_total: total,
    char_count: charCount(unknownPoems),
    date_certainty_mix: certaintyMix(unknownPoems),
    colors,
    dominant_colors: dominantColors(colors),
    emotions: [],
    scenes: [],
    sample_lines: sampleUnique(related, (item) => `${item.poem_id}:${item.line_text}`, 8).map((item) => compactLine(item, item.poem)),
    change_from_previous: { rising_colors: [], falling_colors: [], new_colors: [] },
  };
  return {
    ...bin,
    interpretation: generateStageInterpretation(bin),
  };
}

async function main() {
  const poems = await readJson(path.join(PUBLIC_DATA_DIR, 'poems_timed.json'), []);
  const colorOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'color_occurrences.json'), []);
  const imageryOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'imagery_occurrences.json'), []);
  const emotionOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'emotion_occurrences.json'), []);
  const biographies = await readJson(path.join(PUBLIC_DATA_DIR, 'poet_biographies.json'), { poets: [] });
  const colorLexicon = await readJson(path.join(DATA_DIR, 'color_lexicon.json'), []);
  const lexiconMap = new Map(colorLexicon.map((item) => [item.normalized_name, item]));

  const poemById = new Map(poems.map((poem) => [poem.poem_id, poem]));
  const imageryByOccurrence = groupBy(imageryOccurrences, (item) => item.color_occurrence_id);
  const emotionsByPoemLine = groupBy(emotionOccurrences, (item) => `${item.poem_id}|${item.line_text}`);
  const enriched = colorOccurrences
    .map((occurrence) => enrichOccurrence(occurrence, poemById.get(occurrence.poem_id), imageryByOccurrence, emotionsByPoemLine))
    .filter((occurrence) => occurrence.poem);
  const poemsByAuthor = groupBy(poems, (poem) => poem.author);
  const occurrencesByAuthor = groupBy(enriched, (occurrence) => occurrence.author);

  const poetRows = biographies.poets.map((poet) => {
    const poetPoems = poemsByAuthor.get(poet.name) || [];
    const poetOccurrences = occurrencesByAuthor.get(poet.name) || [];
    let previousColors = [];
    const timeBins = poet.stages.map((stage) => {
      const stagePoems = poetPoems.filter((poem) => poem.life_stage_id === stage.stage_id);
      const bin = buildBin(poet, stage, stagePoems, poetOccurrences, previousColors, lexiconMap);
      previousColors = bin.colors;
      return bin;
    });
    const unknownPoems = poetPoems.filter((poem) => (poem.date_certainty || 'unknown') === 'unknown');
    const unknownBin = buildUnknownBin(poet, unknownPoems, poetOccurrences, lexiconMap);
    const colorTotals = topN(
      poetOccurrences.reduce((map, occurrence) => {
        increment(map, `${occurrence.normalized_color}|${occurrence.hex}`);
        return map;
      }, new Map()),
      8,
    ).map(({ key, count }) => {
      const [color, hex] = key.split('|');
      return { color, hex, count };
    });
    const row = {
      poet_id: poet.poet_id,
      name: poet.name,
      dynasty: poet.dynasty,
      birth_year: poet.birth_year,
      death_year: poet.death_year,
      summary: poet.summary,
      events: poet.events,
      stages: poet.stages,
      summary_stats: {
        poem_count: poetPoems.length,
        dated_poem_count: poetPoems.filter((poem) => poem.date_certainty !== 'unknown').length,
        unknown_poem_count: unknownPoems.length,
        color_occurrence_count: poetOccurrences.length,
        top_colors: colorTotals,
      },
      time_bins: [...timeBins, unknownBin],
    };
    return {
      ...row,
      trajectory_summary: generatePoetTrajectorySummary(row),
    };
  });

  const output = {
    generated_at: new Date().toISOString(),
    certainty_labels: {
      exact: '确切年份',
      estimated: '估计年份',
      range: '年份范围',
      stage: '仅可归入人生阶段',
      unknown: '未定年',
    },
    metric_labels: {
      count: '原始出现次数',
      per_poem: '每首诗归一化',
      per_1000_chars: '每千字归一化',
      share: '该阶段颜色占比',
    },
    note: '生平阶段与部分诗作定年来自 seed 映射，保留 source_ref 以便论文写作前复核；未定年作品不会强行进入时间轴。',
    poets: poetRows,
  };
  await writeJson(path.join(STATS_DIR, 'poet_color_trajectory.json'), output);
  console.log(`poet color trajectory written: ${poetRows.length} poets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
