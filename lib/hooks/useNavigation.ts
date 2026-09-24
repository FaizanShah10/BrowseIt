"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { normalizeAddress } from "@/lib/normalizeAddress";
import type { VisitMethod } from "@/types";

export type NavEntry = {
  address: string;
  siteId: string | null;
  scrollY: number;
  visitId: string;
};

export type NavState = {
  entries: NavEntry[];
  index: number;
};

type NavAction =
  | { type: "NAVIGATE"; entry: NavEntry }
  | { type: "BACK" }
  | { type: "FORWARD" }
  | { type: "UPDATE_SCROLL"; scrollY: number };

type CachedSite = { html: string; siteId: string };

/** Cache value: site payload, or `null` for a known nowhere address. */
type CacheValue = CachedSite | null;

type SiteResponse = {
  _id: string;
  html: string;
};

type VisitResponse = {
  visit: { _id: string };
};

export function navigationReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case "NAVIGATE": {
      // Destroy forward history the moment a new branch is taken (§6.1).
      const truncated = state.entries.slice(0, state.index + 1);
      const entries = [...truncated, action.entry];
      return { entries, index: entries.length - 1 };
    }
    case "BACK":
      return { ...state, index: Math.max(0, state.index - 1) };
    case "FORWARD":
      return {
        ...state,
        index: Math.min(state.entries.length - 1, state.index + 1),
      };
    case "UPDATE_SCROLL": {
      if (state.entries.length === 0) return state;
      const entries = state.entries.map((entry, i) =>
        i === state.index ? { ...entry, scrollY: action.scrollY } : entry,
      );
      return { ...state, entries };
    }
    default:
      return state;
  }
}

/** New-tab / idle home — always the root of the stack so Back can return here. */
export const HOME_ENTRY: NavEntry = {
  address: "",
  siteId: null,
  scrollY: 0,
  visitId: "home",
};

export function isHomeEntry(entry: NavEntry | null | undefined): boolean {
  return !entry || entry.address === "";
}

const INITIAL_STATE: NavState = { entries: [HOME_ENTRY], index: 0 };

function htmlForEntry(
  cache: Map<string, CacheValue>,
  entry: NavEntry | null,
): string | null {
  if (!entry || isHomeEntry(entry) || entry.siteId === null) return null;
  const cached = cache.get(entry.address);
  return cached?.html ?? null;
}

export function useNavigation(personId: string) {
  const [state, dispatch] = useReducer(navigationReducer, INITIAL_STATE);
  const cacheRef = useRef<Map<string, CacheValue>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  // Mirror of cache lookup for the current entry — cache writes must not re-render.
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);

  const currentEntry =
    state.entries.length === 0 ? null : (state.entries[state.index] ?? null);

  const canGoBack = state.entries.length > 0 && state.index > 0;
  const canGoForward =
    state.entries.length > 0 && state.index < state.entries.length - 1;

  const syncHtml = useCallback((entry: NavEntry | null) => {
    setCurrentHtml(htmlForEntry(cacheRef.current, entry));
  }, []);

  const navigate = useCallback(
    async (rawAddress: string, method: VisitMethod) => {
      const address = normalizeAddress(rawAddress);
      if (!address || !personId) return;

      setIsLoading(true);
      try {
        let siteId: string | null = null;

        if (cacheRef.current.has(address)) {
          const hit = cacheRef.current.get(address) ?? null;
          siteId = hit?.siteId ?? null;
        } else {
          const siteRes = await fetch(
            `/api/sites/${encodeURIComponent(address)}`,
          );
          if (siteRes.status === 404) {
            cacheRef.current.set(address, null);
            siteId = null;
          } else if (siteRes.ok) {
            const site = (await siteRes.json()) as SiteResponse;
            cacheRef.current.set(address, {
              html: site.html,
              siteId: site._id,
            });
            siteId = site._id;
          } else {
            throw new Error(`Failed to load site (${siteRes.status})`);
          }
        }

        // Every navigation logs a Visit — cache hit or nowhere included.
        const visitRes = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId, address, method }),
        });
        if (!visitRes.ok) {
          throw new Error(`Failed to record visit (${visitRes.status})`);
        }
        const body = (await visitRes.json()) as VisitResponse;

        const entry: NavEntry = {
          address,
          siteId,
          scrollY: 0,
          visitId: body.visit._id,
        };
        dispatch({ type: "NAVIGATE", entry });
        syncHtml(entry);
      } finally {
        setIsLoading(false);
      }
    },
    [personId, syncHtml],
  );

  const back = useCallback(() => {
    if (!(state.entries.length > 0 && state.index > 0)) return;
    const entry = state.entries[state.index - 1] ?? null;
    dispatch({ type: "BACK" });
    syncHtml(entry);
  }, [state.entries, state.index, syncHtml]);

  const forward = useCallback(() => {
    if (!(state.entries.length > 0 && state.index < state.entries.length - 1)) {
      return;
    }
    const entry = state.entries[state.index + 1] ?? null;
    dispatch({ type: "FORWARD" });
    syncHtml(entry);
  }, [state.entries, state.index, syncHtml]);

  const updateScroll = useCallback((scrollY: number) => {
    dispatch({ type: "UPDATE_SCROLL", scrollY });
  }, []);

  return {
    state,
    currentEntry,
    currentHtml,
    navigate,
    back,
    forward,
    updateScroll,
    canGoBack,
    canGoForward,
    isLoading,
  };
}
