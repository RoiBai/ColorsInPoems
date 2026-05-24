import { useState } from 'react';
import type { SampleLine } from '../types';
import { cnNumber, lineLabel } from '../utils/format';

export function SectionHeader({ title, description, hint }: { title: string; description: string; hint?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-song text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-mutedInk">{description}</p>
        {hint ? <p className="mt-1 text-xs leading-6 text-cinnabar">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-mutedInk">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`pill-button px-3 py-2 text-sm ${value === option ? 'pill-button-active' : ''}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/45 px-3 py-2 text-sm text-ink">
      <input className="accent-cinnabar" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      className="w-full rounded-full border border-stone-300 bg-white/60 px-4 py-2.5 text-sm outline-none transition focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/20 md:max-w-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const show = (event: React.MouseEvent, content: React.ReactNode) => {
    setTooltip({ x: event.clientX + 14, y: event.clientY + 14, content });
  };
  const move = (event: React.MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: event.clientX + 14, y: event.clientY + 14 } : prev));
  };
  const hide = () => setTooltip(null);
  const node = tooltip ? (
    <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      {tooltip.content}
    </div>
  ) : null;
  return { show, move, hide, node };
}

export function TooltipLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p>
      <span className="text-mutedInk">{label}：</span>
      <span>{value}</span>
    </p>
  );
}

export function LinesList({ lines, max = 5 }: { lines: SampleLine[]; max?: number }) {
  if (!lines.length) return <p className="text-sm text-mutedInk">暂无代表诗句。</p>;
  return (
    <div className="space-y-2">
      {lines.slice(0, max).map((line) => (
        <div key={`${line.poem_id}:${line.line_text}`} className="rounded-lg border border-stone-200 bg-white/42 p-3">
          <p className="font-song leading-7">{line.line_text}</p>
          <p className="mt-1 text-xs text-mutedInk">{lineLabel(line)}</p>
        </div>
      ))}
    </div>
  );
}

export function CountBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-mutedInk">
      {label} {cnNumber(value)}
    </span>
  );
}
