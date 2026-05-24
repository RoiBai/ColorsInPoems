import type {
  CompareAlignMode,
  PoetTrajectory,
  StageColor,
  TrajectoryMetric,
  TrajectoryStageBin,
  UncertaintyMode,
} from './trajectoryTypes';

export const preferredPoets = ['苏轼', '李白', '杜甫', '白居易', '王维', '杜牧', '李商隐', '辛弃疾'];

export function metricValue(color: StageColor | undefined, metric: TrajectoryMetric) {
  if (!color) return 0;
  return Number(color[metric] || 0);
}

export function metricFormat(value: number, metric: TrajectoryMetric) {
  if (metric === 'share') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'count') return value.toLocaleString('zh-CN');
  return value.toFixed(2);
}

export function stageLabel(stage: TrajectoryStageBin, mode: 'year' | 'age' | 'stage' | 'event') {
  if (stage.bin_id === 'unknown') return '未定年';
  if (mode === 'age' && stage.age_start !== null && stage.age_end !== null) return `${stage.age_start}–${stage.age_end}岁`;
  if (mode === 'year' && stage.start_year !== null && stage.end_year !== null) return `${stage.start_year}–${stage.end_year}`;
  return stage.life_stage_label || stage.label;
}

export function filteredBins(poet: PoetTrajectory, uncertaintyMode: UncertaintyMode) {
  return poet.time_bins.filter((stage) => {
    if (uncertaintyMode === 'show-unknown') return true;
    if (uncertaintyMode === 'hide-unknown') return stage.bin_id !== 'unknown';
    return stage.bin_id !== 'unknown' && stage.date_certainty_mix.unknown === 0;
  });
}

export function topColorsForHeatmap(poet: PoetTrajectory, bins: TrajectoryStageBin[], colorGroup: string, limit = 12) {
  const totals = new Map<string, { color: string; group: string; hex: string; count: number }>();
  bins.forEach((stage) => {
    stage.colors.forEach((color) => {
      if (colorGroup !== '全部' && color.color_group !== colorGroup) return;
      const prev = totals.get(color.color) || { color: color.color, group: color.color_group, hex: color.hex, count: 0 };
      prev.count += color.count;
      totals.set(color.color, prev);
    });
  });
  return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function findColor(stage: TrajectoryStageBin, colorName: string) {
  return stage.colors.find((color) => color.color === colorName || color.normalized_color === colorName);
}

export function generateStageInterpretation(stage: TrajectoryStageBin) {
  return stage.interpretation;
}

export function generatePoetTrajectorySummary(poet: PoetTrajectory) {
  return poet.trajectory_summary;
}

function topColorSet(poet: PoetTrajectory) {
  return new Set(poet.summary_stats.top_colors.slice(0, 8).map((item) => item.color));
}

function latestMeaningfulStage(poet: PoetTrajectory) {
  const stages = poet.time_bins.filter((stage) => stage.bin_id !== 'unknown' && stage.color_total > 0);
  return stages[stages.length - 1];
}

export function generateComparisonInterpretation(poets: PoetTrajectory[]) {
  if (poets.length < 2) return '请选择至少两位诗人进行比较。';
  const sets = poets.map(topColorSet);
  const shared = [...sets[0]].filter((color) => sets.every((set) => set.has(color)));
  const uniqueSentences = poets.map((poet, index) => {
    const otherColors = new Set(poets.flatMap((item, otherIndex) => (otherIndex === index ? [] : [...topColorSet(item)])));
    const unique = [...topColorSet(poet)].filter((color) => !otherColors.has(color)).slice(0, 4);
    const late = latestMeaningfulStage(poet);
    const lateColors = late?.dominant_colors.slice(0, 3).map((item) => item.color).join('、') || '暂无';
    return `${poet.name}较突出的颜色为 ${unique.join('、') || '暂无明显独特色'}；末段可定位阶段主导色为 ${lateColors}。`;
  });
  const caution = poets.some((poet) => poet.summary_stats.dated_poem_count < 5)
    ? '当前比较中至少一位诗人的可定位诗作较少，解释仅供探索。'
    : '当前比较基于可定位阶段统计，仍需结合版本和年谱校订。';
  return `共同高频颜色：${shared.slice(0, 5).join('、') || '暂无稳定共同色'}。${uniqueSentences.join(' ')} ${caution}`;
}

export function alignLabel(stage: TrajectoryStageBin, mode: CompareAlignMode) {
  if (mode === 'age') return stage.age_start !== null && stage.age_end !== null ? `${stage.age_start}–${stage.age_end}岁` : stage.label;
  if (mode === 'absolute-year') return stage.start_year !== null && stage.end_year !== null ? `${stage.start_year}–${stage.end_year}` : stage.label;
  const typeMap: Record<string, string> = {
    early: '早年',
    career: '壮年 / 仕宦',
    travel: '漂泊 / 远游',
    capital: '转折期',
    exile: '贬谪 / 漂泊 / 战乱',
    war: '贬谪 / 漂泊 / 战乱',
    retreat: '归隐 / 闲居',
    settled: '归隐 / 闲居',
    late: '晚年',
  };
  return typeMap[stage.stage_type] || stage.life_stage_label;
}

export function eventNeighborStages(poet: PoetTrajectory, eventYear: number) {
  const stages = poet.time_bins.filter((stage) => stage.bin_id !== 'unknown' && stage.start_year !== null && stage.end_year !== null);
  const before = [...stages].reverse().find((stage) => Number(stage.end_year) <= eventYear);
  const after = stages.find((stage) => Number(stage.start_year) >= eventYear) || stages.find((stage) => Number(stage.start_year) <= eventYear && Number(stage.end_year) >= eventYear);
  return { before, after };
}
