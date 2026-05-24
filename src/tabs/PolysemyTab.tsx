import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, SampleLine } from '../types';
import { cnNumber } from '../utils/format';
import { LinesList, SectionHeader } from './common';

type Context = {
  color: string;
  imagery: string;
  category: string;
  count: number;
  emotions: Array<{ emotion: string; count: number }>;
  sample_lines: SampleLine[];
};

export function PolysemyTab() {
  const { data: contexts, loading } = useData<Record<string, Context[]>>('/data/stats/color_semantic_contexts.json');
  const { data: colors } = useData<Record<string, ColorDetail>>('/data/stats/color_detail_index.json');
  const { selectedColor, setSelectedColor, openDetail } = useAppState();
  const colorList = useMemo(() => Object.values(colors || {}).sort((a, b) => b.total_count - a.total_count), [colors]);
  const [expanded, setExpanded] = useState('');
  const activeColor = selectedColor || colorList[0]?.normalized_color || '';
  const cards = contexts?.[activeColor] || [];

  if (loading) return <LoadingBlock label="正在加载一色多义语义场景" />;
  if (!contexts || !colors) return <EmptyState message="一色多义数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="一色多义" description="选择一个颜色，查看它在不同意象、情绪与诗句中的多重语境。所有卡片都由颜色出现、意象出现与情绪标签自动聚合。" />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {colorList.slice(0, 24).map((color) => (
          <button key={color.normalized_color} className={`pill-button ${activeColor === color.normalized_color ? 'pill-button-active' : ''}`} onClick={() => setSelectedColor(color.normalized_color)}>
            <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
            {color.normalized_color}
          </button>
        ))}
      </div>
      {!cards.length ? (
        <EmptyState message="这个颜色暂时没有足够的意象组合。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const isOpen = expanded === `${card.color}-${card.imagery}`;
            return (
              <article key={`${card.color}-${card.imagery}`} className="rounded-lg border border-stone-200 bg-white/45 p-4">
                <button className="w-full text-left" onClick={() => setExpanded(isOpen ? '' : `${card.color}-${card.imagery}`)}>
                  <p className="text-xs text-mutedInk">{card.category}</p>
                  <h3 className="font-song text-xl font-semibold">{card.color} × {card.imagery}</h3>
                  <p className="mt-1 text-sm text-mutedInk">诗句数量 {cnNumber(card.count)} · 情绪 {card.emotions.map((item) => item.emotion).join('、') || '暂无'}</p>
                </button>
                <div className="mt-3">
                  <LinesList lines={card.sample_lines} max={isOpen ? 8 : 2} />
                </div>
                <button className="soft-button mt-3" onClick={() => openDetail({ type: 'combo', id: `${card.color}-${card.imagery}`, title: `${card.color} × ${card.imagery}`, payload: { sample_lines: card.sample_lines } })}>
                  打开完整诗句列表
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
