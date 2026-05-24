import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import type { ColorDetail, ImageryBubbleStats, PoetDetail, Poem, PoemColorBand, SampleLine } from '../types';
import { cnNumber, lineLabel } from '../utils/format';
import { EmptyState } from './EmptyState';

type ColorIndex = Record<string, ColorDetail>;
type PoetIndex = Record<string, PoetDetail>;

function SampleLines({ lines }: { lines: SampleLine[] }) {
  if (!lines?.length) return <p className="text-sm text-mutedInk">暂无可回溯诗句。</p>;
  return (
    <div className="space-y-3">
      {lines.slice(0, 8).map((line) => (
        <blockquote key={`${line.poem_id}:${line.line_text}`} className="rounded-lg border-l-4 border-cinnabar/40 bg-white/45 p-3">
          <p className="font-song text-base leading-7">{line.line_text}</p>
          <footer className="mt-1 text-xs text-mutedInk">{lineLabel(line)}</footer>
        </blockquote>
      ))}
    </div>
  );
}

function MiniBars({ items, colorKey = 'hex' }: { items: Array<Record<string, string | number>>; colorKey?: string }) {
  const max = Math.max(1, ...items.map((item) => Number(item.count || 0)));
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <div key={`${item.color || item.poet || item.imagery || item.emotion || item.dynasty}`} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="truncate">{String(item.color || item.poet || item.imagery || item.emotion || item.dynasty)}</span>
          <span className="h-2 rounded-full bg-stone-200">
            <span
              className="block h-2 rounded-full"
              style={{ width: `${(Number(item.count || 0) / max) * 100}%`, background: String(item[colorKey] || '#8a7461') }}
            />
          </span>
          <span className="text-right text-mutedInk">{cnNumber(Number(item.count || 0))}</span>
        </div>
      ))}
    </div>
  );
}

