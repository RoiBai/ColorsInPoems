import { useMemo, useState } from 'react';
import type { PoetTrajectory } from './trajectoryTypes';
import { preferredPoets } from './trajectoryUtils';
import { cnNumber, textIncludes } from '../../utils/format';

export function PoetSelector({
  poets,
  selectedPoet,
  onSelect,
}: {
  poets: PoetTrajectory[];
  selectedPoet: PoetTrajectory;
  onSelect: (poet: PoetTrajectory) => void;
}) {
  const [query, setQuery] = useState('');
  const ordered = useMemo(() => {
    const score = (poet: PoetTrajectory) => {
      const preferredIndex = preferredPoets.indexOf(poet.name);
      return preferredIndex >= 0 ? preferredIndex : 100 + poet.summary_stats.color_occurrence_count * -1;
    };
    return poets
      .filter((poet) => !query || textIncludes(poet.name, query) || textIncludes(poet.dynasty, query))
      .sort((a, b) => score(a) - score(b));
  }, [poets, query]);

  return (
    <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
      <label className="text-xs text-mutedInk">诗人选择器</label>
      <input
        className="mt-2 w-full rounded-full border border-stone-300 bg-white/65 px-4 py-2 text-sm outline-none focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/20"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜索诗人"
      />
      <div className="mt-3 max-h-72 overflow-y-auto pr-1">
        {ordered.map((poet) => (
          <button
            key={poet.poet_id}
            className={`mb-2 w-full rounded-lg border p-3 text-left transition hover:border-cinnabar/50 ${
              selectedPoet.poet_id === poet.poet_id ? 'border-cinnabar bg-cinnabar/8' : 'border-stone-200 bg-white/45'
            }`}
            onClick={() => onSelect(poet)}
          >
            <span className="font-song text-lg">{poet.name}</span>
            <span className="ml-2 text-xs text-mutedInk">{poet.dynasty}</span>
            <p className="mt-1 text-xs text-mutedInk">
              {cnNumber(poet.summary_stats.poem_count)} 首 · 可定位 {cnNumber(poet.summary_stats.dated_poem_count)} 首 · 颜色 {cnNumber(poet.summary_stats.color_occurrence_count)} 次
            </p>
            {poet.summary_stats.dated_poem_count < 5 ? (
              <p className="mt-1 text-xs text-cinnabar">该诗人可定年诗作较少</p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
