import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, PoemColorBand } from '../types';
import { cnNumber } from '../utils/format';
import { SectionHeader } from './common';

type Mode = '精确颜色词' | '同色系' | '意象相近' | '情绪相近';

export function PaletteFinderTab() {
  const { data: colorIndex, loading } = useData<Record<string, ColorDetail>>('/data/stats/color_detail_index.json');
  const { data: bands } = useData<PoemColorBand[]>('/data/stats/poem_color_bands.json');
  const { paletteColors, setPaletteColors, openDetail } = useAppState();
  const [mode, setMode] = useState<Mode>('精确颜色词');
  const colors = useMemo(() => Object.values(colorIndex || {}).sort((a, b) => b.total_count - a.total_count), [colorIndex]);
  const selectedGroups = new Set(colors.filter((color) => paletteColors.includes(color.normalized_color)).map((color) => color.color_group));
  const results = useMemo(() => {
    if (!bands || !paletteColors.length) return [];
    return bands
      .map((band) => {
        const exact = band.colors.filter((color) => paletteColors.includes(color.color)).length;
        const group = band.colors.filter((color) => selectedGroups.has(color.group)).length;
        const score = mode === '精确颜色词' ? exact * 2 + group * 0.3 : mode === '同色系' ? group : exact + group * 0.6;
        return { band, score, matched: band.colors.filter((color) => paletteColors.includes(color.color) || selectedGroups.has(color.group)) };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [bands, mode, paletteColors, selectedGroups]);

  if (loading) return <LoadingBlock label="正在加载调色找诗" />;
  if (!colorIndex || !bands) return <EmptyState message="调色找诗数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="调色找诗" description="从调色盘选择 1–5 个颜色，实时返回完全包含、同色系相近或语义相近的诗句结果。" />
      <div className="mb-5 rounded-lg border border-stone-200 bg-white/42 p-4">
        <p className="mb-3 text-sm text-mutedInk">已选颜色</p>
        <div className="mb-4 flex min-h-12 flex-wrap gap-2">
          {paletteColors.map((color) => (
            <button key={color} className="pill-button pill-button-active" onClick={() => setPaletteColors(paletteColors.filter((item) => item !== color))}>
              {color}
            </button>
          ))}
          {!paletteColors.length ? <span className="text-sm text-mutedInk">请选择 1–5 个颜色。</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.slice(0, 28).map((color) => (
            <button
              key={color.normalized_color}
              disabled={!paletteColors.includes(color.normalized_color) && paletteColors.length >= 5}
              className={`rounded-full border px-3 py-1.5 text-sm ${paletteColors.includes(color.normalized_color) ? 'border-cinnabar bg-cinnabar text-white' : 'border-stone-200 bg-white/55'}`}
              onClick={() =>
                setPaletteColors(
                  paletteColors.includes(color.normalized_color)
                    ? paletteColors.filter((item) => item !== color.normalized_color)
                    : [...paletteColors, color.normalized_color],
                )
              }
            >
              <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
              {color.normalized_color}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['精确颜色词', '同色系', '意象相近', '情绪相近'] as Mode[]).map((item) => (
            <button key={item} className={`pill-button ${mode === item ? 'pill-button-active' : ''}`} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
      </div>

      {!results.length ? (
        <EmptyState message="选择颜色后会出现匹配诗句。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ band, score, matched }) => (
            <article key={band.poem_id} className="rounded-lg border border-stone-200 bg-white/45 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-song text-xl font-semibold">《{band.title}》</h3>
                <span className="rounded-full bg-cinnabar/10 px-2 py-1 text-xs text-cinnabar">匹配度 {score.toFixed(1)}</span>
              </div>
              <p className="mt-1 text-sm text-mutedInk">{band.dynasty} · {band.author}</p>
              <p className="mt-3 font-song leading-7">{matched[0]?.line_text || band.colors[0]?.line_text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {matched.slice(0, 6).map((color, index) => (
                  <span key={`${color.color}-${index}`} className="rounded-full bg-white/70 px-2 py-1 text-xs">
                    <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color.hex }} />
                    {color.color}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="soft-button" onClick={() => openDetail({ type: 'poem', id: band.poem_id })}>查看诗歌</button>
                <button className="soft-button" onClick={() => navigator.clipboard?.writeText(`${paletteColors.join('、')}｜${band.author}《${band.title}》：${matched[0]?.line_text || ''}`)}>
                  生成诗卡文本
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-mutedInk">当前结果 {cnNumber(results.length)} 条；PNG 诗卡可在后续接入 html-to-image，本版先提供可复制文本卡片。</p>
    </section>
  );
}
