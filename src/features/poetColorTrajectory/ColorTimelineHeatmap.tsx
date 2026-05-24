import type {
  DateCertainty,
  PoetTrajectory,
  SemanticLayer,
  TimeGranularity,
  TrajectoryMetric,
  TrajectoryStageBin,
  UncertaintyMode,
  StageColor,
} from './trajectoryTypes';
import { filteredBins, findColor, metricFormat, metricValue, stageLabel, topColorsForHeatmap } from './trajectoryUtils';
import { cnNumber } from '../../utils/format';
import { useTooltip, TooltipLine } from '../../tabs/common';
import { hexToRgba } from '../../utils/color';

const certaintyText: Record<DateCertainty, string> = {
  exact: '确切年份',
  estimated: '估计年份',
  range: '年份范围',
  stage: '仅可归入人生阶段',
  unknown: '未定年',
};

function certaintyClass(stage: TrajectoryStageBin) {
  if (stage.bin_id === 'unknown') return { strokeDasharray: '5 5', opacity: 0.45 };
  if (stage.date_certainty_mix.stage || stage.date_certainty_mix.range) return { strokeDasharray: '4 3', opacity: 1 };
  if (stage.date_certainty_mix.estimated) return { strokeDasharray: '2 3', opacity: 1 };
  return { strokeDasharray: undefined, opacity: 1 };
}

