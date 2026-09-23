/** Nowhere — considered dead-address / 404 screen for the main viewer. */
export function NowherePlaceholder({ address = "lost.harbor.zz" }: { address?: string }) {
  return (
    <div className="glass mx-auto flex min-h-[280px] w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-[var(--radius)] px-5 py-10 text-center animate-fade-up sm:min-h-[360px] sm:gap-5 sm:px-8 sm:py-14 md:min-h-[420px] md:py-16">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-xs">
        Nowhere
      </p>
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
        This address leads nowhere
      </h2>
      <p className="max-w-md text-sm text-[var(--muted)] sm:text-base">
        <span className="break-all font-medium text-[var(--foreground)]">{address}</span> is not
        on the Small Web yet. Check the spelling, pick another trail from History, or publish the
        first page at this address.
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted)] sm:mt-2 sm:text-sm">
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
