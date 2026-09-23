/** Loading placeholder for the main viewer — skeleton/shimmer, not a lone spinner. */
export function LoadingPlaceholder() {
  return (
    <div
      className="glass mx-auto flex h-full min-h-[420px] w-full max-w-4xl flex-col gap-4 rounded-[var(--radius)] p-6 animate-fade-up"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="skeleton h-8 w-2/5" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-4 w-3/5" />
      <div className="mt-4 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="skeleton min-h-[140px] w-full rounded-[var(--radius-sm)]" />
        <div className="skeleton min-h-[140px] w-full rounded-[var(--radius-sm)]" />
        <div className="skeleton min-h-[100px] w-full rounded-[var(--radius-sm)] sm:col-span-2" />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">Fetching the page…</p>
    </div>
  );
}
