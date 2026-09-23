"use client";

// Sample search hits for layout only — replaced by GET /api/search in a later issue.
const SAMPLE_RESULTS = [
  {
    address: "tidepool.zz",
    title: "Tidepool notes",
    snippet: "A quiet page about low tide and glass floats…",
  },
  {
    address: "lantern.cove",
    title: "Lantern Cove",
    snippet: "Evenings on the pier, signal lamps, and fog…",
  },
  {
    address: "moss.bridge",
    title: "Crossing the moss bridge",
    snippet: "Steps worn smooth where the creek bends…",
  },
] as const;

export function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">No pages matched</p>
      <p className="max-w-[16rem] text-sm text-[var(--muted)]">
        Try another word from a page body — search looks through content, not just titles.
      </p>
    </div>
  );
}

type SearchResultsProps = {
  empty?: boolean;
};

export function SearchResults({ empty = false }: SearchResultsProps) {
  if (empty) {
    return <EmptySearch />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
      <p className="px-2 pb-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        Sample data
      </p>
      <ul className="space-y-1">
        {SAMPLE_RESULTS.map((hit) => (
          <li key={hit.address}>
            <button
              type="button"
              className="flex w-full flex-col gap-1 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-soft)]"
            >
              <span className="font-medium">{hit.title}</span>
              <span className="text-xs text-[var(--accent)]">{hit.address}</span>
              <span className="text-sm text-[var(--muted)]">{hit.snippet}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
