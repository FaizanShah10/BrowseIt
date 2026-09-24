"use client";

import { useEffect, useState } from "react";
import { usePersonContext } from "@/hooks/usePersonContext";
import { LiveClock } from "./LiveClock";

type HomeSummary = {
  siteCount: number;
  visitCount: number;
  historyEntries: number;
  longestTrail: number;
  recent: Array<{
    address: string;
    title: string | null;
    siteId: string | null;
  }>;
};

type IdleHomeProps = {
  /** Jump into a recently-visited address (method: history). */
  onNavigate?: (address: string) => void;
};

const STATS = [
  { key: "siteCount", label: "Sites in the web" },
  { key: "visitCount", label: "Your visits" },
  { key: "historyEntries", label: "History entries" },
  { key: "longestTrail", label: "Longest trail" },
] as const;

/**
 * Idle / home surface — Brave-style New Tab equivalent.
 * Stats and recently-visited come from GET /api/home for the current person.
 */
export function IdleHome({ onNavigate }: IdleHomeProps) {
  const { personId } = usePersonContext();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personId) {
      setSummary(null);
      return;
    }

    const ac = new AbortController();
    setLoading(true);

    void (async () => {
      try {
        const res = await fetch(
          `/api/home?personId=${encodeURIComponent(personId)}`,
          { signal: ac.signal },
        );
        if (!res.ok) throw new Error(`home ${res.status}`);
        const data = (await res.json()) as HomeSummary;
        if (!ac.signal.aborted) setSummary(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setSummary(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [personId]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-1 pb-20 pt-4 sm:gap-8 sm:px-2 sm:pb-16 sm:pt-8 md:gap-10 md:pt-10">
      <LiveClock />

      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {STATS.map((stat, index) => {
          const value = summary ? summary[stat.key] : null;
          return (
            <div
              key={stat.key}
              className="glass animate-fade-up rounded-[var(--radius)] px-3 py-4 text-center sm:px-4 sm:py-5"
              style={{ animationDelay: `${80 + index * 60}ms` }}
            >
              <div
                className={`font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl ${
                  value === null
                    ? "text-[var(--muted)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {loading && value === null ? "…" : (value ?? "—")}
              </div>
              <div className="mt-1.5 text-[11px] leading-snug font-medium text-[var(--muted)] sm:mt-2 sm:text-xs md:text-[13px]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full">
        <p className="mb-2 text-sm font-medium text-[var(--muted)] sm:mb-3">
          Recently visited
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {summary && summary.recent.length > 0
            ? summary.recent.map((item, i) => (
                <button
                  key={item.address}
                  type="button"
                  onClick={() => onNavigate?.(item.address)}
                  className="glass animate-fade-up flex min-h-[72px] flex-col justify-end rounded-[var(--radius)] p-3 text-left transition hover:bg-[var(--accent-soft)] sm:min-h-[88px]"
                  style={{ animationDelay: `${200 + i * 50}ms` }}
                >
                  <span className="truncate text-sm font-medium">
                    {item.title ?? item.address}
                  </span>
                  <span className="mt-1 truncate text-xs text-[var(--muted)]">
                    {item.address}
                  </span>
                </button>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex min-h-[72px] flex-col justify-end rounded-[var(--radius)] border border-dashed border-[var(--surface-border)] bg-[var(--surface)]/40 p-3 sm:min-h-[88px]"
                  aria-hidden="true"
                >
                  {loading ? (
                    <>
                      <div className="skeleton mb-2 h-3 w-2/3" />
                      <div className="skeleton h-2 w-1/2" />
                    </>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">
                      {i === 0 ? "No visits yet" : ""}
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
