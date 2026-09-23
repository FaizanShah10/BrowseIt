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
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-1 pb-20 pt-4 sm:gap-8 sm:px-2 sm:pb-16 sm:pt-8 md:gap-10 md:pt-10">
      <LiveClock />

      {/* Stat values are wired in Visit / Search module issues, not here. */}
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {STAT_LABELS.map((label, index) => (
          <div
            key={label}
            className="glass animate-fade-up rounded-[var(--radius)] px-3 py-4 text-center sm:px-4 sm:py-5"
            style={{ animationDelay: `${80 + index * 60}ms` }}
          >
            <div className="font-display text-2xl font-semibold tracking-tight text-[var(--muted)] sm:text-3xl md:text-4xl">
              —
            </div>
            <div className="mt-1.5 text-[11px] leading-snug font-medium text-[var(--muted)] sm:mt-2 sm:text-xs md:text-[13px]">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full">
        <p className="mb-2 text-sm font-medium text-[var(--muted)] sm:mb-3">
          Recently visited
          <span className="mt-0.5 block font-normal opacity-70 sm:mt-0 sm:ml-2 sm:inline">
            (arrives with History)
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[72px] flex-col justify-end rounded-[var(--radius)] border border-dashed border-[var(--surface-border)] bg-[var(--surface)]/40 p-3 sm:min-h-[88px]"
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
