import type { PoetLifeEvent, PoetTrajectory, TrajectoryStageBin } from './trajectoryTypes';
import { eventNeighborStages } from './trajectoryUtils';
import { cnNumber } from '../../utils/format';

export function PoetLifeEventRail({
  poet,
  selectedStageId,
  onStageSelect,
  onEventSelect,
}: {
  poet: PoetTrajectory;
  selectedStageId: string;
  onStageSelect: (stage: TrajectoryStageBin) => void;
  onEventSelect: (event: PoetLifeEvent, before?: TrajectoryStageBin, after?: TrajectoryStageBin) => void;
}) {
  const stageBins = poet.time_bins.filter((stage) => stage.bin_id !== 'unknown');
  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
        <p className="text-xs text-cinnabar">诗人信息</p>
        <h3 className="font-song text-2xl font-semibold">{poet.name}</h3>
        <p className="mt-1 text-sm text-mutedInk">
          {poet.dynasty}
          {poet.birth_year && poet.death_year ? ` · ${poet.birth_year}–${poet.death_year}` : ''}
        </p>
        <p className="mt-3 text-sm leading-7 text-mutedInk">{poet.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-mutedInk">
          <span className="rounded bg-white/55 p-2">语料诗作 {cnNumber(poet.summary_stats.poem_count)}</span>
          <span className="rounded bg-white/55 p-2">可定位 {cnNumber(poet.summary_stats.dated_poem_count)}</span>
          <span className="rounded bg-white/55 p-2">未定年 {cnNumber(poet.summary_stats.unknown_poem_count)}</span>
          <span className="rounded bg-white/55 p-2">颜色词 {cnNumber(poet.summary_stats.color_occurrence_count)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {poet.summary_stats.top_colors.slice(0, 5).map((color) => (
            <span key={color.color} className="rounded-full bg-white/65 px-2 py-1 text-xs">
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color.hex }} />
              {color.color}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
        <h3 className="font-song text-xl font-semibold">人生阶段</h3>
        <div className="mt-3 space-y-2">
          {stageBins.map((stage) => (
            <button
              key={stage.bin_id}
              className={`w-full rounded-lg border p-3 text-left transition hover:border-cinnabar/50 ${
                selectedStageId === stage.bin_id ? 'border-cinnabar bg-cinnabar/8' : 'border-stone-200 bg-white/45'
              }`}
              onClick={() => onStageSelect(stage)}
            >
              <p className="font-song text-base font-semibold">{stage.life_stage_label}</p>
              <p className="text-xs text-mutedInk">
                {stage.start_year}–{stage.end_year} · {stage.poem_count} 首 · {stage.color_total} 次颜色
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
        <h3 className="font-song text-xl font-semibold">关键事件</h3>
        {poet.events.length ? (
          <div className="mt-3 space-y-2">
            {poet.events.map((event) => {
              const { before, after } = eventNeighborStages(poet, event.year);
              return (
                <button key={event.event_id} className="w-full rounded-lg border border-stone-200 bg-white/45 p-3 text-left hover:border-cinnabar/50" onClick={() => onEventSelect(event, before, after)}>
                  <span className="rounded bg-cinnabar/10 px-2 py-1 text-xs text-cinnabar">{event.year}</span>
                  <span className="ml-2 font-song text-base">{event.label}</span>
                  <p className="mt-2 text-xs leading-5 text-mutedInk">{event.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-mutedInk">当前 seed 暂无关键事件。</p>
        )}
      </div>
    </aside>
  );
}
