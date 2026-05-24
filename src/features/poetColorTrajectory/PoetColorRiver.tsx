import * as d3 from 'd3';
import type { PoetTrajectory, TrajectoryDetail, TrajectoryMetric, UncertaintyMode } from './trajectoryTypes';
import { filteredBins, findColor, metricFormat, metricValue, topColorsForHeatmap } from './trajectoryUtils';
import { TooltipLine, useTooltip } from '../../tabs/common';
import { cnNumber } from '../../utils/format';

type RiverPoint = {
  stageIndex: number;
  stageLabel: string;
  value: number;
};

function nearestStageIndex(event: React.MouseEvent<SVGPathElement>, width: number, stageCount: number) {
  const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
  if (!rect || stageCount <= 1) return 0;
  const localX = ((event.clientX - rect.left) / rect.width) * width;
  const ratio = Math.max(0, Math.min(1, (localX - 78) / (width - 146)));
  return Math.round(ratio * (stageCount - 1));
}

export function PoetColorRiver({
  poet,
  metric,
  uncertaintyMode,
  colorGroup,
  lockedColor,
  onColorLock,
  onDetail,
}: {
  poet: PoetTrajectory;
  metric: TrajectoryMetric;
  uncertaintyMode: UncertaintyMode;
  colorGroup: string;
  lockedColor: string;
  onColorLock: (color: string) => void;
  onDetail: (detail: TrajectoryDetail) => void;
}) {
  const tooltip = useTooltip();
  const bins = filteredBins(poet, uncertaintyMode).filter((stage) => stage.bin_id !== 'unknown');
  const colorRows = topColorsForHeatmap(poet, bins, colorGroup, 10);
  const width = Math.max(820, 160 + bins.length * 120);
  const height = 340;
  const rows = bins.map((stage, stageIndex) => {
    const row: Record<string, number | string> = { stage: stage.life_stage_label, stageIndex };
    colorRows.forEach((color) => {
      row[color.color] = metricValue(findColor(stage, color.color), metric);
    });
    return row;
  });

  if (!bins.length || !colorRows.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
        <h3 className="font-song text-xl font-semibold">诗人色彩河流</h3>
        <p className="mt-2 text-sm text-mutedInk">当前诗人缺少可进入时间轴的阶段色彩数据。</p>
      </div>
    );
  }

  const stack = d3
    .stack<Record<string, number | string>>()
    .keys(colorRows.map((color) => color.color))
    .offset(d3.stackOffsetWiggle)(rows);
  const x = d3.scalePoint().domain(bins.map((stage) => stage.bin_id)).range([78, width - 68]);
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(stack, (layer) => d3.min(layer, (point) => point[0])) || 0,
      d3.max(stack, (layer) => d3.max(layer, (point) => point[1])) || 1,
    ])
    .range([height - 58, 42]);
  const area = d3
    .area<d3.SeriesPoint<Record<string, number | string>>>()
    .x((point) => x(String(bins[Number(point.data.stageIndex)]?.bin_id)) || 0)
    .y0((point) => y(point[0]))
    .y1((point) => y(point[1]))
    .curve(d3.curveCatmullRom.alpha(0.45));
  const pointSeries = lockedColor
    ? bins.map((stage, stageIndex) => ({
        stageIndex,
        stageLabel: stage.life_stage_label,
        value: metricValue(findColor(stage, lockedColor), metric),
      }))
    : [];
  const line = d3
    .line<RiverPoint>()
    .x((point) => x(bins[point.stageIndex]?.bin_id) || 0)
    .y((point) => {
      const max = Math.max(1, ...pointSeries.map((item) => item.value));
      return height - 62 - (point.value / max) * 88;
    })
    .curve(d3.curveCatmullRom.alpha(0.45));

  return (
    <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-song text-xl font-semibold">诗人色彩河流</h3>
          <p className="text-sm leading-7 text-mutedInk">
            用河流宽度表示颜色在不同人生阶段中的强度，适合观察主导色的涨落和迁移。点击某条色流可锁定该颜色。
          </p>
        </div>
        {lockedColor ? <button className="soft-button" onClick={() => onColorLock('')}>取消锁定：{lockedColor}</button> : null}
      </div>
      <div className="chart-scroll">
        <svg className="chart-frame" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${poet.name}诗人色彩河流`}>
          <rect x="0" y="0" width={width} height={height} rx="16" fill="#fffaf1" opacity="0.34" />
          {stack.map((layer) => {
            const meta = colorRows.find((color) => color.color === layer.key);
            const active = !lockedColor || lockedColor === layer.key;
            return (
              <path
                key={layer.key}
                d={area(layer) || undefined}
                fill={meta?.hex || '#9f8c70'}
                fillOpacity={active ? 0.58 : 0.08}
                stroke={active ? meta?.hex : 'transparent'}
                strokeWidth={active ? 1.2 : 0}
                className="cursor-pointer transition"
                onClick={(event) => {
                  const stage = bins[nearestStageIndex(event, width, bins.length)];
                  const color = stage ? findColor(stage, layer.key) : undefined;
                  onColorLock(lockedColor === layer.key ? '' : layer.key);
                  if (stage && color) onDetail({ type: 'cell', poet, stage, color });
                }}
                onMouseMove={(event) => {
                  const stage = bins[nearestStageIndex(event, width, bins.length)];
                  const color = stage ? findColor(stage, layer.key) : undefined;
                  tooltip.show(
                    event,
                    <div>
                      <TooltipLine label="诗人" value={poet.name} />
                      <TooltipLine label="颜色" value={layer.key} />
                      <TooltipLine label="阶段" value={stage?.life_stage_label || '暂无'} />
                      <TooltipLine label="指标值" value={color ? metricFormat(metricValue(color, metric), metric) : '0'} />
                      <TooltipLine label="出现次数" value={cnNumber(color?.count || 0)} />
                      <TooltipLine label="代表诗句" value={color?.sample_lines[0]?.line_text || '暂无'} />
                    </div>,
                  );
                }}
                onMouseLeave={tooltip.hide}
              />
            );
          })}
          {bins.map((stage) => (
            <g key={stage.bin_id} transform={`translate(${x(stage.bin_id)} ${height - 28})`}>
              <line y1="-8" y2="-2" stroke="#9f8c70" />
              <text textAnchor="middle" className="fill-mutedInk text-xs">{stage.life_stage_label}</text>
            </g>
          ))}
          {lockedColor && pointSeries.length ? (
            <g>
              <path d={line(pointSeries) || undefined} fill="none" stroke="#1f2a35" strokeWidth="2.2" strokeOpacity="0.72" />
              {pointSeries.map((point) => {
                const max = Math.max(1, ...pointSeries.map((item) => item.value));
                const cy = height - 62 - (point.value / max) * 88;
                return (
                  <circle
                    key={`${lockedColor}-${point.stageIndex}`}
                    cx={x(bins[point.stageIndex].bin_id)}
                    cy={cy}
                    r="4"
                    fill="#1f2a35"
                    stroke="#fffaf1"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          ) : null}
        </svg>
        {tooltip.node}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {colorRows.map((color) => (
          <button
            key={color.color}
            className={`rounded-full border px-3 py-1 text-sm ${lockedColor === color.color ? 'border-cinnabar bg-cinnabar text-white' : 'border-stone-200 bg-white/60'}`}
            onClick={() => onColorLock(lockedColor === color.color ? '' : color.color)}
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
            {color.color}
          </button>
        ))}
      </div>
    </div>
  );
}
