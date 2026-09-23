"use client";

import { IconBack, IconForward, IconRefresh } from "./icons";

type NavControlsProps = {
  /** Visual only — later issues wire these to the navigation reducer. */
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
};

export function NavControls({
  canGoBack = false,
  canGoForward = false,
  onBack,
  onForward,
  onRefresh,
}: NavControlsProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Navigation">
      <button
        type="button"
        className="chrome-btn"
        aria-label="Back"
        disabled={!canGoBack}
        onClick={onBack}
      >
        <IconBack />
      </button>
      <button
        type="button"
        className="chrome-btn"
        aria-label="Forward"
        disabled={!canGoForward}
        onClick={onForward}
      >
        <IconForward />
      </button>
      <button
        type="button"
        className="chrome-btn"
        aria-label="Refresh"
        disabled
        title="Refresh arrives with navigation"
        onClick={onRefresh}
      >
        <IconRefresh />
      </button>
    </div>
  );
}
