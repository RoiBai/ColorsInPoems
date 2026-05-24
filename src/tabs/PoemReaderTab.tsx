import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, Poem, PoemColorBand } from '../types';
import { cnNumber, dynasties, textIncludes } from '../utils/format';
import { hexToRgba } from '../utils/color';
import { ChipGroup, LinesList, SearchBox, SectionHeader, TooltipLine, useTooltip } from './common';

function HighlightLine({
  line,
  colors,
  onColor,
}: {
  line: string;
  colors: PoemColorBand['colors'];
  onColor: (color: PoemColorBand['colors'][number]) => void;
}) {
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  const matches = colors
    .map((color) => ({ ...color, start: line.indexOf(color.word) }))
    .filter((color) => color.start >= 0)
    .sort((a, b) => a.start - b.start || b.word.length - a.word.length);
  matches.forEach((color, index) => {
    if (color.start < cursor) return;
    if (color.start > cursor) pieces.push(<span key={`t-${index}`}>{line.slice(cursor, color.start)}</span>);
    pieces.push(
      <button
        key={`c-${index}`}
        className="rounded px-1 font-semibold underline decoration-2 underline-offset-4 transition hover:bg-white/70"
        style={{ textDecorationColor: color.hex, background: hexToRgba(color.hex, 0.15) }}
        onClick={() => onColor(color)}
      >
        {line.slice(color.start, color.start + color.word.length)}
      </button>,
    );
    cursor = color.start + color.word.length;
  });
  pieces.push(<span key="tail">{line.slice(cursor)}</span>);
  return <p>{pieces}</p>;
}

export function PoemReaderTab() {
  const { data: poems, loading } = useData<Poem[]>('/data/poems.json');
  const { data: bands } = useData<PoemColorBand[]>('/data/stats/poem_color_bands.json');
  const { data: colors } = useData<Record<string, ColorDetail>>('/data/stats/color_detail_index.json');
  const { selectedColor, selectedPoet, setSelectedColor, openDetail } = useAppState();
  const [dynasty, setDynasty] = useState('全部');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [scope, setScope] = useState<'同诗人' | '同朝代' | '同意象' | '全语料'>('全语料');
  const [activePoemId, setActivePoemId] = useState('');
  const [wash, setWash] = useState('');
  const tooltip = useTooltip();

  const candidates = useMemo(() => {
    const source = bands || [];
    return source.filter((band) => {
      const dynastyOk = dynasty === '全部' || band.dynasty === dynasty;
      const poetOk = !selectedPoet || band.author === selectedPoet || query;
      const colorOk = !selectedColor || band.colors.some((color) => color.color === selectedColor) || query;
      const queryOk = !query || [band.title, band.author, band.dynasty, band.colors.map((color) => color.color).join('')].some((value) => textIncludes(value, query));
      return dynastyOk && poetOk && colorOk && queryOk;
    });
  }, [bands, dynasty, query, selectedColor, selectedPoet]);
  const activeBand = candidates.find((item) => item.poem_id === activePoemId) || candidates[0];
  const poem = poems?.find((item) => item.poem_id === activeBand?.poem_id);
  const activeColorDetail = wash ? colors?.[wash] : selectedColor ? colors?.[selectedColor] : undefined;

  if (loading) return <LoadingBlock label="正在加载诗句显色阅读器" />;
  if (!poems || !bands) return <EmptyState message="诗句数据加载失败。" />;

  return (
    <section className="panel p-4 md:p-6" style={{ background: wash ? `linear-gradient(180deg, ${hexToRgba(colors?.[wash]?.hex || '#fffaf1', 0.16)}, rgba(255,252,245,0.54))` : undefined }}>
      <SectionHeader title="诗句显色阅读器" description="选择诗人、朝代、颜色词或随机一首诗，直接在诗歌文本中查看颜色词的显色位置与上下文。" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <ChipGroup label="朝代" options={dynasties} value={dynasty} onChange={setDynasty} />
          <SearchBox value={query} onChange={setQuery} placeholder="搜索诗人、诗题或颜色词" />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button className={`pill-button ${mode === 'horizontal' ? 'pill-button-active' : ''}`} onClick={() => setMode('horizontal')}>横排</button>
          <button className={`pill-button ${mode === 'vertical' ? 'pill-button-active' : ''}`} onClick={() => setMode('vertical')}>竖排</button>
          <button className="soft-button" onClick={() => setActivePoemId(candidates[Math.floor(Math.random() * candidates.length)]?.poem_id || '')}>随机一首诗</button>
        </div>
      </div>

      {!poem || !activeBand ? (
        <EmptyState message="当前筛选没有诗歌。" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <article className={`rounded-xl border border-stone-200 bg-white/48 p-6 font-song text-xl leading-10 ${mode === 'vertical' ? 'vertical-poem overflow-x-auto' : ''}`}>
            <h3 className="mb-3 text-2xl font-semibold">《{poem.title}》</h3>
            <p className="mb-5 text-sm font-sans text-mutedInk">{poem.dynasty} · {poem.author}</p>
            {poem.lines.map((line) => (
              <HighlightLine
                key={line}
                line={line}
                colors={activeBand.colors.filter((color) => color.line_text === line)}
                onColor={(color) => {
                  setWash(color.color);
                  setSelectedColor(color.color);
                  openDetail({ type: 'color', id: color.color });
                }}
              />
            ))}
          </article>
          <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
            <h3 className="font-song text-xl font-semibold">同色诗句</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['同诗人', '同朝代', '同意象', '全语料'] as const).map((item) => (
                <button key={item} className={`pill-button px-3 py-1.5 text-sm ${scope === item ? 'pill-button-active' : ''}`} onClick={() => setScope(item)}>{item}</button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeBand.colors.map((color, index) => (
                <button
                  key={`${color.color}-${index}`}
                  className="rounded-full border border-stone-200 bg-white/60 px-3 py-1 text-sm"
                  onMouseMove={tooltip.move}
                  onMouseEnter={(event) =>
                    tooltip.show(
                      event,
                      <div>
                        <TooltipLine label="颜色词" value={color.color} />
                        <TooltipLine label="色系" value={color.group} />
                        <TooltipLine label="HEX" value={color.hex} />
                        <TooltipLine label="该色总次数" value={cnNumber(colors?.[color.color]?.total_count || 0)} />
                        <TooltipLine label="颜色词放大镜" value={color.line_text} />
                      </div>,
                    )
                  }
                  onMouseLeave={tooltip.hide}
                  onClick={() => {
                    setWash(color.color);
                    setSelectedColor(color.color);
                  }}
                >
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
                  {color.color}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <LinesList lines={activeColorDetail?.sample_lines || []} max={5} />
            </div>
          </aside>
          {tooltip.node}
        </div>
      )}
    </section>
  );
}
