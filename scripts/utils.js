import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { toSimplified } from './zh-convert.js';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');
export const STATS_DIR = path.join(PUBLIC_DATA_DIR, 'stats');
export const DYNASTIES = ['先秦', '汉', '魏晋', '南北朝', '唐', '五代', '宋', '元', '明', '清', '近现代'];

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson(filePath, fallback = null) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function stableId(...parts) {
  const hash = crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);
  return hash;
}

export function cleanText(value = '') {
  return toSimplified(String(value))
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[，,]{2,}/g, '，')
    .replace(/[。]{2,}/g, '。')
    .replace(/[？?]{2,}/g, '？')
    .replace(/[！!]{2,}/g, '！')
    .trim();
}

export function splitLines(value = '') {
  return String(value)
    .split(/[。！？!?；;：:\n]/)
    .map((line) => cleanText(line))
    .filter((line) => line && !/^[\d\s]+$/.test(line));
}

export function normalizeDynasty(value = '') {
  const text = String(value);
  if (/先秦|诗经|楚辞|周|战国|春秋/.test(text)) return '先秦';
  if (/汉|古诗十九首|曹操|曹植|蔡琰|乐府/.test(text)) return '汉';
  if (/魏|晋|陶渊明|曹丕|阮籍|嵇康|左思/.test(text)) return '魏晋';
  if (/南北|南朝|北朝|谢灵运|鲍照|庾信|王籍|沈约/.test(text)) return '南北朝';
  if (/唐|李白|杜甫|白居易|王维|杜牧|李商隐|刘禹锡|孟浩然|韩愈|柳宗元|岑参/.test(text)) return '唐';
  if (/五代|南唐|李煜|冯延巳|韦庄/.test(text)) return '五代';
  if (/宋|苏轼|辛弃疾|李清照|陆游|杨万里|王安石|欧阳修|柳永|秦观|姜夔/.test(text)) return '宋';
  if (/元|马致远|张养浩|关汉卿|白朴/.test(text)) return '元';
  if (/明|于谦|杨慎|高启|唐寅|汤显祖/.test(text)) return '明';
  if (/清|龚自珍|郑燮|纳兰性德|赵翼|袁枚/.test(text)) return '清';
  if (/近现代|现代|当代|民国/.test(text)) return '近现代';
  return text || '未知';
}

export function topN(mapOrEntries, n = 10) {
  const entries = mapOrEntries instanceof Map ? [...mapOrEntries.entries()] : mapOrEntries;
  return entries
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'zh-Hans-CN'))
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

export function sampleUnique(items, keyFn, max = 6) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= max) break;
  }
  return result;
}
