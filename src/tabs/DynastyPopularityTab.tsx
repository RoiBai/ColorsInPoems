import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { DynastyTopStats } from '../types';
import { cnNumber, dynasties, pct } from '../utils/format';
import { ChipGroup, SectionHeader, TooltipLine, useTooltip } from './common';

export function DynastyPopularityTab() {
  const { data, loading, error } = useData<DynastyTopStats>('/data/stats/dynasty_color_top10.json');
  const { selectedDynasty, setSelectedDynasty, openDetail } = useAppState();
  const [mode, setMode] = useState<'count' | 'normalized'>('count');
  const tooltip = useTooltip();

  if (loading) return <LoadingBlock label="正在加载朝代色彩流行度" />;
  if (error || !data) return <EmptyState message="朝代色彩流行度数据加载失败。" />;

  const dynasty = selectedDynasty === '全部' ? '唐' : selectedDynasty;
  const row = data.data[dynasty] || data.data['唐'];
  const values = row?.top_colors || [];
  const max = Math.max(1, ...values.map((item) => (mode === 'count' ? item.count : item.per_thousand_poems)));

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title={data.title} description={data.description} />
      <div className="mb-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <ChipGroup label="朝代按钮" options={dynasties.filter((item) => item !== '全部' && item !== '近现代')} value={dynasty} onChange={setSelectedDynasty} />
        <div>
          <p className="mb-2 text-xs text-mutedInk">统计口径</p>
          <div className="flex gap-2">
            <button className={`pill-button ${mode === 'count' ? 'pill-button-active' : ''}`} onClick={() => setMode('count')}>原始次数</button>
            <button className={`pill-button ${mode === 'normalized' ? 'pill-button-active' : ''}`} onClick={() => setMode('normalized')}>每千首归一化频率</button>
          </div>
        </div>
      </div>

      {!values.length ? (
        <EmptyState message="这个朝代暂无颜色统计。" />
      ) : (
        <div className="space-y-3">
          {values.map((item, index) => {
            const value = mode === 'count' ? item.count : item.per_thousand_poems;
            return (
              <button
                key={item.color}
                type="button"
                className="grid w-full grid-cols-[3rem_6rem_1fr_6rem] items-center gap-3 rounded-lg border border-stone-200 bg-white/42 p-3 text-left transition hover:border-cinnabar/50 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                onMouseMove={tooltip.move}
                onMouseEnter={(event) =>
                  tooltip.show(
                    event,
                    <div>
                      <TooltipLine label="颜色词" value={item.color} />
                      <TooltipLine label="色系" value={item.color_group} />
                      <TooltipLine label="出现次数" value={cnNumber(item.count)} />
                      <TooltipLine label="占比" value={pct(item.share)} />
                      <TooltipLine label="代表诗句" value={item.sample_line?.line_text || '暂无'} />
                    </div>,
                  )
                }
                onMouseLeave={tooltip.hide}
                onClick={() =>
                  openDetail({
                    type: 'combo',
                    id: `${dynasty}-${item.color}`,
                    title: `${dynasty} × ${item.color}`,
                    payload: { sample_lines: item.sample_line ? [item.sample_line] : [] },
                  })
                }
              >
                <span className="font-song text-lg text-mutedInk">{index + 1}</span>
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border border-stone-300" style={{ background: item.hex }} />
                  <span className="font-song text-lg">{item.color}</span>
                </span>
                <span className="h-5 rounded-full bg-stone-200/70">
                  <span className="block h-5 rounded-full" style={{ width: `${(value / max) * 100}%`, background: item.hex }} />
                </span>
                <span className="text-right text-sm text-mutedInk">
                  {mode === 'count' ? cnNumber(item.count) : item.per_thousand_poems}
                  <span className="ml-2 text-cinnabar">{item.previous_comparison.status}</span>
                </span>
              </button>
            );
          })}
          {tooltip.node}
        </div>
      )}
    </section>
  );
}
