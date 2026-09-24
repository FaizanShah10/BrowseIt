"use client";

import { useEffect, useRef } from "react";
import type { SearchHit } from "@/lib/hooks/useSearch";

/** Short plain-text excerpt around the first query term, if present in the body. */
function snippetAround(text: string, query: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const term = query.trim().toLowerCase().split(/\s+/).find(Boolean);
  if (!term) {
    return trimmed.length > 110 ? `${trimmed.slice(0, 110)}…` : trimmed;
  }

  const lower = trimmed.toLowerCase();
  const idx = lower.indexOf(term);
  if (idx < 0) {
    return trimmed.length > 110 ? `${trimmed.slice(0, 110)}…` : trimmed;
  }

  const start = Math.max(0, idx - 36);
  const end = Math.min(trimmed.length, idx + term.length + 64);
  const slice = trimmed.slice(start, end);
  return `${start > 0 ? "…" : ""}${slice}${end < trimmed.length ? "…" : ""}`;
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">No results for “{query}”</p>
      <p className="max-w-[16rem] text-sm text-[var(--muted)]">
        Try another word from a page body — search looks through content, not
        just titles.
      </p>
    </div>
  );
}

type SearchResultsProps = {
  query: string;
  activeQuery: string;
  results: SearchHit[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  open: boolean;
  onLoadMore: () => void;
  onNavigate: (address: string) => void;
};

export function SearchResults({
  query,
  activeQuery,
  results,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  open,
  onLoadMore,
  onNavigate,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !open || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMore();
        }
      },
      {
        root: node.closest("[data-search-scroll]") ?? null,
        rootMargin: "80px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, hasMore, onLoadMore, results.length]);

  if (!open) return null;

  // Empty query → empty results area (not "no results").
  if (!trimmed) {
    return null;
  }

  // First load with nothing to show yet.
  if (isLoading && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[var(--muted)]">
        <span className="address-spinner" aria-hidden="true" />
        Searching…
      </div>
    );
  }

  if (error && results.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-[var(--danger)]">
        {error}
      </div>
    );
  }

  // Debounced query settled, zero matches.
  if (!isLoading && activeQuery === trimmed && results.length === 0) {
    return <EmptySearch query={activeQuery} />;
  }

  return (
    <div
      data-search-scroll
      className="flex h-full min-h-0 flex-col overflow-y-auto"
    >
      <ul className="min-h-0 flex-1 space-y-1 px-2 pb-2">
        {results.map((hit) => (
          <SearchRow
            key={hit._id}
            hit={hit}
            query={activeQuery || trimmed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden="true" />

      {isLoadingMore ? (
        <p className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-[var(--muted)]">
          <span className="address-spinner" aria-hidden="true" />
          Loading more…
        </p>
      ) : null}

      {error && results.length > 0 ? (
        <p className="px-4 py-2 text-center text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SearchRow({
  hit,
  query,
  onNavigate,
}: {
  hit: SearchHit;
  query: string;
  onNavigate: (address: string) => void;
}) {
  const snippet = snippetAround(hit.textContent, query);

  return (
    <li>
      <button
        type="button"
        className="flex w-full flex-col gap-1 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-soft)]"
        onClick={() => onNavigate(hit.address)}
      >
        <span className="font-medium">{hit.title}</span>
        <span className="text-xs text-[var(--accent)]">{hit.address}</span>
        {snippet ? (
          <span className="line-clamp-2 text-sm text-[var(--muted)]">
            {snippet}
          </span>
        ) : null}
      </button>
    </li>
  );
}
