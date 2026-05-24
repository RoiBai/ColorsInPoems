import type { PoetTrajectory, SemanticLayer, TrajectoryStageBin } from './trajectoryTypes';
import { filteredBins } from './trajectoryUtils';
import { TooltipLine, useTooltip } from '../../tabs/common';
import { cnNumber } from '../../utils/format';

export function EmotionSceneMatrix({
  poet,
  semanticLayer,
  uncertaintyMode,
  focusedStageId,
  onStageClick,
}: {
  poet: PoetTrajectory;
  semanticLayer: SemanticLayer;
  uncertaintyMode: 'show-unknown' | 'hide-unknown' | 'only-dated';
  focusedStageId: string;
  onStageClick: (stage: TrajectoryStageBin) => void;
}) {
  const tooltip = useTooltip();
  const bins = filteredBins(poet, uncertaintyMode).filter((stage) => stage.bin_id !== 'unknown');
  const useScenes = semanticLayer === 'scene';
  const rows = [
    ...new Set(
      bins.flatMap((stage) => (useScenes ? stage.scenes.map((item) => item.scene) : stage.emotions.map((item) => item.emotion))),
    ),
  ].slice(0, 10);
  const width = Math.max(760, 170 + bins.length * 112);
  const height = Math.max(250, 80 + rows.length * 34);
  const max = Math.max(
    1,
    ...bins.flatMap((stage) => (useScenes ? stage.scenes : stage.emotions).map((item) => item.count)),
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
      <h3 className="font-song text-xl font-semibold">情绪 / 场景随色彩变化的关联视图</h3>
      <p className="mt-1 text-sm text-mutedInk">{useScenes ? '颜色—场景矩阵：每个格子显示该阶段该场景最相关颜色。' : '颜色—情绪矩阵：每个格子显示该阶段该情绪最相关颜色。'}</p>
      <div className="chart-scroll">
        <svg className="chart-frame" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${poet.name}颜色情绪场景矩阵`}>
          {bins.map((stage, index) => (
            <text key={stage.bin_id} x={165 + index * 112 + 45} y="32" textAnchor="middle" className={focusedStageId === stage.bin_id ? 'fill-cinnabar text-xs font-semibold' : 'fill-mutedInk text-xs'}>
              {stage.life_stage_label}
            </text>
          ))}
          {rows.map((row, rowIndex) => {
            const y = 58 + rowIndex * 34;
            return (
              <g key={row}>
                <text x="28" y={y + 20} className="fill-ink text-sm">{row}</text>
                {bins.map((stage, index) => {
                  const item = (useScenes ? stage.scenes : stage.emotions).find((entry) => ('scene' in entry ? entry.scene : entry.emotion) === row);
                  const top = item?.top_colors?.[0];
                  const intensity = item ? item.count / max : 0;
                  return (
                    <rect
                      key={`${stage.bin_id}-${row}`}
                      x={165 + index * 112}
                      y={y}
                      width="92"
                      height="26"
                      rx="8"
                      fill={top?.hex || '#e6dccb'}
                      fillOpacity={item ? 0.16 + intensity * 0.72 : 0.14}
                      stroke={focusedStageId === stage.bin_id ? '#b6453d' : top?.hex || '#d8cab2'}
                      className="cursor-pointer"
                      onMouseMove={tooltip.move}
                      onMouseEnter={(event) =>
                        tooltip.show(
                          event,
                          <div>
                            <TooltipLine label="阶段" value={stage.life_stage_label} />
                            <TooltipLine label={useScenes ? '场景' : '情绪'} value={row} />
                            <TooltipLine label="关联最多颜色" value={top ? `${top.color}（${cnNumber(top.count)}）` : '暂无'} />
                            <TooltipLine label="代表诗句" value={stage.sample_lines[0]?.line_text || '暂无'} />
                          </div>,
                        )
                      }
                      onMouseLeave={tooltip.hide}
                      onClick={() => onStageClick(stage)}
                    />
                  );
                })}
              </g>
            );
          })}
          {rows.map((row, rowIndex) =>
            bins.map((stage, index) => {
              const item = (useScenes ? stage.scenes : stage.emotions).find((entry) => ('scene' in entry ? entry.scene : entry.emotion) === row);
              const top = item?.top_colors?.[0];
              if (!top) return null;
              return (
                <text key={`${stage.bin_id}-${row}-label`} x={165 + index * 112 + 46} y={58 + rowIndex * 34 + 18} textAnchor="middle" className="pointer-events-none fill-ink text-xs">
                  {top.color}
                </text>
              );
            }),
          )}
        </svg>
        {tooltip.node}
      </div>
    </div>
  );
}
