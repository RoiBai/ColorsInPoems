import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { Overview } from '../types';
import { cnNumber } from '../utils/format';
import { TabNav } from './TabNav';

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: overview } = useData<Overview>('/data/stats/overview.json');
  const { setSearchOpen, openDetail } = useAppState();
  const cards = overview
    ? [
        ['语料诗作数', overview.poem_count],
        ['诗人数量', overview.poet_count],
        ['颜色词数量', overview.color_word_count],
        ['颜色出现次数', overview.color_occurrence_count],
        ['涵盖朝代数', overview.dynasty_count],
      ]
    : [];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="paper-texture border-b border-stone-200/80">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm tracking-[0.18em] text-cinnabar">中国古代诗歌颜色分析</p>
              <h1 className="mt-2 font-song text-4xl font-semibold text-ink md:text-5xl">诗人与色彩关联图</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-mutedInk">
                左列为诗人，右列为色彩，连线表示该诗人作品使用过该色彩词。悬停节点查看详情。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="soft-button" type="button" onClick={() => setSearchOpen(true)}>
                全局搜索
              </button>
              <button className="soft-button" type="button" onClick={() => openDetail({ type: 'methodology', id: 'methodology' })}>
                语料与方法
              </button>
            </div>
          </div>

          <section aria-label="数据概览" className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-stone-200/80 bg-white/42 p-4 shadow-sm">
                <p className="text-xs text-mutedInk">{label}</p>
                <p className="mt-1 font-song text-2xl font-semibold">{cnNumber(Number(value))}</p>
              </div>
            ))}
          </section>

          {overview ? <p className="mt-4 text-sm leading-7 text-mutedInk">{overview.note}</p> : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-8">
        <TabNav />
        <div className="mt-5">{children}</div>
      </main>
    </div>
  );
}
