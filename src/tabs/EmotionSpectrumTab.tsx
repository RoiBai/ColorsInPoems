import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { EmotionSpectrumRow } from '../types';
import { cnNumber, dynasties, emotions } from '../utils/format';
import { hexToRgba } from '../utils/color';
import { ChipGroup, LinesList, SectionHeader } from './common';

export function EmotionSpectrumTab() {
  const { data, loading } = useData<EmotionSpectrumRow[]>('/data/stats/emotion_color_spectrum.json');
  const { selectedEmotion, setSelectedEmotion, openDetail } = useAppState();
  const [dynasty, setDynasty] = useState('全部');
  const rows = useMemo(() => data || [], [data]);
  const active = rows.find((row) => row.emotion === selectedEmotion) || rows[0];

  if (loading) return <LoadingBlock label="正在加载情绪色谱" />;
  if (!data) return <EmptyState message="情绪色谱数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6" style={{ background: active?.main_color ? `linear-gradient(180deg, ${hexToRgba(active.main_color.hex, 0.13)}, rgba(255,252,245,0.56))` : undefined }}>
      <SectionHeader title="情绪色谱" description="从情绪进入颜色和诗句：选择一个情绪，查看它的主色谱、代表意象与代表诗句。" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <ChipGroup label="情绪" options={emotions.filter((emotion) => rows.some((row) => row.emotion === emotion))} value={active?.emotion || ''} onChange={setSelectedEmotion} />
        <ChipGroup label="朝代" options={dynasties} value={dynasty} onChange={setDynasty} />
      </div>
      {!active ? (
        <EmptyState message="暂无情绪数据。" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-2xl font-semibold">{active.emotion}</h3>
            <p className="text-sm text-mutedInk">颜色关联 {cnNumber(active.total_count)} 次</p>
            <div className="mt-5 flex min-h-32 overflow-hidden rounded-lg border border-stone-200">
              {active.colors.map((color) => (
                <button key={color.color} className="relative min-w-12 flex-1" style={{ background: color.hex, flexGrow: color.count }} onClick={() => openDetail({ type: 'combo', id: `${active.emotion}-${color.color}`, title: `${active.emotion} × ${color.color}`, payload: { sample_lines: color.sample_lines } })}>
                  <span className="absolute inset-x-0 bottom-2 text-center text-sm font-semibold text-ink">{color.color}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {active.colors.slice(0, 8).map((color) => (
                <button key={color.color} className="rounded-lg border border-stone-200 bg-white/50 p-3 text-left" onClick={() => openDetail({ type: 'color', id: color.color })}>
                  <p className="font-song text-lg"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />{color.color}</p>
                  <p className="text-xs text-mutedInk">出现 {cnNumber(color.count)} · 意象 {color.imageries.map((item) => item.imagery).join('、') || '暂无'}</p>
                </button>
              ))}
            </div>
          </div>
          <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-xl font-semibold">代表诗句</h3>
            <LinesList lines={active.colors.flatMap((color) => color.sample_lines).slice(0, 8)} max={8} />
          </aside>
        </div>
      )}
    </section>
  );
}
