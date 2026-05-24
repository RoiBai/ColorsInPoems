import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, SampleLine } from '../types';
import { cnNumber } from '../utils/format';
import { LinesList, SectionHeader } from './common';

type Context = { color: string; imagery: string; category: string; count: number; sample_lines: SampleLine[] };

export function ColorMapTab() {
  const { data: colorIndex, loading } = useData<Record<string, ColorDetail>>('/data/stats/color_detail_index.json');
  const { data: contexts } = useData<Record<string, Context[]>>('/data/stats/color_semantic_contexts.json');
  const { selectedColor, setSelectedColor, openDetail } = useAppState();
  const colors = useMemo(() => Object.values(colorIndex || {}).sort((a, b) => b.total_count - a.total_count), [colorIndex]);
  const activeColor = selectedColor || colors[0]?.normalized_color || '';
  const [imagery, setImagery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const currentContexts = contexts?.[activeColor] || [];
  const activeContext = currentContexts.find((item) => item.imagery === imagery) || currentContexts[0];

  if (loading) return <LoadingBlock label="正在加载色彩地图" />;
  if (!colorIndex || !contexts) return <EmptyState message="色彩地图数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="色彩地图" description="从颜色走到意象，再走到诗句。每一步选择后，下一栏平滑出现，并在顶部保留探索路径。" />
      <div className="mb-4 rounded-full border border-stone-200 bg-white/45 px-4 py-2 text-sm text-mutedInk">
        路径：{activeColor || '颜色'} {activeContext ? `→ ${activeContext.imagery}` : ''} {activeContext?.sample_lines[0] ? `→ ${activeContext.sample_lines[0].author}《${activeContext.sample_lines[0].title}》` : ''}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">第一层：颜色</h3>
          <div className="mt-3 grid max-h-[520px] gap-2 overflow-y-auto">
            {colors.slice(0, 36).map((color) => (
              <button key={color.normalized_color} className={`rounded-lg border p-2 text-left ${activeColor === color.normalized_color ? 'border-cinnabar bg-cinnabar/8' : 'border-stone-200 bg-white/45'}`} onClick={() => { setSelectedColor(color.normalized_color); setImagery(''); }}>
                <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
                {color.normalized_color}
                <span className="float-right text-xs text-mutedInk">{cnNumber(color.total_count)}</span>
              </button>
            ))}
          </div>
        </aside>
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">第二层：意象</h3>
          <div className="mt-3 grid gap-2">
            {currentContexts.slice(0, 24).map((item) => (
              <button key={item.imagery} className={`rounded-lg border p-2 text-left ${activeContext?.imagery === item.imagery ? 'border-cinnabar bg-cinnabar/8' : 'border-stone-200 bg-white/45'}`} onClick={() => setImagery(item.imagery)}>
                {item.imagery}
                <span className="ml-2 text-xs text-mutedInk">{item.category}</span>
                <span className="float-right text-xs text-mutedInk">{cnNumber(item.count)}</span>
              </button>
            ))}
          </div>
        </aside>
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">第三层：诗句</h3>
          {activeContext ? <LinesList lines={activeContext.sample_lines} max={8} /> : <EmptyState message="请选择意象。" />}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="soft-button" onClick={() => activeContext && setSaved([...saved, `${activeColor} → ${activeContext.imagery}`])}>保存路径</button>
            <button className="soft-button" onClick={() => activeContext?.sample_lines[0] && openDetail({ type: 'poem', id: activeContext.sample_lines[0].poem_id })}>打开完整诗歌</button>
          </div>
          {saved.length ? <p className="mt-3 text-xs text-mutedInk">已保存：{saved.join('；')}</p> : null}
        </aside>
      </div>
    </section>
  );
}
