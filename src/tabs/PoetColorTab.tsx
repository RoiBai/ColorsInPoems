import { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { PoetColorEdge, PoetColorStats } from '../types';
import { clamp, cnNumber, colorGroups, textIncludes } from '../utils/format';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { ChipGroup, SearchBox, SectionHeader, Toggle, TooltipLine, useTooltip } from './common';

function buildVisibleEdges(data: PoetColorStats, dynasty: string, group: string, query: string, onlyCurrent: boolean) {
  const q = query.trim();
  let edges = data.edges.filter((edge) => {
    const dynastyOk = dynasty === '全部' || edge.dynasty === dynasty;
    const groupOk = group === '全部' || edge.color_group === group;
    const queryOk = !q || [edge.poet, edge.color, edge.dynasty, edge.color_group].some((value) => textIncludes(value, q));
    return dynastyOk && groupOk && queryOk;
  });
  if (dynasty === '全部' && !q && !onlyCurrent) {
    const famous = new Set(data.famous_poets);
    const topPoets = new Set(data.poet_counts.slice(0, 10).map((item) => item.poet));
    edges = edges.filter((edge) => famous.has(edge.poet) || topPoets.has(edge.poet));
  }
  const colorTotals = new Map<string, number>();
  edges.forEach((edge) => colorTotals.set(edge.color, (colorTotals.get(edge.color) || 0) + edge.count));
  const keepColors = new Set([...colorTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([color]) => color));
  return edges.filter((edge) => keepColors.has(edge.color)).slice(0, 160);
}

export function PoetColorTab() {
  const { data, loading, error } = useData<PoetColorStats>('/data/stats/poet_color_edges.json');
  const { selectedDynasty, setSelectedDynasty, selectedColor, openDetail } = useAppState();
  const [group, setGroup] = useState('全部');
  const [query, setQuery] = useState('');
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  const [hover, setHover] = useState<{ type: 'poet' | 'color'; id: string } | null>(selectedColor ? { type: 'color', id: selectedColor } : null);
  const tooltip = useTooltip();

  const visible = useMemo(
    () => (data ? buildVisibleEdges(data, selectedDynasty, group, query, onlyCurrent) : []),
    [data, group, onlyCurrent, query, selectedDynasty],
  );

  if (loading) return <LoadingBlock label="正在加载诗人与色彩关联图" />;
  if (error || !data) return <EmptyState message="诗人色彩关联数据加载失败。" />;

  const poets = [...new Set(visible.map((edge) => edge.poet))].slice(0, 18);
  const colors = [...new Set(visible.map((edge) => edge.color))].slice(0, 18);
  const poetY = new Map(poets.map((poet, index) => [poet, 70 + index * (390 / Math.max(1, poets.length - 1))]));
  const colorY = new Map(colors.map((color, index) => [color, 70 + index * (390 / Math.max(1, colors.length - 1))]));
  const max = Math.max(1, ...visible.map((edge) => edge.count));
  const colorMeta = new Map(visible.map((edge) => [edge.color, edge]));
  const poetCount = new Map<string, number>();
  visible.forEach((edge) => poetCount.set(edge.poet, (poetCount.get(edge.poet) || 0) + edge.count));

  const isActive = (edge: PoetColorEdge) => {
    if (!hover) return true;
    return hover.type === 'poet' ? edge.poet === hover.id : edge.color === hover.id;
  };

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title={data.title} description={data.description} />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4">
          <ChipGroup label="朝代筛选" options={data.dynasty_options} value={selectedDynasty} onChange={setSelectedDynasty} />
          <ChipGroup label="色系筛选" options={data.color_groups.length ? data.color_groups : colorGroups} value={group} onChange={setGroup} />
        </div>
        <div className="flex flex-col justify-end gap-3">
          <SearchBox value={query} onChange={setQuery} placeholder="搜索诗人、颜色词、朝代" />
          <Toggle checked={onlyCurrent} label="仅显示当前筛选结果" onChange={setOnlyCurrent} />
        </div>
      </div>

      {!visible.length ? (
        <EmptyState
          message="当前筛选没有关联结果。"
          action={
            <button
              className="soft-button"
              onClick={() => {
                setSelectedDynasty('全部');
                setGroup('全部');
                setQuery('');
              }}
            >
              清空筛选
            </button>
          }
        />
      ) : (
        <div className="chart-scroll">
          <svg className="chart-frame" viewBox="0 0 960 540" role="img" aria-label="诗人与色彩双侧关系图">
            <defs>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#6b5844" floodOpacity="0.14" />
              </filter>
            </defs>
            <text x="56" y="38" className="fill-mutedInk text-sm">诗人</text>
            <text x="842" y="38" className="fill-mutedInk text-sm">色彩</text>
            {visible.map((edge) => {
              const y1 = poetY.get(edge.poet) || 0;
              const y2 = colorY.get(edge.color) || 0;
              const active = isActive(edge);
              return (
                <path
                  key={`${edge.poet}-${edge.color}-${edge.dynasty}`}
                  d={`M 220 ${y1} C 380 ${y1}, 580 ${y2}, 740 ${y2}`}
                  fill="none"
                  stroke={edge.hex}
                  strokeWidth={clamp(1.6 + (edge.count / max) * 11, 1.8, 13)}
                  strokeOpacity={active ? 0.52 : 0.08}
                  onMouseMove={tooltip.move}
                  onMouseEnter={(event) => {
                    setHover({ type: 'poet', id: edge.poet });
                    tooltip.show(
                      event,
                      <div>
                        <TooltipLine label="诗人" value={edge.poet} />
                        <TooltipLine label="颜色" value={edge.color} />
                        <TooltipLine label="次数" value={cnNumber(edge.count)} />
                        <TooltipLine label="代表诗句" value={edge.sample_lines[0]?.line_text || '暂无'} />
                      </div>,
                    );
                  }}
                  onMouseLeave={() => {
                    setHover(null);
                    tooltip.hide();
                  }}
                />
              );
            })}
            {poets.map((poet) => (
              <g
                key={poet}
                role="button"
                aria-label={`查看诗人${poet}详情`}
                tabIndex={0}
                transform={`translate(80 ${poetY.get(poet)})`}
                className="outline-none"
                onMouseEnter={() => setHover({ type: 'poet', id: poet })}
                onMouseLeave={() => setHover(null)}
                onClick={() => openDetail({ type: 'poet', id: poet })}
              >
                <rect x="-12" y="-17" width="130" height="34" rx="17" fill="#fffaf1" stroke={hover?.id === poet ? '#b6453d' : '#cbbda5'} filter="url(#softShadow)" />
                <text x="8" y="5" className="fill-ink text-sm">{poet}</text>
                <text x="105" y="5" textAnchor="end" className="fill-mutedInk text-xs">{cnNumber(poetCount.get(poet) || 0)}</text>
              </g>
            ))}
            {colors.map((color) => {
              const edge = colorMeta.get(color);
              return (
                <g
                  key={color}
                  role="button"
                  aria-label={`查看颜色${color}详情`}
                  tabIndex={0}
                  transform={`translate(785 ${colorY.get(color)})`}
                  onMouseEnter={() => setHover({ type: 'color', id: color })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => openDetail({ type: 'color', id: color })}
                >
                  <circle r="15" fill={edge?.hex || '#888'} stroke={hover?.id === color ? '#1f2a35' : '#fffaf1'} strokeWidth="2" />
                  <text x="26" y="5" className="fill-ink text-sm">{color}</text>
                </g>
              );
            })}
          </svg>
          {tooltip.node}
        </div>
      )}
    </section>
  );
}
