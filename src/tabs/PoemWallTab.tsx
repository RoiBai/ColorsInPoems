import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { PoemColorBand } from '../types';
import { colorGroups, dynasties, textIncludes } from '../utils/format';
import { ChipGroup, SearchBox, SectionHeader } from './common';

export function PoemWallTab() {
  const { data, loading } = useData<PoemColorBand[]>('/data/stats/poem_color_bands.json');
  const { openDetail } = useAppState();
  const [dynasty, setDynasty] = useState('全部');
  const [group, setGroup] = useState('全部');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const filtered = useMemo(() => {
    return (data || []).filter((band) => {
      const dynastyOk = dynasty === '全部' || band.dynasty === dynasty;
      const groupOk = group === '全部' || band.colors.some((color) => color.group === group);
      const queryOk = !query || [band.author, band.title, band.dynasty, band.colors.map((color) => color.color).join('')].some((value) => textIncludes(value, query));
      return dynastyOk && groupOk && queryOk;
    });
  }, [data, dynasty, group, query]);
  const page = filtered.slice(offset, offset + 200);

  if (loading) return <LoadingBlock label="正在加载诗歌色卡墙" />;
  if (!data) return <EmptyState message="诗歌色卡墙数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="诗歌色卡墙" description="把每首诗变成一条色带，颜色顺序按照颜色词在诗中出现顺序排列，展示诗的视觉指纹。" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <ChipGroup label="朝代" options={dynasties} value={dynasty} onChange={(value) => { setDynasty(value); setOffset(0); }} />
          <ChipGroup label="色系" options={colorGroups} value={group} onChange={(value) => { setGroup(value); setOffset(0); }} />
        </div>
        <div className="flex flex-col justify-end gap-3">
          <SearchBox value={query} onChange={(value) => { setQuery(value); setOffset(0); }} placeholder="筛选诗人、颜色词、诗题" />
          <button className="soft-button" onClick={() => setOffset(Math.max(0, Math.floor(Math.random() * Math.max(1, filtered.length - 200))))}>随机换一批</button>
        </div>
      </div>
      {!page.length ? (
        <EmptyState message="当前筛选没有色卡。" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {page.map((band) => (
            <button key={band.poem_id} className="rounded-lg border border-stone-200 bg-white/45 p-3 text-left transition hover:border-cinnabar/50 hover:bg-white/70" onClick={() => openDetail({ type: 'poem', id: band.poem_id })}>
              <div className="mb-2 flex h-8 overflow-hidden rounded border border-stone-200">
                {band.colors.map((color, index) => (
                  <span key={`${color.color}-${index}`} className="min-w-4 flex-1" style={{ background: color.hex }} />
                ))}
              </div>
              <h3 className="truncate font-song text-lg">{band.title}</h3>
              <p className="truncate text-xs text-mutedInk">{band.dynasty} · {band.author}</p>
              <p className="mt-1 truncate text-xs text-mutedInk">{band.colors.map((color) => color.color).join('、')}</p>
            </button>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-between text-sm text-mutedInk">
        <span>显示 {offset + 1}–{Math.min(offset + 200, filtered.length)} / {filtered.length}</span>
        <div className="flex gap-2">
          <button className="soft-button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 200))}>上一页</button>
          <button className="soft-button" disabled={offset + 200 >= filtered.length} onClick={() => setOffset(offset + 200)}>下一页</button>
        </div>
      </div>
    </section>
  );
}
