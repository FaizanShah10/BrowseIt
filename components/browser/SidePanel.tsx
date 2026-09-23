"use client";

import { useState } from "react";
import { HistoryPanel } from "../history/HistoryPanel";
import { SearchBar } from "../search/SearchBar";
import { SearchResults } from "../search/SearchResults";
import { IconClose } from "./icons";

type SidePanelProps = {
  open: boolean;
  onClose: () => void;
  /** Preview empty states for History / Search placeholders. */
  showEmpty?: boolean;
};

type PanelTab = "history" | "search";

export function SidePanel({ open, onClose, showEmpty = false }: SidePanelProps) {
  const [tab, setTab] = useState<PanelTab>("history");
  const [query, setQuery] = useState("");

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:bg-black/25"
        aria-label="Close side panel"
        onClick={onClose}
      />
      {/* Full-screen overlay on phone/tablet; fixed column from lg up. */}
      <aside
        className="glass-strong fixed inset-0 z-50 flex w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-panel-in lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[min(var(--panel-width),100vw)] lg:pt-0 lg:pb-0"
        aria-label="History and search"
      >
        <div className="flex items-center gap-2 border-b border-[var(--surface-border)] px-3 py-3">
          <div className="flex flex-1 rounded-full bg-[var(--skeleton)] p-1">
            <button
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition lg:py-1.5 ${
                tab === "history" ? "bg-[var(--surface-strong)] shadow-sm" : "text-[var(--muted)]"
              }`}
              onClick={() => setTab("history")}
            >
              History
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition lg:py-1.5 ${
                tab === "search" ? "bg-[var(--surface-strong)] shadow-sm" : "text-[var(--muted)]"
              }`}
              onClick={() => setTab("search")}
            >
              Search
            </button>
          </div>
          <button type="button" className="chrome-btn" aria-label="Close panel" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        {tab === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col pt-3">
            <SearchBar value={query} onChange={setQuery} />
            <SearchResults empty={showEmpty} />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pt-3">
            <HistoryPanel empty={showEmpty} />
          </div>
        )}
      </aside>
    </>
  );
}
