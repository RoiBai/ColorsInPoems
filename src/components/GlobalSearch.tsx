import { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { SearchIndex } from '../types';
import { EmptyState } from './EmptyState';
import { LoadingBlock } from './Loading';

const typeLabel: Record<string, string> = {
  poet: '诗人',
  color: '颜色',
  poem: '诗句',
  imagery: '意象',
};

export function GlobalSearch() {
  const { searchOpen, setSearchOpen, openDetail, setActiveTab } = useAppState();
  const [query, setQuery] = useState('');
  const { data, loading } = useData<SearchIndex>('/data/stats/search_index.json');
  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return [...data.poets, ...data.colors, ...data.poems, ...data.imageries]
      .filter((item) => `${item.label}${item.meta}`.toLowerCase().includes(q))
      .slice(0, 36);
  }, [data, query]);

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="全局搜索">
      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-stone-200 bg-paper p-4 shadow-paper">
        <div className="flex items-center gap-3">
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white/70 px-5 py-3 text-base outline-none transition focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/20"
            placeholder="搜索诗人、诗题、诗句、颜色、意象、朝代"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="soft-button" type="button" onClick={() => setSearchOpen(false)}>
            关闭
          </button>
        </div>

        <div className="mt-4 max-h-[64vh] overflow-y-auto pr-1">
          {loading ? <LoadingBlock label="正在建立搜索索引" /> : null}
          {!loading && !query.trim() ? <EmptyState message="输入关键词，开始在颜色、诗人、诗句与意象之间穿行。" /> : null}
          {!loading && query.trim() && !results.length ? <EmptyState message="没有找到匹配项，可以换一个颜色词或诗人试试。" /> : null}
          <div className="grid gap-2">
            {results.map((item) => (
              <button
                key={`${item.type}:${item.id}`}
                type="button"
                className="rounded-lg border border-stone-200 bg-white/55 p-4 text-left transition hover:border-cinnabar/50 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-cinnabar/30"
                onClick={() => {
                  setSearchOpen(false);
                  if (item.type === 'color') openDetail({ type: 'color', id: item.id });
                  if (item.type === 'poet') openDetail({ type: 'poet', id: item.id });
                  if (item.type === 'imagery') openDetail({ type: 'imagery', id: item.id });
                  if (item.type === 'poem') openDetail({ type: 'poem', id: item.id });
                }}
              >
                <span className="rounded-full bg-cinnabar/10 px-2 py-1 text-xs text-cinnabar">{typeLabel[item.type]}</span>
                <span className="ml-3 font-song text-lg text-ink">{item.label}</span>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-mutedInk">{item.meta}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
