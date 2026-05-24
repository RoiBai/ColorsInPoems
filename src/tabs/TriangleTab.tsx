import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { useAppState } from '../state/AppState';
import { cnNumber } from '../utils/format';
import { LinesList, SectionHeader } from './common';

type TriangleData = {
  poets: Array<{ name: string; count: number }>;
  colors: Array<{ name: string; hex: string; group: string; count: number }>;
  emotions: Array<{ name: string; count: number }>;
  links: Array<{ poet: string; color: string; emotions: string[]; imageries: string[]; sample_line: { poem_id: string; title: string; author: string; dynasty: string; line_text: string } }>;
};

export function TriangleTab() {
  const { data, loading } = useData<TriangleData>('/data/stats/triangle_relations.json');
  const { openDetail } = useAppState();
  const [poet, setPoet] = useState('');
  const [color, setColor] = useState('');
  const [emotion, setEmotion] = useState('');
  const links = useMemo(() => {
    return (data?.links || []).filter((link) => (!poet || link.poet === poet) && (!color || link.color === color) && (!emotion || link.emotions.includes(emotion)));
  }, [color, data, emotion, poet]);

  if (loading) return <LoadingBlock label="正在加载三角关系图" />;
  if (!data) return <EmptyState message="三角关系数据加载失败。" />;

  const activePoets = new Set(links.map((link) => link.poet));
  const activeColors = new Set(links.map((link) => link.color));
  const activeEmotions = new Set(links.flatMap((link) => link.emotions));
  const sampleLines = links.slice(0, 8).map((link) => link.sample_line);

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="诗人 × 颜色 × 情绪三角" description="点击任一角的节点，其他两个区域会自动更新关联项；支持锁定多个节点并查看当前路径诗句。" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[poet, color, emotion].filter(Boolean).map((item) => (
          <span key={item} className="rounded-full bg-cinnabar/10 px-3 py-1 text-sm text-cinnabar">{item}</span>
        ))}
        <button className="soft-button" onClick={() => { setPoet(''); setColor(''); setEmotion(''); }}>清空选择</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="chart-scroll">
          <svg className="chart-frame" viewBox="0 0 920 560" role="img" aria-label="诗人颜色情绪三角关系图">
            <polygon points="120,90 800,90 460,470" fill="#fffaf1" opacity="0.34" stroke="#cbbda5" />
            <text x="120" y="55" textAnchor="middle" className="fill-mutedInk text-sm">诗人</text>
            <text x="800" y="55" textAnchor="middle" className="fill-mutedInk text-sm">颜色</text>
            <text x="460" y="510" textAnchor="middle" className="fill-mutedInk text-sm">情绪 / 意象</text>
            {data.poets.slice(0, 14).map((item, index) => {
              const x = 62 + (index % 2) * 98;
              const y = 96 + index * 30;
              const active = !poet ? activePoets.has(item.name) || links.length === data.links.length : poet === item.name;
              return (
                <g key={item.name} transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.24} onClick={() => setPoet(poet === item.name ? '' : item.name)}>
                  <rect x="-42" y="-14" width="96" height="28" rx="14" fill={poet === item.name ? '#b6453d' : '#fffaf1'} stroke="#cbbda5" />
                  <text textAnchor="middle" y="5" className={poet === item.name ? 'fill-white text-xs' : 'fill-ink text-xs'}>{item.name}</text>
                </g>
              );
            })}
            {data.colors.slice(0, 14).map((item, index) => {
              const x = 758 + (index % 2) * 92;
              const y = 96 + index * 30;
              const active = !color ? activeColors.has(item.name) || links.length === data.links.length : color === item.name;
              return (
                <g key={item.name} transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.24} onClick={() => setColor(color === item.name ? '' : item.name)}>
                  <circle r="15" fill={item.hex} stroke={color === item.name ? '#1f2a35' : '#fffaf1'} strokeWidth="2" />
                  <text x="22" y="5" className="fill-ink text-xs">{item.name}</text>
                </g>
              );
            })}
            {data.emotions.slice(0, 14).map((item, index) => {
              const x = 280 + (index % 7) * 62;
              const y = 420 + Math.floor(index / 7) * 42;
              const active = !emotion ? activeEmotions.has(item.name) || links.length === data.links.length : emotion === item.name;
              return (
                <g key={item.name} transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.24} onClick={() => setEmotion(emotion === item.name ? '' : item.name)}>
                  <rect x="-25" y="-14" width="58" height="28" rx="14" fill={emotion === item.name ? '#b6453d' : '#fffaf1'} stroke="#cbbda5" />
                  <text textAnchor="middle" y="5" className={emotion === item.name ? 'fill-white text-xs' : 'fill-ink text-xs'}>{item.name}</text>
                </g>
              );
            })}
            {links.slice(0, 80).map((link, index) => (
              <path key={`${link.poet}-${link.color}-${index}`} d={`M 170 ${110 + (index % 12) * 28} C 330 180, 590 180, 750 ${110 + (index % 12) * 28}`} fill="none" stroke="#b6453d" strokeOpacity="0.08" />
            ))}
          </svg>
        </div>
        <aside className="rounded-lg border border-stone-200 bg-white/42 p-4">
          <h3 className="font-song text-xl font-semibold">当前关联</h3>
          <p className="mt-1 text-sm text-mutedInk">{cnNumber(links.length)} 条颜色出现命中当前路径。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {color ? <button className="soft-button" onClick={() => openDetail({ type: 'color', id: color })}>打开颜色详情</button> : null}
            {poet ? <button className="soft-button" onClick={() => openDetail({ type: 'poet', id: poet })}>打开诗人详情</button> : null}
          </div>
          <div className="mt-4"><LinesList lines={sampleLines} max={6} /></div>
        </aside>
      </div>
    </section>
  );
}
