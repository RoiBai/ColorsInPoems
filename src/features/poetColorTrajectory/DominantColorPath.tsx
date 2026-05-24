import type { PoetTrajectory, TrajectoryMetric, TrajectoryStageBin } from './trajectoryTypes';
import { filteredBins, metricFormat } from './trajectoryUtils';
import { cnNumber } from '../../utils/format';
import { TooltipLine, useTooltip } from '../../tabs/common';

export function DominantColorPath({
  poet,
  uncertaintyMode,
  metric,
  focusedStageId,
  onStageClick,
}: {
  poet: PoetTrajectory;
  uncertaintyMode: 'show-unknown' | 'hide-unknown' | 'only-dated';
  metric: TrajectoryMetric;
  focusedStageId: string;
  onStageClick: (stage: TrajectoryStageBin) => void;
}) {
  const tooltip = useTooltip();
  const bins = filteredBins(poet, uncertaintyMode).filter((stage) => stage.bin_id !== 'unknown' || uncertaintyMode === 'show-unknown');
  const width = Math.max(760, 120 + bins.length * 112);
  const height = 245;
  const points = bins.map((stage, index) => ({
    stage,
    x: 72 + index * ((width - 144) / Math.max(1, bins.length - 1)),
    y: 118 + ((index % 2) - 0.5) * 36,
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
      <h3 className="font-song text-xl font-semibold">主导色迁移轨迹</h3>
      <p className="mt-1 text-sm text-mutedInk">圆点颜色表示阶段最常见颜色，外环表示第二、第三高频颜色，大小表示阶段颜色词总量。</p>
      <div className="chart-scroll">
        <svg className="min-w-[760px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${poet.name}主导色迁移轨迹`}>
          <path d={path} fill="none" stroke="#9f8c70" strokeWidth="2" strokeOpacity="0.35" />
          {points.map(({ stage, x, y }) => {
            const top = stage.dominant_colors;
            const r = Math.max(12, Math.min(34, 12 + Math.sqrt(stage.color_total) * 4));
            return (
              <g
                key={stage.bin_id}
                className="cursor-pointer"
                onClick={() => onStageClick(stage)}
                onMouseMove={tooltip.move}
                onMouseEnter={(event) =>
                  tooltip.show(
                    event,
                    <div>
                      <TooltipLine label="阶段" value={stage.life_stage_label} />
                      <TooltipLine label="颜色词总数" value={cnNumber(stage.color_total)} />
                      <TooltipLine label="Top 5 颜色" value={top.slice(0, 5).map((item) => `${item.color} ${metricFormat(item.share, 'share')}`).join('、') || '暂无'} />
                      <TooltipLine label="主导情绪" value={stage.emotions.slice(0, 3).map((item) => item.emotion).join('、') || '暂无'} />
                      <TooltipLine label="代表诗句" value={stage.sample_lines[0]?.line_text || '暂无'} />
                    </div>,
                  )
                }
                onMouseLeave={tooltip.hide}
              >
                {top[2] ? <circle cx={x} cy={y} r={r + 10} fill="none" stroke={top[2].hex} strokeWidth="4" strokeOpacity="0.38" /> : null}
                {top[1] ? <circle cx={x} cy={y} r={r + 5} fill="none" stroke={top[1].hex} strokeWidth="4" strokeOpacity="0.52" /> : null}
                <circle cx={x} cy={y} r={r} fill={top[0]?.hex || '#d8cab2'} fillOpacity={stage.color_total ? 0.78 : 0.3} stroke={focusedStageId === stage.bin_id ? '#b6453d' : '#fffaf1'} strokeWidth="3" />
                <text x={x} y={y + r + 20} textAnchor="middle" className="fill-ink text-xs">{stage.life_stage_label}</text>
                <text x={x} y={y + 4} textAnchor="middle" className="pointer-events-none fill-ink text-xs font-semibold">{top[0]?.color || '无'}</text>
              </g>
            );
          })}
        </svg>
        {tooltip.node}
      </div>
    </div>
  );
}
