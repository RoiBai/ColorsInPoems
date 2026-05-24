import { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { DynastyStreamStats } from '../types';
import { cnNumber } from '../utils/format';
import { SectionHeader, TooltipLine, useTooltip } from './common';

type Mode = 'count' | 'per_thousand_poems' | 'per_ten_thousand_chars';

export function DynastyStreamTab() {
  const { data, loading } = useData<DynastyStreamStats>('/data/stats/dynasty_stream.json');
  const { openDetail } = useAppState();
  const [mode, setMode] = useState<Mode>('per_thousand_poems');
  const [locked, setLocked] = useState('');
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const tooltip = useTooltip();

  useEffect(() => {
    if (!playing || !data) return;
    const timer = window.setInterval(() => setPlayIndex((value) => (value + 1) % data.dynasties.length), 1200);
    return () => window.clearInterval(timer);
  }, [data, playing]);

  const chart = useMemo(() => {
    if (!data) return null;
    const width = 900;
    const height = 430;
    const matrix = data.dynasties.map((dynasty) => {
      const row: Record<string, number | string> = { dynasty };
      data.colors.forEach((color) => {
        const found = data.rows.find((item) => item.dynasty === dynasty && item.color === color.color);
        row[color.color] = found ? Number(found[mode]) : 0;
      });
      return row;
    });
    const stack = d3.stack<Record<string, number | string>>().keys(data.colors.map((color) => color.color)).offset(d3.stackOffsetWiggle)(matrix);
    const x = d3.scalePoint().domain(data.dynasties).range([70, width - 50]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(stack, (layer) => d3.min(layer, (point) => point[0])) || 0, d3.max(stack, (layer) => d3.max(layer, (point) => point[1])) || 1])
      .range([height - 50, 40]);
    const area = d3
      .area<d3.SeriesPoint<Record<string, number | string>>>()
      .x((point) => x(String(point.data.dynasty)) || 0)
      .y0((point) => y(point[0]))
      .y1((point) => y(point[1]))
      .curve(d3.curveCatmullRom.alpha(0.4));
    return { width, height, stack, area, x };
  }, [data, mode]);

  if (loading) return <LoadingBlock label="正在加载朝代色彩河流" />;
  if (!data || !chart) return <EmptyState message="朝代色彩河流数据加载失败。" />;

  const currentDynasty = data.dynasties[playIndex] || data.dynasties[0];
  const currentTop = data.rows.filter((row) => row.dynasty === currentDynasty).sort((a, b) => b[mode] - a[mode]).slice(0, 5);

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="朝代色彩河流" description="以 streamgraph 展示颜色随朝代变化的流行趋势，可按原始次数、每千首或每万字归一化查看。" />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([
          ['count', '原始次数'],
          ['per_thousand_poems', '每千首归一化'],
          ['per_ten_thousand_chars', '每万字归一化'],
        ] as Array<[Mode, string]>).map(([key, label]) => (
          <button key={key} className={`pill-button ${mode === key ? 'pill-button-active' : ''}`} onClick={() => setMode(key)}>{label}</button>
        ))}
        <button className="soft-button" onClick={() => setPlaying(!playing)}>{playing ? '暂停播放' : '播放朝代'}</button>
        {locked ? <button className="soft-button" onClick={() => setLocked('')}>清空锁定：{locked}</button> : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="chart-scroll">
          <svg className="chart-frame" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="朝代色彩河流 streamgraph">
            {chart.stack.map((layer) => {
              const colorMeta = data.colors.find((item) => item.color === layer.key);
              const active = !locked || locked === layer.key;
              return (
                <path
                  key={layer.key}
                  d={chart.area(layer) || undefined}
                  fill={colorMeta?.hex || '#888'}
                  fillOpacity={active ? 0.56 : 0.09}
                  stroke={active ? colorMeta?.hex : 'transparent'}
                  strokeWidth={active ? 1 : 0}
                  onClick={() => setLocked(layer.key)}
                  onMouseMove={tooltip.move}
                  onMouseEnter={(event) => {
                    const row = data.rows.find((item) => item.dynasty === currentDynasty && item.color === layer.key);
                    tooltip.show(
                      event,
                      <div>
                        <TooltipLine label="颜色" value={layer.key} />
                        <TooltipLine label="朝代" value={currentDynasty} />
                        <TooltipLine label="次数" value={cnNumber(row?.count || 0)} />
                        <TooltipLine label="高频诗人" value={row?.top_poets.map((item) => item.poet).join('、') || '暂无'} />
                        <TooltipLine label="代表诗句" value={row?.sample_line?.line_text || '暂无'} />
                      </div>,
                    );
                  }}
                  onMouseLeave={tooltip.hide}
                />
              );
            })}
            {data.dynasties.map((dynasty, index) => (
              <g key={dynasty} transform={`translate(${chart.x(dynasty)} ${chart.height - 24})`}>
                <line y1="-8" y2="-2" stroke="#9f8c70" />
                <text textAnchor="middle" className={`text-xs ${index === playIndex ? 'fill-cinnabar font-semibold' : 'fill-mutedInk'}`}>{dynasty}</text>
              </g>
            ))}
          </svg>
          {tooltip.node}
        </div>
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">{currentDynasty} Top 5</h3>
          <div className="mt-4 space-y-2">
            {currentTop.map((row) => (
              <button key={row.color} className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white/50 p-2" onClick={() => openDetail({ type: 'color', id: row.color })}>
                <span><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: row.hex }} />{row.color}</span>
                <span className="text-sm text-mutedInk">{Number(row[mode]).toFixed(mode === 'count' ? 0 : 1)}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 font-song leading-7">{currentTop[0]?.sample_line?.line_text || '暂无代表诗句'}</p>
        </aside>
      </div>
    </section>
  );
}
