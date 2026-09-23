"use client";

import { LiveClock } from "./LiveClock";

const STAT_LABELS = [
  "Sites in the web",
  "Your visits",
  "History entries",
  "Longest trail",
] as const;

/**
 * Idle / home surface — Brave-style New Tab equivalent.
 * Shown when no address is loaded. No data fetching in this issue.
 */
export function IdleHome() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 pb-16 pt-6 sm:pt-10">
      <LiveClock />

      {/* Stat values are wired in Visit / Search module issues, not here. */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_LABELS.map((label, index) => (
          <div
            key={label}
            className="glass animate-fade-up rounded-[var(--radius)] px-4 py-5 text-center"
            style={{ animationDelay: `${80 + index * 60}ms` }}
          >
            <div className="font-display text-3xl font-semibold tracking-tight text-[var(--muted)] sm:text-4xl">
              —
            </div>
            <div className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)] sm:text-[13px] sm:normal-case sm:tracking-normal">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full">
        <p className="mb-3 text-sm font-medium text-[var(--muted)]">
          Recently visited
          <span className="ml-2 font-normal opacity-70">(arrives with History)</span>
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[88px] flex-col justify-end rounded-[var(--radius)] border border-dashed border-[var(--surface-border)] bg-[var(--surface)]/40 p-3"
              aria-hidden="true"
            >
              <div className="skeleton mb-2 h-3 w-2/3" />
              <div className="skeleton h-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
