"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Paginated, Site } from "@/types";

/** Site as returned over the wire — dates are ISO strings. */
export type SearchHit = Omit<Site, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type SearchPage = Paginated<SearchHit>;

const DEBOUNCE_MS = 280;

type UseSearchOptions = {
  query: string;
  /** When false, no fetch runs (e.g. search tab closed). */
  enabled: boolean;
};

type UseSearchResult = {
  results: SearchHit[];
  /** Trimmed query that the current results were fetched for (after debounce). */
  activeQuery: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
};

/**
 * Debounced, cursor-paginated full-text search via GET /api/search.
 * Mirrors useHistory's pagination shape (issue #9 / #10).
 */
export function useSearch({ query, enabled }: UseSearchOptions): UseSearchResult {
  const [results, setResults] = useState<SearchHit[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef("");

  cursorRef.current = nextCursor;

  const fetchPage = useCallback(
    async (q: string, cursor: string | null, mode: "replace" | "append") => {
      if (!q || inFlightRef.current) return;

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
        const params = new URLSearchParams({ q });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/search?${params}`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to search (${res.status})`);
        }
        const page = (await res.json()) as SearchPage;

        if (session !== sessionRef.current) return;

        setResults((prev) =>
          mode === "replace" ? page.items : [...prev, ...page.items],
        );
        setNextCursor(page.nextCursor);
        setActiveQuery(q);
        activeQueryRef.current = q;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (session !== sessionRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to search");
      } finally {
        if (abortRef.current === ac) {
          inFlightRef.current = false;
          if (session === sessionRef.current) {
            setIsLoading(false);
            setIsLoadingMore(false);
          }
        }
      }
    },
    [],
  );

  // Debounce query changes; empty query clears without an error state.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = query.trim();

    if (!enabled) {
      sessionRef.current += 1;
      abortRef.current?.abort();
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!trimmed) {
      sessionRef.current += 1;
      abortRef.current?.abort();
      inFlightRef.current = false;
      setResults([]);
      setNextCursor(null);
      setActiveQuery("");
      activeQueryRef.current = "";
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    // Keep prior results visible while waiting — no empty flash between keystrokes.
    setIsLoading(true);
    setError(null);

    debounceRef.current = setTimeout(() => {
      sessionRef.current += 1;
      inFlightRef.current = false;
      setNextCursor(null);
      void fetchPage(trimmed, null, "replace");
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query, enabled, fetchPage]);

  // Abort in-flight work when the hook unmounts or the panel closes.
  useEffect(() => {
    if (!enabled) return;
    return () => {
      sessionRef.current += 1;
      abortRef.current?.abort();
      inFlightRef.current = false;
    };
  }, [enabled]);

  const loadMore = useCallback(() => {
    const q = activeQueryRef.current;
    if (!enabled || !q || !cursorRef.current || inFlightRef.current) {
      return;
    }
    void fetchPage(q, cursorRef.current, "append");
  }, [enabled, fetchPage]);

  return {
    results,
    activeQuery,
    isLoading,
    isLoadingMore,
    hasMore: nextCursor !== null,
    error,
    loadMore,
  };
}
