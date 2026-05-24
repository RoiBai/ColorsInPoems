import { useMemo, useState } from 'react';
import type { CompareAlignMode, PoetTrajectory, TrajectoryDetail, TrajectoryMetric } from './trajectoryTypes';
import { alignLabel, filteredBins, generateComparisonInterpretation, topColorsForHeatmap } from './trajectoryUtils';
import { ChipGroup } from '../../tabs/common';
import { cnNumber } from '../../utils/format';

function MiniHeatmap({ poet, metric, alignMode }: { poet: PoetTrajectory; metric: TrajectoryMetric; alignMode: CompareAlignMode }) {
  const bins = filteredBins(poet, 'hide-unknown').filter((stage) => stage.color_total > 0);
  const colors = topColorsForHeatmap(poet, bins, '全部', 8);
  const max = Math.max(1, ...bins.flatMap((stage) => colors.map((color) => Number(stage.colors.find((item) => item.color === color.color)?.[metric] || 0))));
  return (
    <div className="rounded-lg border border-stone-200 bg-white/45 p-3">
      <h3 className="font-song text-xl font-semibold">{poet.name}</h3>
      <p className="text-xs text-mutedInk">可定位 {cnNumber(poet.summary_stats.dated_poem_count)} 首 · 颜色 {cnNumber(poet.summary_stats.color_occurrence_count)} 次</p>
      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="ml-20 grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, bins.length)}, minmax(70px, 1fr))` }}>
            {bins.map((stage) => <span key={stage.bin_id} className="truncate text-center text-[10px] text-mutedInk">{alignLabel(stage, alignMode)}</span>)}
          </div>
          {colors.map((color) => (
            <div key={color.color} className="mt-1 grid items-center gap-1" style={{ gridTemplateColumns: `76px repeat(${Math.max(1, bins.length)}, minmax(70px, 1fr))` }}>
              <span className="truncate text-xs"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color.hex }} />{color.color}</span>
              {bins.map((stage) => {
                const found = stage.colors.find((item) => item.color === color.color);
                const value = Number(found?.[metric] || 0);
                return <span key={`${stage.bin_id}-${color.color}`} className="h-5 rounded" style={{ background: found?.hex || '#e6dccb', opacity: found ? 0.16 + (value / max) * 0.76 : 0.12 }} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrajectoryCompareView({
  poets,
  metric,
  onDetail,
}: {
  poets: PoetTrajectory[];
  metric: TrajectoryMetric;
  onDetail: (detail: TrajectoryDetail) => void;
}) {
  const [selectedNames, setSelectedNames] = useState<string[]>(['苏轼', '李白']);
  const [alignMode, setAlignMode] = useState<CompareAlignMode>('age');
  const selectedPoets = useMemo(() => {
    const fallback = poets.slice(0, 2);
    const selected = selectedNames.map((name) => poets.find((poet) => poet.name === name)).filter(Boolean) as PoetTrajectory[];
    return selected.length >= 2 ? selected.slice(0, 3) : fallback;
  }, [poets, selectedNames]);
  const explanation = generateComparisonInterpretation(selectedPoets);
  const sharedColors = selectedPoets.length
    ? selectedPoets
        .map((poet) => new Set(poet.summary_stats.top_colors.map((color) => color.color)))
        .reduce((shared, set) => new Set([...shared].filter((color) => set.has(color))))
    : new Set<string>();

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
        <div className="flex flex-wrap items-end gap-3">
          {[0, 1, 2].map((slot) => (
            <label key={slot} className="min-w-44 text-xs text-mutedInk">
              诗人 {slot + 1}
              <select
                className="mt-2 w-full rounded-full border border-stone-300 bg-white/65 px-4 py-2 text-sm"
                value={selectedNames[slot] || ''}
                onChange={(event) => {
                  const next = [...selectedNames];
                  if (event.target.value) next[slot] = event.target.value;
                  else next.splice(slot, 1);
                  setSelectedNames([...new Set(next.filter(Boolean))].slice(0, 3));
                }}
              >
                <option value="">不选择</option>
                {poets.map((poet) => <option key={poet.poet_id}>{poet.name}</option>)}
              </select>
            </label>
          ))}
          <ChipGroup
            label="对齐方式"
            options={['按年龄对齐', '按绝对年份对齐', '按人生阶段对齐']}
            value={{ age: '按年龄对齐', 'absolute-year': '按绝对年份对齐', 'life-stage': '按人生阶段对齐' }[alignMode]}
            onChange={(value) => setAlignMode({ 按年龄对齐: 'age', 按绝对年份对齐: 'absolute-year', 按人生阶段对齐: 'life-stage' }[value] as CompareAlignMode)}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {selectedPoets.map((poet) => <MiniHeatmap key={poet.poet_id} poet={poet} metric={metric} alignMode={alignMode} />)}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-song text-xl font-semibold">主导色变化对比与解释</h3>
            <p className="mt-2 text-sm leading-7 text-mutedInk">{explanation}</p>
          </div>
          <button className="soft-button" onClick={() => onDetail({ type: 'comparison', poets: selectedPoets, text: explanation })}>打开比较解释</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-mutedInk">共同色：</span>
          {[...sharedColors].slice(0, 8).map((color) => <span key={color} className="rounded-full bg-cinnabar/10 px-3 py-1 text-sm text-cinnabar">{color}</span>)}
          {!sharedColors.size ? <span className="text-sm text-mutedInk">暂无稳定共同色</span> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {selectedPoets.map((poet) => (
            <div key={poet.poet_id} className="rounded-lg border border-stone-200 bg-white/45 p-3">
              <h4 className="font-song text-lg font-semibold">{poet.name}</h4>
              <p className="mt-1 text-xs text-mutedInk">Top 5 颜色</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {poet.summary_stats.top_colors.slice(0, 5).map((color) => (
                  <span key={color.color} className={`rounded-full px-2 py-1 text-xs ${sharedColors.has(color.color) ? 'bg-cinnabar/10 text-cinnabar' : 'bg-white/65 text-ink'}`}>
                    <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color.hex }} />
                    {color.color}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
