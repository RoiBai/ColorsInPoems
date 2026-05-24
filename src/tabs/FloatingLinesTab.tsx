import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, SampleLine } from '../types';
import { cnNumber } from '../utils/format';
import { LinesList, SectionHeader } from './common';

export function FloatingLinesTab() {
  const { data: colorIndex, loading } = useData<Record<string, ColorDetail>>('/data/stats/color_detail_index.json');
  const { openDetail } = useAppState();
  const [active, setActive] = useState('');
  const [paused, setPaused] = useState(false);
  const colors = useMemo(() => Object.values(colorIndex || {}).sort((a, b) => b.total_count - a.total_count).slice(0, 32), [colorIndex]);
  const activeColor = colorIndex?.[active] || colors[0];
  const fragments: SampleLine[] = activeColor?.sample_lines || [];

  if (loading) return <LoadingBlock label="正在加载诗句漂浮" />;
  if (!colorIndex) return <EmptyState message="诗句漂浮数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="诗句漂浮" description="颜色圆点按总频次漂浮；hover 可查看诗句碎片，click 后诗句聚合成完整卡片。" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="soft-button" onClick={() => setActive(colors[Math.floor(Math.random() * colors.length)]?.normalized_color || '')}>随机漫游</button>
        <button className="soft-button" onClick={() => setPaused(!paused)}>{paused ? '继续动画' : '暂停动画'}</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-stone-200 bg-white/35">
          {colors.map((color, index) => {
            const x = 8 + ((index * 29) % 84);
            const y = 10 + ((index * 47) % 76);
            const size = 34 + Math.sqrt(color.total_count / colors[0].total_count) * 72;
            return (
              <button
                key={color.normalized_color}
                className="floating-dot absolute rounded-full border-2 border-white/80 text-sm font-semibold text-ink shadow-paper transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cinnabar/30"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  background: color.hex,
                  animationPlayState: paused ? 'paused' : 'running',
                  animationDelay: `${-(index % 9)}s`,
                }}
                onMouseEnter={() => setActive(color.normalized_color)}
                onClick={() => openDetail({ type: 'color', id: color.normalized_color })}
              >
                {color.normalized_color}
              </button>
            );
          })}
        </div>
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">{activeColor?.normalized_color || '颜色'} 诗句聚合</h3>
          <p className="mt-1 text-sm text-mutedInk">总频次 {cnNumber(activeColor?.total_count || 0)}</p>
          <div className="mt-4"><LinesList lines={fragments} max={7} /></div>
        </aside>
      </div>
    </section>
  );
}
