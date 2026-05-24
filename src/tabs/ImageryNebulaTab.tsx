import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ImageryBubble, ImageryBubbleStats } from '../types';
import { clamp, cnNumber } from '../utils/format';
import { ChipGroup, LinesList, SectionHeader, Toggle, TooltipLine, useTooltip } from './common';

export function ImageryNebulaTab() {
  const { data, loading } = useData<ImageryBubbleStats>('/data/stats/imagery_color_bubbles.json');
  const { openDetail } = useAppState();
  const [category, setCategory] = useState('全部');
  const [highOnly, setHighOnly] = useState(true);
  const [hovered, setHovered] = useState<ImageryBubble | null>(null);
  const tooltip = useTooltip();

  const bubbles = useMemo(() => {
    const source = data?.bubbles || [];
    return source
      .filter((item) => category === '全部' || item.category === category)
      .filter((item, index) => !highOnly || index < 18 || item.count > 12)
      .slice(0, highOnly ? 24 : 42);
  }, [category, data, highOnly]);

  if (loading) return <LoadingBlock label="正在加载意象色彩星云" />;
  if (!data) return <EmptyState message="意象色彩星云数据加载失败。" />;
  const max = Math.max(1, ...bubbles.map((item) => item.count));
  const center = { x: 460, y: 285 };
  const active = hovered || bubbles[0];

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="意象色彩星云" description="以意象与情绪为中心，hover 后展开相关颜色小圆点；圆点大小代表该意象下颜色出现次数。" />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <ChipGroup label="类别筛选" options={data.categories} value={category} onChange={setCategory} />
        <Toggle checked={highOnly} label="只看高频" onChange={setHighOnly} />
      </div>
      {!bubbles.length ? (
        <EmptyState message="当前类别暂无可展示星云。" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="chart-scroll">
            <svg className="chart-frame" viewBox="0 0 920 570" role="img" aria-label="意象色彩星云">
              <rect x="22" y="22" width="876" height="526" rx="18" fill="#fffaf1" opacity="0.34" />
              {bubbles.map((bubble, index) => {
                const angle = (Math.PI * 2 * index) / bubbles.length;
                const orbit = 100 + (index % 4) * 62;
                const x = center.x + Math.cos(angle) * orbit;
                const y = center.y + Math.sin(angle) * orbit * 0.72;
                const r = clamp(20 + Math.sqrt(bubble.count / max) * 42, 22, 66);
                const isActive = active?.id === bubble.id;
                return (
                  <g key={bubble.id}>
                    <line x1={center.x} y1={center.y} x2={x} y2={y} stroke={bubble.main_color.hex} strokeOpacity={isActive ? 0.28 : 0.08} />
                    {isActive
                      ? bubble.colors.slice(0, 9).map((color, colorIndex) => {
                          const a = (Math.PI * 2 * colorIndex) / bubble.colors.slice(0, 9).length;
                          const cx = x + Math.cos(a) * (r + 40);
                          const cy = y + Math.sin(a) * (r + 40);
                          return (
                            <circle
                              key={color.color}
                              cx={cx}
                              cy={cy}
                              r={clamp(6 + (color.count / bubble.colors[0].count) * 13, 7, 19)}
                              fill={color.hex}
                              stroke="#fffaf1"
                              strokeWidth="2"
                              onClick={() =>
                                openDetail({
                                  type: 'combo',
                                  id: `${bubble.name}-${color.color}`,
                                  title: `${bubble.name} × ${color.color}`,
                                  payload: { sample_lines: bubble.sample_lines },
                                })
                              }
                            />
                          );
                        })
                      : null}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? r + 6 : r}
                      fill={bubble.main_color.hex}
                      fillOpacity="0.62"
                      stroke={isActive ? '#b6453d' : '#fffaf1'}
                      strokeWidth="2"
                      onMouseMove={tooltip.move}
                      onMouseEnter={(event) => {
                        setHovered(bubble);
                        tooltip.show(
                          event,
                          <div>
                            <TooltipLine label="意象" value={bubble.name} />
                            <TooltipLine label="颜色数" value={bubble.colors.length} />
                            <TooltipLine label="关联数量" value={cnNumber(bubble.count)} />
                          </div>,
                        );
                      }}
                      onMouseLeave={() => {
                        setHovered(null);
                        tooltip.hide();
                      }}
                      onClick={() => openDetail({ type: 'imagery', id: bubble.name })}
                    />
                    <text x={x} y={y + 5} textAnchor="middle" className="pointer-events-none fill-ink font-song text-sm font-semibold">
                      {bubble.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            {tooltip.node}
          </div>
          <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-xl font-semibold">{active?.name}</h3>
            <p className="mt-1 text-sm text-mutedInk">关联诗词 {cnNumber(active?.poem_count || 0)}，主色 {active?.main_color.color}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {active?.colors.slice(0, 10).map((color) => (
                <button key={color.color} className="rounded-full border border-stone-200 bg-white/60 px-3 py-1 text-sm" onClick={() => openDetail({ type: 'color', id: color.color })}>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
                  {color.color}
                </button>
              ))}
            </div>
            {active ? <div className="mt-4"><LinesList lines={active.sample_lines} max={4} /></div> : null}
          </aside>
        </div>
      )}
    </section>
  );
}
