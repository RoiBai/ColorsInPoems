export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/35 p-8 text-center">
      <p className="font-song text-lg text-ink">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
