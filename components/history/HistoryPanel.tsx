"use client";

// Sample history rows for layout only — replaced by GET /api/visits in a later issue.
const SAMPLE_HISTORY = [
  { address: "tidepool.zz", method: "typed", when: "Today · 09:14" },
  { address: "lantern.cove", method: "link", when: "Today · 09:16" },
  { address: "moss.bridge", method: "search", when: "Yesterday · 18:02" },
  { address: "amber.quay", method: "history", when: "Yesterday · 18:05" },
  { address: "driftwood.zz", method: "typed", when: "Mon · 11:40" },
] as const;

export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold">No visits yet</p>
      <p className="max-w-[16rem] text-sm text-[var(--muted)]">
        When you browse the Small Web, every trail you take will land here — ready to jump
        back into.
      </p>
    </div>
  );
}

type HistoryPanelProps = {
  /** When true, show the empty state instead of sample rows. */
  empty?: boolean;
};

export function HistoryPanel({ empty = false }: HistoryPanelProps) {
  if (empty) {
    return <EmptyHistory />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="px-4 pb-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        Sample data
      </p>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {SAMPLE_HISTORY.map((row) => (
          <li key={`${row.address}-${row.when}`}>
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-soft)]"
            >
              <span className="font-medium">{row.address}</span>
              <span className="text-xs text-[var(--muted)]">
                {row.when} · {row.method}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
