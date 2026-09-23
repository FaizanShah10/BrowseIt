/** Nowhere — considered dead-address / 404 screen for the main viewer. */
export function NowherePlaceholder({ address = "lost.harbor.zz" }: { address?: string }) {
  return (
    <div className="glass mx-auto flex min-h-[420px] w-full max-w-2xl flex-col items-center justify-center gap-5 rounded-[var(--radius)] px-8 py-16 text-center animate-fade-up">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Nowhere
      </p>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        This address leads nowhere
      </h2>
      <p className="max-w-md text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">{address}</span> is not on
        the Small Web yet. Check the spelling, pick another trail from History, or publish
        the first page at this address.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--muted)]">
        <span className="rounded-full border border-[var(--surface-border)] px-3 py-1">
          Dead address
        </span>
        <span className="rounded-full border border-[var(--surface-border)] px-3 py-1">
          Not an error boundary
        </span>
      </div>
    </div>
  );
}
