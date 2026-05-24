import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ImageryBubble, ImageryBubbleStats } from '../types';
import { clamp, cnNumber } from '../utils/format';
import { ChipGroup, LinesList, SectionHeader, TooltipLine, useTooltip } from './common';

function positions(items: ImageryBubble[]) {
  const columns = 5;
  return new Map(
    items.map((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = 120 + col * 170 + (row % 2) * 38;
      const y = 95 + row * 116;
      return [item.id, { x, y }];
    }),
  );
}

export function ImageryBubbleTab() {
  const { data, loading, error } = useData<ImageryBubbleStats>('/data/stats/imagery_color_bubbles.json');
  const { openDetail } = useAppState();
  const [category, setCategory] = useState('全部');
  const [hovered, setHovered] = useState<ImageryBubble | null>(null);
  const tooltip = useTooltip();

  const bubbles = useMemo(() => {
    const source = data?.bubbles || [];
    return source.filter((item) => category === '全部' || item.category === category).slice(0, 28);
  }, [category, data]);

  if (loading) return <LoadingBlock label="正在加载色彩意象气泡图" />;
  if (error || !data) return <EmptyState message="色彩意象关联数据加载失败。" />;

  const max = Math.max(1, ...bubbles.map((item) => item.count));
  const pos = positions(bubbles);
  const height = Math.max(520, 170 + Math.ceil(bubbles.length / 5) * 116);
  const focus = hovered || bubbles[0];

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title={data.title} description={data.description} hint={data.hint} />
      <div className="mb-5">
        <ChipGroup label="意象类别筛选" options={data.categories} value={category} onChange={setCategory} />
      </div>
      {!bubbles.length ? (
        <EmptyState message="当前类别暂无意象气泡。" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="chart-scroll">
            <svg className="chart-frame" viewBox={`0 0 920 ${height}`} role="img" aria-label="色彩与情感意象关联气泡图">
              {bubbles.map((bubble) => {
                const p = pos.get(bubble.id) || { x: 0, y: 0 };
                const r = clamp(28 + Math.sqrt(bubble.count / max) * 52, 30, 80);
                const active = hovered?.id === bubble.id;
                return (
                  <g key={bubble.id}>
                    {active
                      ? bubble.colors.slice(0, 7).map((color, index) => {
                          const angle = (Math.PI * 2 * index) / Math.max(1, bubble.colors.slice(0, 7).length);
                          const cx = p.x + Math.cos(angle) * (r + 36);
                          const cy = p.y + Math.sin(angle) * (r + 36);
                          return (
                            <circle
                              key={color.color}
                              cx={cx}
                              cy={cy}
                              r={clamp(7 + color.count / bubble.colors[0].count * 10, 7, 18)}
                              fill={color.hex}
                              stroke="#fffaf1"
                              strokeWidth="2"
                              onClick={() => openDetail({ type: 'color', id: color.color })}
                            />
                          );
                        })
                      : null}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active ? r + 8 : r}
                      fill={bubble.main_color.hex}
                      fillOpacity="0.72"
                      stroke={active ? '#b6453d' : '#fffaf1'}
                      strokeWidth="2"
                      className="transition-all duration-200"
                      onMouseMove={tooltip.move}
                      onMouseEnter={(event) => {
                        setHovered(bubble);
                        tooltip.show(
                          event,
                          <div>
                            <TooltipLine label="意象" value={bubble.name} />
                            <TooltipLine label="类别" value={bubble.category} />
                            <TooltipLine label="关联诗词" value={cnNumber(bubble.poem_count)} />
                            <TooltipLine label="主色彩" value={bubble.main_color.color} />
                          </div>,
                        );
                      }}
                      onMouseLeave={() => {
                        setHovered(null);
                        tooltip.hide();
                      }}
                      onClick={() => openDetail({ type: 'imagery', id: bubble.name })}
                    />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" className="pointer-events-none fill-ink font-song text-base font-semibold">
                      {bubble.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            {tooltip.node}
          </div>
          <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-xl font-semibold">{focus?.name || '意象详情'}</h3>
            <p className="mt-1 text-sm text-mutedInk">右侧显示该意象下 Top 5 颜色与代表诗句。</p>
            <div className="mt-4 space-y-2">
              {(focus?.colors || []).slice(0, 5).map((color) => (
                <button key={color.color} className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white/50 p-2 text-left" onClick={() => openDetail({ type: 'color', id: color.color })}>
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ background: color.hex }} />
                    {color.color}
                  </span>
                  <span className="text-sm text-mutedInk">{cnNumber(color.count)}</span>
                </button>
              ))}
            </div>
            {focus ? <div className="mt-4"><LinesList lines={focus.sample_lines} max={3} /></div> : null}
          </aside>
        </div>
      )}
    </section>
  );
}
