"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Paginated, Visit } from "@/types";

/** Visit as returned over the wire — dates are ISO strings. */
export type VisitRow = Omit<Visit, "createdAt"> & { createdAt: string };

type VisitsPage = Paginated<VisitRow>;

type UseHistoryOptions = {
  personId: string;
  /** When false, no fetch runs (panel closed). */
  enabled: boolean;
};

type UseHistoryResult = {
  visits: VisitRow[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  /** Addresses seen in pages loaded so far — cheap visited set for polish. */
  visitedAddresses: Set<string>;
};

/**
 * Cursor-paginated Visit log for the History panel.
 * Independent of the in-memory navigation stack (DESIGN §03 / issue #9).
 */
export function useHistory({
  personId,
  enabled,
}: UseHistoryOptions): UseHistoryResult {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  cursorRef.current = nextCursor;

  const fetchPage = useCallback(
    async (cursor: string | null, mode: "replace" | "append") => {
      if (!personId || inFlightRef.current) return;

      inFlightRef.current = true;
      const session = sessionRef.current;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (mode === "replace") {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({ personId });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/visits?${params}`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to load history (${res.status})`);
        }
        const page = (await res.json()) as VisitsPage;

        // Ignore if person/panel session changed while in flight.
        if (session !== sessionRef.current) return;

        setVisits((prev) =>
          mode === "replace" ? page.items : [...prev, ...page.items],
        );
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (session !== sessionRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        // Only the active request may clear the in-flight guard.
        if (abortRef.current === ac) {
          inFlightRef.current = false;
          if (session === sessionRef.current) {
            setIsLoading(false);
            setIsLoadingMore(false);
          }
        }
      }
    },
    [personId],
  );

  // Reset + fetch first page when panel opens or person changes.
  useEffect(() => {
    sessionRef.current += 1;
    abortRef.current?.abort();
    inFlightRef.current = false;
    setVisits([]);
    setNextCursor(null);
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);

    if (!enabled || !personId) return;

    void fetchPage(null, "replace");

    return () => {
      sessionRef.current += 1;
      abortRef.current?.abort();
      inFlightRef.current = false;
    };
  }, [enabled, personId, fetchPage]);

  const loadMore = useCallback(() => {
    if (!enabled || !personId || !cursorRef.current || inFlightRef.current) {
      return;
    }
    void fetchPage(cursorRef.current, "append");
  }, [enabled, personId, fetchPage]);

  const visitedAddresses = useMemo(
    () => new Set(visits.map((v) => v.address)),
    [visits],
  );

  return {
    visits,
    isLoading,
    isLoadingMore,
    hasMore: nextCursor !== null,
    error,
    loadMore,
    visitedAddresses,
  };
}
