import path from 'node:path';
import {
  DYNASTIES,
  PUBLIC_DATA_DIR,
  STATS_DIR,
  increment,
  readJson,
  sampleUnique,
  topN,
  writeJson,
} from './utils.js';

const colorGroupOrder = ['红系', '橙黄系', '绿系', '蓝青系', '紫系', '中性色'];
const commonPoets = ['苏轼', '杜甫', '李白', '白居易', '刘禹锡', '王维', '杜牧', '李商隐', '《诗经》', '辛弃疾'];

function byId(items, key = 'poem_id') {
  return new Map(items.map((item) => [item[key], item]));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function sampleLine(occurrence) {
  return {
    poem_id: occurrence.poem_id,
    title: occurrence.title,
    author: occurrence.author,
    dynasty: occurrence.dynasty,
    line_text: occurrence.line_text,
  };
}

function mapCounts(items, keyFn) {
  const map = new Map();
  items.forEach((item) => increment(map, keyFn(item)));
  return map;
}

function countDistinct(items, keyFn) {
  return new Set(items.map(keyFn)).size;
}

function poemCharCount(poems) {
  return poems.reduce((sum, poem) => sum + poem.content.replace(/\s/g, '').length, 0);
}

function attachRelations(colorOccurrences, imageryByOccurrence, emotionsByPoem) {
  return colorOccurrences.map((occurrence) => ({
    ...occurrence,
    imageries: imageryByOccurrence.get(occurrence.occurrence_id) || [],
    emotions: (emotionsByPoem.get(occurrence.poem_id) || []).filter((emotion) => emotion.line_text === occurrence.line_text),
  }));
}

function buildColorDetails(colorOccurrences) {
  const details = {};
  const byColor = groupBy(colorOccurrences, (item) => item.normalized_color);
  for (const [color, occs] of byColor) {
    const first = occs[0];
    const dynastyDistribution = topN(mapCounts(occs, (item) => item.dynasty), DYNASTIES.length).map(({ key, count }) => ({
      dynasty: key,
      count,
    }));
    const topPoets = topN(mapCounts(occs, (item) => `${item.author}|${item.dynasty}`), 8).map(({ key, count }) => {
      const [poet, dynasty] = key.split('|');
      return { poet, dynasty, count };
    });
    const allImageries = occs.flatMap((item) => item.imageries || []);
    const topImageries = topN(mapCounts(allImageries, (item) => `${item.imagery_word}|${item.imagery_category}`), 10).map(
      ({ key, count }) => {
        const [imagery, category] = key.split('|');
        return { imagery, category, count };
      },
    );
    const allEmotions = occs.flatMap((item) => item.emotions || []);
    const topEmotions = topN(mapCounts(allEmotions, (item) => item.emotion_tag), 10).map(({ key, count }) => ({
      emotion: key,
      count,
    }));
    details[color] = {
      color_word: first.color_word,
      normalized_color: color,
      color_group: first.color_group,
      hex: first.hex,
      total_count: occs.length,
      dynasty_distribution: dynastyDistribution,
      top_poets: topPoets,
      top_imageries: topImageries,
      top_emotions: topEmotions,
      sample_lines: sampleUnique(occs, (item) => `${item.poem_id}:${item.line_text}`, 12).map(sampleLine),
    };
  }
  return details;
}

function buildPoetDetails(poems, colorOccurrences) {
  const details = {};
  const poemsByPoet = groupBy(poems, (poem) => poem.author);
  const occsByPoet = groupBy(colorOccurrences, (item) => item.author);

  for (const [poet, poetPoems] of poemsByPoet) {
    const occs = occsByPoet.get(poet) || [];
    const dynasty = topN(mapCounts(poetPoems, (poem) => poem.dynasty), 1)[0]?.key || poetPoems[0].dynasty;
    const topColors = topN(mapCounts(occs, (item) => `${item.normalized_color}|${item.color_group}|${item.hex}`), 8).map(
      ({ key, count }) => {
        const [color, group, hex] = key.split('|');
        return { color, group, hex, count };
      },
    );
    const allImageries = occs.flatMap((item) => item.imageries || []);
    const topImageries = topN(mapCounts(allImageries, (item) => `${item.imagery_word}|${item.imagery_category}`), 8).map(
      ({ key, count }) => {
        const [imagery, category] = key.split('|');
        return { imagery, category, count };
      },
    );
    details[poet] = {
      poet,
      dynasty,
      poem_count: poetPoems.length,
      color_total: occs.length,
      top_colors: topColors,
      top_imageries: topImageries,
      sample_lines: sampleUnique(occs, (item) => `${item.poem_id}:${item.line_text}`, 10).map(sampleLine),
    };
  }
  return details;
}

function buildPoetColorEdges(colorOccurrences) {
  const grouped = groupBy(colorOccurrences, (item) => `${item.author}|${item.dynasty}|${item.normalized_color}`);
  const edges = [];
  for (const [key, occs] of grouped) {
    const [poet, dynasty, color] = key.split('|');
    const first = occs[0];
    edges.push({
      poet,
      dynasty,
      color,
      color_group: first.color_group,
      hex: first.hex,
      count: occs.length,
      sample_lines: sampleUnique(occs, (item) => `${item.poem_id}:${item.line_text}`, 4).map(sampleLine),
    });
  }
  edges.sort((a, b) => b.count - a.count);
  const poetCounts = topN(mapCounts(colorOccurrences, (item) => item.author), 100).map(({ key, count }) => ({
    poet: key,
    count,
  }));
  const colorCounts = topN(mapCounts(colorOccurrences, (item) => item.normalized_color), 100).map(({ key, count }) => ({
    color: key,
    count,
  }));
  return {
    title: '诗人与色彩关联图',
    description: '左列为诗人，右列为色彩，连线表示该诗人作品使用过该色彩词。悬停节点查看详情。',
    dynasty_options: ['全部', ...DYNASTIES],
    famous_poets: commonPoets,
    color_groups: ['全部', ...colorGroupOrder],
    poet_counts: poetCounts,
    color_counts: colorCounts,
    edges,
  };
}

function comparisonLabel(current, previous) {
  if (!previous) return { status: '新出现', delta: current };
  const delta = current - previous;
  if (Math.abs(delta) <= 1) return { status: '持平', delta };
  return delta > 0 ? { status: '上升', delta } : { status: '下降', delta };
}

function buildDynastyTop(poems, colorOccurrences) {
  const poemsByDynasty = groupBy(poems, (poem) => poem.dynasty);
  const occsByDynasty = groupBy(colorOccurrences, (item) => item.dynasty);
  const result = {};
  let previousCounts = new Map();
  for (const dynasty of DYNASTIES.filter((name) => name !== '近现代')) {
    const dynastyPoems = poemsByDynasty.get(dynasty) || [];
    const occs = occsByDynasty.get(dynasty) || [];
    const total = occs.length;
    const counts = mapCounts(occs, (item) => `${item.normalized_color}|${item.color_group}|${item.hex}`);
    const topColors = topN(counts, 10).map(({ key, count }) => {
      const [color, group, hex] = key.split('|');
      const previous = previousCounts.get(color) || 0;
      const sample = occs.find((item) => item.normalized_color === color);
      return {
        color,
        color_group: group,
        hex,
        count,
        per_thousand_poems: dynastyPoems.length ? Number(((count / dynastyPoems.length) * 1000).toFixed(2)) : 0,
        share: total ? Number((count / total).toFixed(4)) : 0,
        previous_comparison: comparisonLabel(count, previous),
        sample_line: sample ? sampleLine(sample) : null,
      };
    });
    result[dynasty] = {
      dynasty,
      poem_count: dynastyPoems.length,
      color_total: total,
      top_colors: topColors,
    };
    previousCounts = new Map([...counts.entries()].map(([key, count]) => [key.split('|')[0], count]));
  }
  return {
    title: '朝代色彩流行度 TOP 10',
    description: '选择朝代，查看该朝代诗词中出现最多的色彩词',
    dynasties: DYNASTIES,
    data: result,
  };
}

function displayImageryName(word, category) {
  if (category === '季节' && word === '春') return '春天';
  if (category === '季节' && word === '秋') return '秋天';
  if (category === '自然' && word === '山') return '山水';
  return word;
}

function buildImageryBubbles(colorOccurrences, imageryOccurrences, emotionOccurrences) {
  const colorByOccurrence = byId(colorOccurrences, 'occurrence_id');
  const poemColorOccurrences = groupBy(colorOccurrences, (item) => item.poem_id);
  const imageryGroups = groupBy(imageryOccurrences, (item) => `${displayImageryName(item.imagery_word, item.imagery_category)}|${item.imagery_category}`);
  const bubbles = [];

  for (const [key, items] of imageryGroups) {
    const [name, category] = key.split('|');
    const relatedColors = items.map((item) => colorByOccurrence.get(item.color_occurrence_id)).filter(Boolean);
    const colorCounts = topN(mapCounts(relatedColors, (item) => `${item.normalized_color}|${item.color_group}|${item.hex}`), 8).map(
      ({ key: colorKey, count }) => {
        const [color, group, hex] = colorKey.split('|');
        return { color, group, hex, count };
      },
    );
    if (!colorCounts.length) continue;
    bubbles.push({
      id: `imagery_${name}`,
      name,
      category,
      kind: 'imagery',
      poem_count: countDistinct(relatedColors, (item) => item.poem_id),
      count: items.length,
      main_color: colorCounts[0],
      colors: colorCounts,
      top_poets: topN(mapCounts(relatedColors, (item) => item.author), 5).map(({ key, count }) => ({ poet: key, count })),
      dynasty_distribution: topN(mapCounts(relatedColors, (item) => item.dynasty), 8).map(({ key, count }) => ({ dynasty: key, count })),
      sample_lines: sampleUnique(relatedColors, (item) => `${item.poem_id}:${item.line_text}`, 6).map(sampleLine),
    });
  }

  const emotionGroups = groupBy(emotionOccurrences, (item) => item.emotion_tag);
  for (const [emotion, items] of emotionGroups) {
    const relatedColors = items.flatMap((emotionItem) => poemColorOccurrences.get(emotionItem.poem_id) || []);
    if (!relatedColors.length) continue;
    const colorCounts = topN(mapCounts(relatedColors, (item) => `${item.normalized_color}|${item.color_group}|${item.hex}`), 8).map(
      ({ key: colorKey, count }) => {
        const [color, group, hex] = colorKey.split('|');
        return { color, group, hex, count };
      },
    );
    bubbles.push({
      id: `emotion_${emotion}`,
      name: emotion,
      category: '情绪',
      kind: 'emotion',
      poem_count: countDistinct(relatedColors, (item) => item.poem_id),
      count: relatedColors.length,
      main_color: colorCounts[0],
      colors: colorCounts,
      top_poets: topN(mapCounts(relatedColors, (item) => item.author), 5).map(({ key, count }) => ({ poet: key, count })),
      dynasty_distribution: topN(mapCounts(relatedColors, (item) => item.dynasty), 8).map(({ key, count }) => ({ dynasty: key, count })),
      sample_lines: sampleUnique(relatedColors, (item) => `${item.poem_id}:${item.line_text}`, 6).map(sampleLine),
    });
  }

  bubbles.sort((a, b) => b.count - a.count);
  return {
    title: '色彩与情感意象关联',
    description: '气泡大小代表该意象标签关联的诗词数量；颜色取自该意象最常见的色彩词。点击气泡跳转该意象主色彩详情，悬停展开关联色彩圆点。',
    hint: '点击意象气泡 → 跳转该意象主色彩详情 · 悬停气泡 → 展开关联色彩圆点 · 点击色彩圆点 → 跳转对应色彩详情',
    categories: ['全部', '情绪', '自然', '季节', '植物', '动物', '人物', '器物', '空间', '时间'],
    bubbles,
  };
}

function buildDynastyStream(poems, colorOccurrences) {
  const poemsByDynasty = groupBy(poems, (poem) => poem.dynasty);
  const occsByDynasty = groupBy(colorOccurrences, (item) => item.dynasty);
  const colorTotals = topN(mapCounts(colorOccurrences, (item) => `${item.normalized_color}|${item.color_group}|${item.hex}`), 14).map(
    ({ key }) => {
      const [color, group, hex] = key.split('|');
      return { color, group, hex };
    },
  );
  const rows = [];
  for (const dynasty of DYNASTIES.filter((name) => name !== '近现代')) {
    const poemsInDynasty = poemsByDynasty.get(dynasty) || [];
    const dynastyOccs = occsByDynasty.get(dynasty) || [];
    const charCount = poemCharCount(poemsInDynasty);
    for (const color of colorTotals) {
      const occs = dynastyOccs.filter((item) => item.normalized_color === color.color);
      rows.push({
        dynasty,
        color: color.color,
        color_group: color.group,
        hex: color.hex,
        count: occs.length,
        per_thousand_poems: poemsInDynasty.length ? Number(((occs.length / poemsInDynasty.length) * 1000).toFixed(2)) : 0,
        per_ten_thousand_chars: charCount ? Number(((occs.length / charCount) * 10000).toFixed(2)) : 0,
        top_poets: topN(mapCounts(occs, (item) => item.author), 3).map(({ key, count }) => ({ poet: key, count })),
        top_imageries: topN(mapCounts(occs.flatMap((item) => item.imageries || []), (item) => item.imagery_word), 4).map(({ key, count }) => ({
          imagery: key,
          count,
        })),
        sample_line: occs[0] ? sampleLine(occs[0]) : null,
      });
    }
  }
  return {
    dynasties: DYNASTIES.filter((name) => name !== '近现代'),
    colors: colorTotals,
    rows,
  };
}

function buildPoemColorBands(poems, colorOccurrences) {
  const occsByPoem = groupBy(colorOccurrences, (item) => item.poem_id);
  return poems
    .map((poem) => {
      const colors = (occsByPoem.get(poem.poem_id) || []).map((item) => ({
        color: item.normalized_color,
        word: item.color_word,
        group: item.color_group,
        hex: item.hex,
        line_text: item.line_text,
      }));
      return {
        poem_id: poem.poem_id,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        source_id: poem.source_id,
        source_ref: poem.source_ref,
        colors,
        color_count: colors.length,
      };
    })
    .filter((item) => item.colors.length)
    .sort((a, b) => b.color_count - a.color_count);
}

function buildSemanticContexts(colorOccurrences) {
  const contexts = {};
  const byColor = groupBy(colorOccurrences, (item) => item.normalized_color);
  for (const [color, occs] of byColor) {
    const combos = groupBy(
      occs.flatMap((occurrence) => (occurrence.imageries || []).map((imagery) => ({ occurrence, imagery }))),
      (item) => `${item.imagery.imagery_word}|${item.imagery.imagery_category}`,
    );
    contexts[color] = [...combos.entries()]
      .map(([key, items]) => {
        const [imagery, category] = key.split('|');
        const emotions = items.flatMap((item) => item.occurrence.emotions || []);
        return {
          color,
          imagery,
          category,
          count: items.length,
          emotions: topN(mapCounts(emotions, (emotion) => emotion.emotion_tag), 4).map(({ key: emotion, count }) => ({
            emotion,
            count,
          })),
          sample_lines: sampleUnique(
            items.map((item) => item.occurrence),
            (item) => `${item.poem_id}:${item.line_text}`,
            8,
          ).map(sampleLine),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 18);
  }
  return contexts;
}

function buildEmotionSpectrum(colorOccurrences) {
  const rows = [];
  const emotionGroups = groupBy(
    colorOccurrences.flatMap((occurrence) => (occurrence.emotions || []).map((emotion) => ({ occurrence, emotion }))),
    (item) => item.emotion.emotion_tag,
  );
  for (const [emotion, items] of emotionGroups) {
    const colors = topN(
      mapCounts(items, (item) => `${item.occurrence.normalized_color}|${item.occurrence.color_group}|${item.occurrence.hex}`),
      12,
    ).map(({ key, count }) => {
      const [color, group, hex] = key.split('|');
      const related = items.filter((item) => item.occurrence.normalized_color === color).map((item) => item.occurrence);
      return {
        color,
        group,
        hex,
        count,
        imageries: topN(mapCounts(related.flatMap((item) => item.imageries || []), (item) => item.imagery_word), 5).map(({ key, count }) => ({
          imagery: key,
          count,
        })),
        sample_lines: sampleUnique(related, (item) => `${item.poem_id}:${item.line_text}`, 4).map(sampleLine),
      };
    });
    rows.push({ emotion, colors, total_count: items.length, main_color: colors[0] || null });
  }
  rows.sort((a, b) => b.total_count - a.total_count);
  return rows;
}

function buildSearchIndex(poems, colorDetails, poetDetails, imageryBubbles) {
  return {
    poets: Object.values(poetDetails).map((item) => ({
      type: 'poet',
      id: item.poet,
      label: item.poet,
      meta: `${item.dynasty} · ${item.poem_count} 首 · ${item.color_total} 次颜色`,
    })),
    colors: Object.values(colorDetails).map((item) => ({
      type: 'color',
      id: item.normalized_color,
      label: item.normalized_color,
      meta: `${item.color_group} · ${item.hex} · ${item.total_count} 次`,
    })),
    poems: poems.slice(0, 800).map((poem) => ({
      type: 'poem',
      id: poem.poem_id,
      label: poem.title,
      meta: `${poem.author} · ${poem.dynasty} · ${poem.lines.slice(0, 2).join(' / ')}`,
    })),
    imageries: imageryBubbles.bubbles.map((item) => ({
      type: 'imagery',
      id: item.name,
      label: item.name,
      meta: `${item.category} · ${item.count} 条关联`,
    })),
  };
}

function buildTriangle(colorOccurrences) {
  return {
    poets: topN(mapCounts(colorOccurrences, (item) => item.author), 16).map(({ key, count }) => ({ name: key, count })),
    colors: topN(mapCounts(colorOccurrences, (item) => `${item.normalized_color}|${item.hex}|${item.color_group}`), 16).map(
      ({ key, count }) => {
        const [name, hex, group] = key.split('|');
        return { name, hex, group, count };
      },
    ),
    emotions: topN(mapCounts(colorOccurrences.flatMap((item) => item.emotions || []), (item) => item.emotion_tag), 16).map(
      ({ key, count }) => ({ name: key, count }),
    ),
    links: colorOccurrences.map((item) => ({
      poet: item.author,
      color: item.normalized_color,
      emotions: (item.emotions || []).map((emotion) => emotion.emotion_tag),
      imageries: (item.imageries || []).map((imagery) => imagery.imagery_word),
      sample_line: sampleLine(item),
    })),
  };
}

function buildGameQuestions(colorOccurrences, dynastyTop, emotionSpectrum) {
  const poetGroups = groupBy(colorOccurrences, (item) => item.author);
  const guessPoet = [...poetGroups.entries()]
    .filter(([, occs]) => occs.length >= 3)
    .slice(0, 12)
    .map(([poet, occs]) => ({
      type: 'poet',
      answer: poet,
      prompt_colors: topN(mapCounts(occs, (item) => item.normalized_color), 5).map(({ key }) => key),
      options: topN(mapCounts(colorOccurrences, (item) => item.author), 16)
        .map(({ key }) => key)
        .filter((name) => name !== poet)
        .slice(0, 3)
        .concat(poet)
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
      explanation: sampleUnique(occs, (item) => item.line_text, 2).map(sampleLine),
    }));
  const guessDynasty = Object.values(dynastyTop.data)
    .filter((item) => item.top_colors.length >= 3)
    .map((item) => ({
      type: 'dynasty',
      answer: item.dynasty,
      prompt_colors: item.top_colors.slice(0, 5).map((color) => color.color),
      options: DYNASTIES.filter((name) => name !== '近现代').slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 3).concat(item.dynasty),
      explanation: item.top_colors.slice(0, 2).map((color) => color.sample_line).filter(Boolean),
    }));
  const guessEmotion = emotionSpectrum
    .filter((item) => item.colors.length >= 3)
    .slice(0, 12)
    .map((item) => ({
      type: 'emotion',
      answer: item.emotion,
      prompt_colors: item.colors.slice(0, 4).map((color) => color.color),
      prompt_imageries: item.colors.flatMap((color) => color.imageries.slice(0, 1).map((imagery) => imagery.imagery)).slice(0, 4),
      options: emotionSpectrum
        .map((row) => row.emotion)
        .filter((emotion) => emotion !== item.emotion)
        .slice(0, 3)
        .concat(item.emotion)
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
      explanation: item.colors[0]?.sample_lines || [],
    }));
  return [...guessPoet, ...guessDynasty, ...guessEmotion];
}

async function main() {
  const poems = await readJson(path.join(PUBLIC_DATA_DIR, 'poems.json'), []);
  const colorOccurrencesRaw = await readJson(path.join(PUBLIC_DATA_DIR, 'color_occurrences.json'), []);
  const imageryOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'imagery_occurrences.json'), []);
  const emotionOccurrences = await readJson(path.join(PUBLIC_DATA_DIR, 'emotion_occurrences.json'), []);
  const sourceManifest = await readJson(path.join(PUBLIC_DATA_DIR, 'source_manifest.json'), []);

  const imageryByOccurrence = groupBy(imageryOccurrences, (item) => item.color_occurrence_id);
  const emotionsByPoem = groupBy(emotionOccurrences, (item) => item.poem_id);
  const colorOccurrences = attachRelations(colorOccurrencesRaw, imageryByOccurrence, emotionsByPoem);

  const colorDetails = buildColorDetails(colorOccurrences);
  const poetDetails = buildPoetDetails(poems, colorOccurrences);
  const poetColorEdges = buildPoetColorEdges(colorOccurrences);
  const dynastyTop = buildDynastyTop(poems, colorOccurrences);
  const imageryBubbles = buildImageryBubbles(colorOccurrences, imageryOccurrences, emotionOccurrences);
  const dynastyStream = buildDynastyStream(poems, colorOccurrences);
  const poemColorBands = buildPoemColorBands(poems, colorOccurrences);
  const semanticContexts = buildSemanticContexts(colorOccurrences);
  const emotionSpectrum = buildEmotionSpectrum(colorOccurrences);
  const triangle = buildTriangle(colorOccurrences);
  const searchIndex = buildSearchIndex(poems, colorDetails, poetDetails, imageryBubbles);
  const gameQuestions = buildGameQuestions(colorOccurrences, dynastyTop, emotionSpectrum);

  const overview = {
    generated_at: new Date().toISOString(),
    poem_count: poems.length,
    poet_count: new Set(poems.map((poem) => poem.author)).size,
    color_word_count: Object.keys(colorDetails).length,
    color_occurrence_count: colorOccurrences.length,
    dynasty_count: new Set(poems.map((poem) => poem.dynasty)).size,
    source_count: sourceManifest.length,
    dynasties: DYNASTIES,
    note: '色值为可视化近似，不代表古代颜色标准的唯一解释；单字颜色与情绪标签均需结合语境理解。',
  };

  await writeJson(path.join(STATS_DIR, 'overview.json'), overview);
  await writeJson(path.join(STATS_DIR, 'poet_color_edges.json'), poetColorEdges);
  await writeJson(path.join(STATS_DIR, 'dynasty_color_top10.json'), dynastyTop);
  await writeJson(path.join(STATS_DIR, 'imagery_color_bubbles.json'), imageryBubbles);
  await writeJson(path.join(STATS_DIR, 'color_detail_index.json'), colorDetails);
  await writeJson(path.join(STATS_DIR, 'poet_detail_index.json'), poetDetails);
  await writeJson(path.join(STATS_DIR, 'dynasty_stream.json'), dynastyStream);
  await writeJson(path.join(STATS_DIR, 'poem_color_bands.json'), poemColorBands);
  await writeJson(path.join(STATS_DIR, 'color_semantic_contexts.json'), semanticContexts);
  await writeJson(path.join(STATS_DIR, 'emotion_color_spectrum.json'), emotionSpectrum);
  await writeJson(path.join(STATS_DIR, 'triangle_relations.json'), triangle);
  await writeJson(path.join(STATS_DIR, 'search_index.json'), searchIndex);
  await writeJson(path.join(STATS_DIR, 'game_questions.json'), gameQuestions);
  console.log(`stats built: ${colorOccurrences.length} color occurrences, ${Object.keys(colorDetails).length} colors`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
