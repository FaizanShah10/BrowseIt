/** Loading placeholder for the main viewer — skeleton/shimmer, not a lone spinner. */
export function LoadingPlaceholder() {
  return (
    <div
      className="glass mx-auto flex h-full min-h-[280px] w-full max-w-4xl flex-col gap-3 rounded-[var(--radius)] p-4 animate-fade-up sm:min-h-[360px] sm:gap-4 sm:p-6 md:min-h-[420px]"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="skeleton h-6 w-2/5 sm:h-8" />
      <div className="skeleton h-3 w-4/5 sm:h-4" />
      <div className="skeleton h-3 w-3/5 sm:h-4" />
      <div className="mt-2 grid flex-1 grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2">
        <div className="skeleton min-h-[100px] w-full rounded-[var(--radius-sm)] sm:min-h-[140px]" />
        <div className="skeleton min-h-[100px] w-full rounded-[var(--radius-sm)] sm:min-h-[140px]" />
        <div className="skeleton min-h-[80px] w-full rounded-[var(--radius-sm)] sm:min-h-[100px] sm:col-span-2" />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">Fetching the page…</p>
    </div>
  );
}
