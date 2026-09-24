"use client";

import { useEffect, useRef } from "react";
import { useHistory, type VisitRow } from "@/lib/hooks/useHistory";
import type { VisitMethod } from "@/types";
import {
  IconHistory,
  IconLink,
  IconSearch,
  IconTyped,
} from "../browser/icons";

function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 45) return "just now";
  if (diffSec < 90) return "1 minute ago";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? "1 hour ago" : `${diffHr} hours ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function MethodIcon({ method }: { method: VisitMethod }) {
  const className = "shrink-0 text-[var(--muted)] opacity-70";
  switch (method) {
    case "typed":
      return <IconTyped size={14} className={className} />;
    case "link":
      return <IconLink size={14} className={className} />;
    case "search":
      return <IconSearch size={14} className={className} />;
    case "history":
      return <IconHistory size={14} className={className} />;
  }
}

function methodLabel(method: VisitMethod): string {
  switch (method) {
    case "typed":
      return "Typed";
    case "link":
      return "Link";
    case "search":
      return "Search";
    case "history":
      return "History";
  }
}

export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold">No visits yet</p>
      <p className="max-w-[16rem] text-sm text-[var(--muted)]">
        When you browse the Small Web, every trail you take will land here —
        ready to jump back into.
      </p>
    </div>
  );
}

type HistoryPanelProps = {
  personId: string;
  /** Panel must be open before fetching — avoids stale background requests. */
  open: boolean;
  onNavigate: (address: string) => void;
};

export function HistoryPanel({
  personId,
  open,
  onNavigate,
}: HistoryPanelProps) {
  const { visits, isLoading, isLoadingMore, hasMore, error, loadMore } =
    useHistory({ personId, enabled: open && Boolean(personId) });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !open || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { root: node.closest("[data-history-scroll]") ?? null, rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, hasMore, loadMore, visits.length]);

  if (!open) return null;

  if (isLoading && visits.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[var(--muted)]">
        <span className="address-spinner" aria-hidden="true" />
        Loading history…
      </div>
    );
  }

  if (error && visits.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-[var(--danger)]">
        {error}
      </div>
    );
  }

  if (!isLoading && visits.length === 0) {
    return <EmptyHistory />;
  }

  return (
    <div
      data-history-scroll
      className="flex h-full min-h-0 flex-col overflow-y-auto"
    >
      <ul className="min-h-0 flex-1 space-y-1 px-2 pb-2">
        {visits.map((row) => (
          <HistoryRow
            key={row._id}
            row={row}
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

      {error && visits.length > 0 ? (
        <p className="px-4 py-2 text-center text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function HistoryRow({
  row,
  onNavigate,
}: {
  row: VisitRow;
  onNavigate: (address: string) => void;
}) {
  const dead = row.siteId === null;

  return (
    <li>
      <button
        type="button"
        className={`flex w-full items-start gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-soft)] ${
          dead ? "opacity-60" : ""
        }`}
        onClick={() => onNavigate(row.address)}
      >
        <span className="mt-0.5" title={methodLabel(row.method)}>
          <MethodIcon method={row.method} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium ${
              dead ? "text-[var(--muted)]" : ""
            }`}
          >
            {row.address}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--muted)]">
            <span>{formatRelativeTime(row.createdAt)}</span>
            {dead ? (
              <>
                <span aria-hidden="true">·</span>
                <span>not found</span>
              </>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}