export function DetailDrawer() {
  const { detail, closeDetail, setActiveTab, setPaletteColors } = useAppState();
  const { data: colorIndex } = useData<ColorIndex>('/data/stats/color_detail_index.json');
  const { data: poetIndex } = useData<PoetIndex>('/data/stats/poet_detail_index.json');
  const { data: bubbles } = useData<ImageryBubbleStats>('/data/stats/imagery_color_bubbles.json');
  const { data: poems } = useData<Poem[]>('/data/poems.json');
  const { data: bands } = useData<PoemColorBand[]>('/data/stats/poem_color_bands.json');
  const { data: sources } = useData<Array<Record<string, unknown>>>('/data/source_manifest.json');

  const content = useMemo(() => {
    if (!detail) return null;
    if (detail.type === 'methodology') {
      return (
        <section className="space-y-5">
          <div>
            <p className="drawer-eyebrow">语料来源与方法</p>
            <h2 className="drawer-title">可复现的颜色提取流程</h2>
            <p className="drawer-copy">
              当前站点在构建前下载或读取公开语料，统一归一为诗歌结构，再基于古典颜色词典做最长匹配，并用规则词典抽取意象与情绪标签。
            </p>
          </div>
          <div className="grid gap-3">
            {(sources || []).map((source) => (
              <div key={String(source.source_id)} className="rounded-lg border border-stone-200 bg-white/45 p-3 text-sm leading-6">
                <p className="font-medium text-ink">{String(source.source_name)}</p>
                <p className="text-mutedInk">许可：{String(source.license)}</p>
                <p className="break-all text-mutedInk">地址：{String(source.url)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-cinnabar/8 p-4 text-sm leading-7 text-mutedInk">
            局限性：颜色词可能有多义性，单字颜色可能误判；情绪标签是规则推断，不等同于文学定论；HEX 色值只为可视化近似，不代表古代颜色标准的唯一解释。
          </div>
        </section>
      );
    }
    if (detail.type === 'color') {
      const item = detail.id ? colorIndex?.[detail.id] : undefined;
      if (!item) return <EmptyState message="颜色详情还在加载，或当前数据中没有这个颜色。" />;
      return (
        <section className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 rounded-lg border border-stone-300" style={{ background: item.hex }} />
            <div>
              <p className="drawer-eyebrow">颜色详情</p>
              <h2 className="drawer-title">{item.normalized_color}</h2>
              <p className="text-sm text-mutedInk">
                {item.color_group} · {item.hex} · {cnNumber(item.total_count)} 次
              </p>
            </div>
          </div>
          <MiniBars items={item.dynasty_distribution.map((row) => ({ ...row, hex: item.hex }))} />
          <div>
            <h3 className="drawer-section-title">高频诗人</h3>
            <MiniBars items={item.top_poets.map((row) => ({ ...row, hex: item.hex }))} />
          </div>
          <div>
            <h3 className="drawer-section-title">高频意象与情绪</h3>
            <MiniBars items={[...item.top_imageries.map((row) => ({ imagery: row.imagery, count: row.count, hex: item.hex })), ...item.top_emotions.map((row) => ({ emotion: row.emotion, count: row.count, hex: item.hex }))]} />
          </div>
          <SampleLines lines={item.sample_lines} />
          <div className="flex flex-wrap gap-2">
            <button className="soft-button" onClick={() => setActiveTab('polysemy')}>在一色多义中查看</button>
            <button
              className="soft-button"
              onClick={() => {
                setPaletteColors([item.normalized_color]);
                setActiveTab('palette-finder');
              }}
            >
              在调色找诗中加入该颜色
            </button>
          </div>
        </section>
      );
    }
    if (detail.type === 'poet') {
      const item = detail.id ? poetIndex?.[detail.id] : undefined;
      if (!item) return <EmptyState message="诗人详情还在加载，或当前数据中没有这位诗人。" />;
      return (
        <section className="space-y-5">
          <div>
            <p className="drawer-eyebrow">诗人详情</p>
            <h2 className="drawer-title">{item.poet}</h2>
            <p className="text-sm text-mutedInk">
              {item.dynasty} · 语料中 {cnNumber(item.poem_count)} 首 · 颜色词 {cnNumber(item.color_total)} 次
            </p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-stone-200">
            {item.top_colors.map((color) => (
              <span
                key={color.color}
                className="h-10 min-w-6"
                title={`${color.color} ${color.count}`}
                style={{ background: color.hex, flexGrow: color.count }}
              />
            ))}
          </div>
          <MiniBars items={item.top_colors.map((row) => ({ color: row.color, count: row.count, hex: row.hex }))} />
          <div>
            <h3 className="drawer-section-title">高频意象</h3>
            <MiniBars items={item.top_imageries.map((row) => ({ imagery: row.imagery, count: row.count, hex: '#7ba99c' }))} />
          </div>
          <SampleLines lines={item.sample_lines} />
          <div className="flex flex-wrap gap-2">
            <button className="soft-button" onClick={() => setActiveTab('poet-palette')}>查看诗人调色盘</button>
          </div>
        </section>
      );
    }
    if (detail.type === 'imagery') {
      const item = bubbles?.bubbles.find((bubble) => bubble.name === detail.id);
      if (!item) return <EmptyState message="意象详情还在加载，或当前数据中没有这个意象。" />;
      return (
        <section className="space-y-5">
          <div>
            <p className="drawer-eyebrow">意象详情</p>
            <h2 className="drawer-title">{item.name}</h2>
            <p className="text-sm text-mutedInk">
              {item.category} · 关联诗句 {cnNumber(item.count)} · 主色 {item.main_color.color}
            </p>
          </div>
          <MiniBars items={item.colors.map((row) => ({ color: row.color, count: row.count, hex: row.hex }))} />
          <MiniBars items={item.top_poets.map((row) => ({ poet: row.poet, count: row.count, hex: item.main_color.hex }))} />
          <SampleLines lines={item.sample_lines} />
          <div className="flex flex-wrap gap-2">
            <button className="soft-button" onClick={() => setActiveTab('imagery-nebula')}>查看意象色彩星云</button>
            <button className="soft-button" onClick={() => setActiveTab('color-map')}>查看色彩地图</button>
          </div>
        </section>
      );
    }
    if (detail.type === 'poem') {
      const poem = poems?.find((item) => item.poem_id === detail.id);
      const band = bands?.find((item) => item.poem_id === detail.id);
      if (!poem) return <EmptyState message="诗歌详情还在加载，或当前数据中没有这首诗。" />;
      return (
        <section className="space-y-5">
          <div>
            <p className="drawer-eyebrow">诗句详情</p>
            <h2 className="drawer-title">《{poem.title}》</h2>
            <p className="text-sm text-mutedInk">
              {poem.dynasty} · {poem.author} · {poem.source_ref || poem.source_id}
            </p>
          </div>
          <div className="rounded-lg bg-white/50 p-4 font-song text-lg leading-10">
            {poem.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {band ? (
            <div className="flex overflow-hidden rounded-lg border border-stone-200">
              {band.colors.map((color, index) => (
                <span key={`${color.color}-${index}`} className="h-8 min-w-8 flex-1" title={color.color} style={{ background: color.hex }} />
              ))}
            </div>
          ) : null}
        </section>
      );
    }
    if (detail.type === 'combo') {
      const lines = (detail.payload?.sample_lines as SampleLine[] | undefined) || [];
      return (
        <section className="space-y-5">
          <div>
            <p className="drawer-eyebrow">组合详情</p>
            <h2 className="drawer-title">{detail.title || detail.id}</h2>
          </div>
          <SampleLines lines={lines} />
        </section>
      );
    }
    return <EmptyState message="暂时没有可展示的详情。" />;
  }, [bands, bubbles, closeDetail, colorIndex, detail, poetIndex, poems, setActiveTab, setPaletteColors, sources]);

  if (!detail) return null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[86vh] overflow-hidden rounded-t-2xl border border-stone-200 bg-paper shadow-paper md:inset-y-0 md:left-auto md:right-0 md:h-screen md:max-h-none md:w-[440px] md:rounded-none">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <span className="text-sm text-mutedInk">DetailDrawer</span>
        <button className="soft-button" type="button" onClick={closeDetail}>
          关闭
        </button>
      </div>
      <div className="h-[calc(86vh-72px)] overflow-y-auto p-5 md:h-[calc(100vh-72px)]">{content}</div>
    </aside>
  );
}