export function ColorTimelineHeatmap({
  poet,
  metric,
  colorGroup,
  timeGranularity,
  semanticLayer,
  uncertaintyMode,
  focusedStageId,
  lockedColor,
  onCellClick,
  onStageClick,
  onColorLock,
}: {
  poet: PoetTrajectory;
  metric: TrajectoryMetric;
  colorGroup: string;
  timeGranularity: TimeGranularity;
  semanticLayer: SemanticLayer;
  uncertaintyMode: UncertaintyMode;
  focusedStageId: string;
  lockedColor: string;
  onCellClick: (stage: TrajectoryStageBin, color: StageColor) => void;
  onStageClick: (stage: TrajectoryStageBin) => void;
  onColorLock: (color: string) => void;
}) {
  const tooltip = useTooltip();
  const bins = filteredBins(poet, uncertaintyMode);
  const rows = topColorsForHeatmap(poet, bins, colorGroup, 12);
  const width = Math.max(860, 190 + bins.length * 118);
  const height = Math.max(360, 120 + rows.length * 34);
  const cellWidth = Math.max(72, (width - 190) / Math.max(1, bins.length));
  const cellHeight = 28;
  const maxValue = Math.max(
    1,
    ...bins.flatMap((stage) => rows.map((row) => metricValue(findColor(stage, row.color), metric))),
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-song text-xl font-semibold">诗人时间轴色彩热力图</h3>
          <p className="text-sm text-mutedInk">横轴为时间 / 阶段，纵轴为该诗人 Top 颜色；虚线表示时间归属不够精确。</p>
        </div>
        {lockedColor ? (
          <button className="soft-button" onClick={() => onColorLock('')}>取消锁定：{lockedColor}</button>
        ) : null}
      </div>
      <div className="chart-scroll">
        <svg className="chart-frame" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${poet.name}诗人时间轴色彩热力图`}>
          <rect x="0" y="0" width={width} height={height} rx="16" fill="#fffaf1" opacity="0.3" />
          {bins.map((stage, index) => {
            const x = 170 + index * cellWidth + cellWidth / 2;
            return (
              <g key={stage.bin_id} transform={`translate(${x} 34)`} onClick={() => onStageClick(stage)} className="cursor-pointer">
                {semanticLayer === 'event'
                  ? poet.events
                      .filter((event) => stage.start_year !== null && stage.end_year !== null && event.year >= stage.start_year && event.year <= stage.end_year)
                      .map((event) => (
                        <g key={event.event_id}>
                          <line y1="-10" y2={height - 74} stroke="#b6453d" strokeDasharray="3 4" strokeOpacity="0.55" />
                          <text y="-16" textAnchor="middle" className="fill-cinnabar text-[11px]">{event.label}</text>
                        </g>
                      ))
                  : null}
                <text textAnchor="middle" className={`text-xs ${focusedStageId === stage.bin_id ? 'fill-cinnabar font-semibold' : 'fill-mutedInk'}`}>
                  {stageLabel(stage, timeGranularity === 'event' ? 'stage' : timeGranularity)}
                </text>
              </g>
            );
          })}
          {rows.map((row, rowIndex) => {
            const y = 74 + rowIndex * 34;
            return (
              <g key={row.color}>
                <g className="cursor-pointer" onClick={() => onColorLock(lockedColor === row.color ? '' : row.color)}>
                  <circle cx="28" cy={y + 14} r="8" fill={row.hex} stroke="#fffaf1" />
                  <text x="44" y={y + 18} className={`text-sm ${lockedColor === row.color ? 'fill-cinnabar font-semibold' : 'fill-ink'}`}>{row.color}</text>
                  <text x="116" y={y + 18} className="fill-mutedInk text-xs">{row.group}</text>
                </g>
                {bins.map((stage, colIndex) => {
                  const color = findColor(stage, row.color);
                  const value = metricValue(color, metric);
                  const intensity = value / maxValue;
                  const x = 170 + colIndex * cellWidth;
                  const focused = focusedStageId === stage.bin_id || lockedColor === row.color;
                  const active = (!focusedStageId && !lockedColor) || focused;
                  const certainty = certaintyClass(stage);
                  return (
                    <rect
                      key={`${stage.bin_id}-${row.color}`}
                      x={x + 8}
                      y={y}
                      width={cellWidth - 14}
                      height={cellHeight}
                      rx="8"
                      fill={color ? row.hex : '#e6dccb'}
                      fillOpacity={color ? 0.18 + intensity * 0.74 : 0.16}
                      stroke={focused ? '#b6453d' : color ? row.hex : '#d8cab2'}
                      strokeWidth={focused ? 2 : 1}
                      strokeDasharray={certainty.strokeDasharray}
                      opacity={active ? certainty.opacity : 0.25}
                      className="cursor-pointer transition"
                      onMouseMove={tooltip.move}
                      onMouseEnter={(event) =>
                        tooltip.show(
                          event,
                          <div>
                            <TooltipLine label="诗人" value={poet.name} />
                            <TooltipLine label="时间段" value={stage.life_stage_label} />
                            <TooltipLine label="颜色词" value={row.color} />
                            <TooltipLine label="出现次数" value={cnNumber(color?.count || 0)} />
                            <TooltipLine label="归一化频率" value={color ? metricFormat(value, metric) : '0'} />
                            <TooltipLine label="时间确定性" value={Object.entries(stage.date_certainty_mix).filter(([, count]) => count).map(([key, count]) => `${certaintyText[key as DateCertainty]} ${count}`).join('；') || '暂无'} />
                            <TooltipLine label="颜色多义说明" value={color?.ambiguity_note || '暂无'} />
                            <TooltipLine label="代表诗句" value={color?.sample_lines.slice(0, 2).map((line) => line.line_text).join(' / ') || '暂无'} />
                          </div>,
                        )
                      }
                      onMouseLeave={tooltip.hide}
                      onClick={() => color ? onCellClick(stage, color) : onStageClick(stage)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        {tooltip.node}
      </div>
      {lockedColor ? (
        <div className="mt-4 rounded-lg border border-stone-200 bg-white/50 p-3">
          <p className="text-sm text-mutedInk">已锁定颜色「{lockedColor}」：下方显示它在诗人一生阶段中的变化曲线。</p>
          <div className="mt-3 flex h-16 items-end gap-2">
            {bins.map((stage) => {
              const color = findColor(stage, lockedColor);
              const value = metricValue(color, metric);
              const height = maxValue ? Math.max(3, (value / maxValue) * 56) : 3;
              return (
                <span key={stage.bin_id} className="flex flex-1 flex-col items-center gap-1">
                  <span className="w-full rounded-t" style={{ height, background: color?.hex || '#d8cab2', opacity: color ? 0.75 : 0.25 }} />
                  <span className="max-w-20 truncate text-[10px] text-mutedInk">{stage.life_stage_label}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-3 rounded-lg border border-stone-200 bg-white/35 p-3 text-xs leading-6 text-mutedInk">
        时间确定性图例：正常边框 = exact；短虚线 = estimated；长虚线 = range / stage；淡化 = unknown。色值为可视化近似。
      </div>
    </div>
  );
}
