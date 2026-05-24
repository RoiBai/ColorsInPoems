import { Converter } from 'opencc-js';

const toSimplifiedConverter = Converter({ from: 'tw', to: 'cn' });

export function toSimplified(value) {
  if (typeof value !== 'string') return value;
  return toSimplifiedConverter(value);
}
