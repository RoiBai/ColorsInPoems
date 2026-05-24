export function LoadingBlock({ label = '正在加载数据' }: { label?: string }) {
  return (
    <div className="rounded-lg border border-stone-200/80 bg-white/45 p-6 shadow-sm">
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-stone-200" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-stone-200/80" />
        <div className="h-3 w-10/12 animate-pulse rounded bg-stone-200/70" />
        <div className="h-3 w-8/12 animate-pulse rounded bg-stone-200/60" />
      </div>
      <p className="mt-4 text-sm text-mutedInk">{label}</p>
    </div>
  );
}
