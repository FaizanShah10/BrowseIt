"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { normalizeAddress } from "@/lib/normalizeAddress";
import type { VisitMethod } from "@/types";

export type NavEntry = {
  address: string;
  siteId: string | null;
  /** Sanitized site HTML, or `null` for nowhere / home. */
  html: string | null;
  scrollY: number;
  visitId: string;
};

export type NavState = {
  entries: NavEntry[];
  index: number;
};

export type NavAction =
  | { type: "NAVIGATE"; entry: NavEntry; scrollY: number }
  | { type: "BACK"; scrollY: number }
  | { type: "FORWARD"; scrollY: number }
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

function saveScrollOnCurrent(
  entries: NavEntry[],
  index: number,
  scrollY: number,
): NavEntry[] {
  if (entries.length === 0) return entries;
  const updated = [...entries];
  updated[index] = { ...updated[index], scrollY };
  return updated;
}

export function navigationReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case "NAVIGATE": {
      // Atomically save leave-scroll on the current entry, then branch (§6.1 / §6.2).
      const withScroll = saveScrollOnCurrent(
        state.entries,
        state.index,
        action.scrollY,
      );
      const truncated = withScroll.slice(0, state.index + 1);
      const entries = [...truncated, action.entry];
      return { entries, index: entries.length - 1 };
    }
    case "BACK": {
      const entries = saveScrollOnCurrent(
        state.entries,
        state.index,
        action.scrollY,
      );
      return {
        entries,
        index: Math.max(0, state.index - 1),
      };
    }
    case "FORWARD": {
      const entries = saveScrollOnCurrent(
        state.entries,
        state.index,
        action.scrollY,
      );
      return {
        entries,
        index: Math.min(entries.length - 1, state.index + 1),
      };
    }
    case "UPDATE_SCROLL": {
      if (state.entries.length === 0) return state;
      return {
        ...state,
        entries: saveScrollOnCurrent(state.entries, state.index, action.scrollY),
      };
    }
    default:
      return state;
  }
}

/** New-tab / idle home — always the root of the stack so Back can return here. */
export const HOME_ENTRY: NavEntry = {
  address: "",
  siteId: null,
  html: null,
  scrollY: 0,
  visitId: "home",
};

export function isHomeEntry(entry: NavEntry | null | undefined): boolean {
  return !entry || entry.address === "";
}

const INITIAL_STATE: NavState = { entries: [HOME_ENTRY], index: 0 };

export function useNavigation(personId: string) {
  const [state, dispatch] = useReducer(navigationReducer, INITIAL_STATE);
  const cacheRef = useRef<Map<string, CacheValue>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Set by Back/Forward; PageViewer restores after iframe resize (or immediately for nowhere). */
  const pendingScrollY = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentEntry =
    state.entries.length === 0 ? null : (state.entries[state.index] ?? null);

  const canGoBack = state.entries.length > 0 && state.index > 0;
  const canGoForward =
    state.entries.length > 0 && state.index < state.entries.length - 1;

  const navigate = useCallback(
    async (rawAddress: string, method: VisitMethod) => {
      const address = normalizeAddress(rawAddress);
      if (!address || !personId) return;

      setIsLoading(true);
      try {
        let siteId: string | null = null;
        let html: string | null = null;

        if (cacheRef.current.has(address)) {
          const hit = cacheRef.current.get(address) ?? null;
          siteId = hit?.siteId ?? null;
          html = hit?.html ?? null;
        } else {
          const siteRes = await fetch(
            `/api/sites/${encodeURIComponent(address)}`,
          );
          if (siteRes.status === 404) {
            cacheRef.current.set(address, null);
            siteId = null;
            html = null;
          } else if (siteRes.ok) {
            const site = (await siteRes.json()) as SiteResponse;
            cacheRef.current.set(address, {
              html: site.html,
              siteId: site._id,
            });
            siteId = site._id;
            html = site.html;
          } else {
            throw new Error(`Failed to load site (${siteRes.status})`);
          }
        }

        // Every navigation logs a Visit — cache hit or nowhere included.
        // Back/Forward never reach here — they only move the stack pointer.
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
          html,
          scrollY: 0,
          visitId: body.visit._id,
        };
        // Clear any pending Back/Forward restore — new nav always starts at top.
        pendingScrollY.current = null;
        dispatch({ type: "NAVIGATE", entry, scrollY: window.scrollY });
        window.scrollTo(0, 0);
      } finally {
        setIsLoading(false);
      }
    },
    [personId],
  );

  const back = useCallback(() => {
    const s = stateRef.current;
    if (s.entries.length === 0 || s.index <= 0) return;
    const target = s.entries[s.index - 1];
    pendingScrollY.current = target?.scrollY ?? 0;
    dispatch({ type: "BACK", scrollY: window.scrollY });
  }, []);

  const forward = useCallback(() => {
    const s = stateRef.current;
    if (s.entries.length === 0 || s.index >= s.entries.length - 1) return;
    const target = s.entries[s.index + 1];
    pendingScrollY.current = target?.scrollY ?? 0;
    dispatch({ type: "FORWARD", scrollY: window.scrollY });
  }, []);

  const updateScroll = useCallback((scrollY: number) => {
    dispatch({ type: "UPDATE_SCROLL", scrollY });
  }, []);

  /** Drop a cached address so a post-publish navigate re-fetches (e.g. was nowhere). */
  const invalidateAddress = useCallback((rawAddress: string) => {
    const address = normalizeAddress(rawAddress);
    if (address) cacheRef.current.delete(address);
  }, []);

  return {
    state,
    currentEntry,
    navigate,
    back,
    forward,
    updateScroll,
    invalidateAddress,
    pendingScrollY,
    canGoBack,
    canGoForward,
    isLoading,
  };
}
