import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { PoetColorStats, PoetDetail } from '../types';
import { cnNumber, colorGroups, dynasties, textIncludes } from '../utils/format';
import { ChipGroup, LinesList, SearchBox, SectionHeader, Toggle } from './common';

type PoetIndex = Record<string, PoetDetail>;

function Palette({ poet, detail, group, onlyShared, shared, onColor }: { poet: string; detail?: PoetDetail; group: string; onlyShared: boolean; shared: Set<string>; onColor: (color: string) => void }) {
  const colors = (detail?.top_colors || []).filter((color) => (group === '全部' || color.group === group) && (!onlyShared || shared.has(color.color)));
  if (!detail) return <EmptyState message={`${poet || '诗人'}暂无详情。`} />;
  return (
    <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
      <div className="mb-3">
        <h3 className="font-song text-2xl font-semibold">{detail.poet}</h3>
        <p className="text-sm text-mutedInk">{detail.dynasty} · {cnNumber(detail.poem_count)} 首 · 颜色词 {cnNumber(detail.color_total)} 次</p>
      </div>
      <div className="flex min-h-20 overflow-hidden rounded-lg border border-stone-200">
        {colors.map((color) => (
          <button key={color.color} className="group relative min-w-10 flex-1 transition hover:brightness-105" style={{ background: color.hex, flexGrow: color.count }} onClick={() => onColor(color.color)}>
            <span className="absolute inset-x-0 bottom-1 text-center text-xs font-medium text-ink drop-shadow-sm">{color.color}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <p className="text-mutedInk">高频颜色 Top 5：{detail.top_colors.slice(0, 5).map((color) => color.color).join('、')}</p>
        <p className="text-mutedInk">高频意象 Top 5：{detail.top_imageries.slice(0, 5).map((item) => item.imagery).join('、') || '暂无'}</p>
      </div>
    </div>
  );
}

export function PoetPaletteTab() {
  const { data: poetIndex, loading } = useData<PoetIndex>('/data/stats/poet_detail_index.json');
  const { data: edgeStats } = useData<PoetColorStats>('/data/stats/poet_color_edges.json');
  const { selectedPoet, setSelectedPoet, openDetail } = useAppState();
  const poets = useMemo(() => Object.values(poetIndex || {}).sort((a, b) => b.color_total - a.color_total), [poetIndex]);
  const [query, setQuery] = useState('');
  const [dynasty, setDynasty] = useState('全部');
  const [group, setGroup] = useState('全部');
  const [poetA, setPoetA] = useState(selectedPoet || '');
  const [poetB, setPoetB] = useState('');
  const [onlyShared, setOnlyShared] = useState(false);
  const activeA = poetA || selectedPoet || poets[0]?.poet || '';
  const activeB = poetB || poets.find((poet) => poet.poet !== activeA)?.poet || '';
  const shared = new Set((poetIndex?.[activeA]?.top_colors || []).map((color) => color.color).filter((color) => (poetIndex?.[activeB]?.top_colors || []).some((other) => other.color === color)));
  const list = poets.filter((poet) => (dynasty === '全部' || poet.dynasty === dynasty) && (!query || textIncludes(poet.poet, query))).slice(0, 80);

  if (loading) return <LoadingBlock label="正在加载诗人调色盘" />;
  if (!poetIndex) return <EmptyState message="诗人调色盘数据加载失败。" />;

  const handleColor = (poet: string, color: string) => {
    const edge = edgeStats?.edges.find((item) => item.poet === poet && item.color === color);
    openDetail({ type: 'combo', id: `${poet}-${color}`, title: `${poet} × ${color}`, payload: { sample_lines: edge?.sample_lines || [] } });
  };

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="诗人调色盘" description="选择诗人后查看专属色卡；对比模式会标出共同色与独特色，帮助辨认同色异意。" />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <SearchBox value={query} onChange={setQuery} placeholder="搜索诗人" />
          <div className="mt-4">
            <ChipGroup label="朝代" options={dynasties} value={dynasty} onChange={setDynasty} />
          </div>
          <div className="mt-4 max-h-[520px] overflow-y-auto pr-1">
            {list.map((poet) => (
              <button
                key={poet.poet}
                className={`mb-2 w-full rounded-lg border p-3 text-left transition hover:border-cinnabar/50 ${activeA === poet.poet ? 'border-cinnabar bg-cinnabar/8' : 'border-stone-200 bg-white/40'}`}
                onClick={() => {
                  setPoetA(poet.poet);
                  setSelectedPoet(poet.poet);
                }}
              >
                <span className="font-song text-lg">{poet.poet}</span>
                <span className="ml-2 text-xs text-mutedInk">{poet.dynasty}</span>
                <p className="text-xs text-mutedInk">{cnNumber(poet.color_total)} 次颜色</p>
              </button>
            ))}
          </div>
        </aside>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48">
              <label className="text-xs text-mutedInk">对比诗人 B</label>
              <select className="mt-2 w-full rounded-full border border-stone-300 bg-white/65 px-4 py-2" value={activeB} onChange={(event) => setPoetB(event.target.value)}>
                {poets.slice(0, 120).map((poet) => <option key={poet.poet}>{poet.poet}</option>)}
              </select>
            </div>
            <ChipGroup label="色系" options={colorGroups} value={group} onChange={setGroup} />
            <Toggle checked={onlyShared} label="只看共同色" onChange={setOnlyShared} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Palette poet={activeA} detail={poetIndex[activeA]} group={group} onlyShared={onlyShared} shared={shared} onColor={(color) => handleColor(activeA, color)} />
            <Palette poet={activeB} detail={poetIndex[activeB]} group={group} onlyShared={onlyShared} shared={shared} onColor={(color) => handleColor(activeB, color)} />
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-xl font-semibold">同色异意</h3>
            <p className="mt-1 text-sm text-mutedInk">共同色：{[...shared].slice(0, 10).join('、') || '暂无'}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <LinesList lines={poetIndex[activeA]?.sample_lines || []} max={3} />
              <LinesList lines={poetIndex[activeB]?.sample_lines || []} max={3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
