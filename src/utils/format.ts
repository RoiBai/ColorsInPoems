import type { SampleLine } from '../types';

export const dynasties = ['全部', '先秦', '汉', '魏晋', '南北朝', '唐', '五代', '宋', '元', '明', '清', '近现代'];
export const colorGroups = ['全部', '红系', '橙黄系', '绿系', '蓝青系', '紫系', '中性色'];
export const emotions = ['自然', '清新', '相思', '孤独', '离愁', '忧郁', '壮美', '爱国', '喜庆', '禅意', '怀古', '思乡', '高洁', '柔美', '豪放', '悲凉'];

export function cnNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '0';
  return value.toLocaleString('zh-CN');
}

export function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function lineLabel(line: SampleLine) {
  return `${line.dynasty} · ${line.author}《${line.title}》`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function textIncludes(source: string | undefined, query: string) {
  return (source || '').toLowerCase().includes(query.toLowerCase());
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}
