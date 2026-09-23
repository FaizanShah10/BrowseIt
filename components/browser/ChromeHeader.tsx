"use client";

import { AddressBar } from "./AddressBar";
import {
  IconHistory,
  IconImage,
  IconMoon,
  IconPlain,
  IconPublish,
  IconSun,
  IconGrid,
} from "./icons";
import { NavControls } from "./NavControls";
import { PersonPicker } from "./PersonPicker";

type ChromeHeaderProps = {
  address: string;
  onAddressChange: (value: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  backgroundMode: "plain" | "picture";
  onToggleBackground: () => void;
  publishOpen: boolean;
  onOpenPublish: () => void;
  panelOpen: boolean;
  onOpenPanel: () => void;
  personName?: string;
  onPersonChange?: (name: string) => void;
};

/**
 * Two-tier browser chrome: title strip + nav/address row.
 * One surface only — the “BrowseIt” chip is decorative window chrome, not a tab strip.
 */
export function ChromeHeader({
  address,
  onAddressChange,
  theme,
  onToggleTheme,
  backgroundMode,
  onToggleBackground,
  publishOpen,
  onOpenPublish,
  panelOpen,
  onOpenPanel,
  personName = "Ada Lovelace",
  onPersonChange,
}: ChromeHeaderProps) {
  const initials = personName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="browser-chrome sticky top-0 z-20">
      {/* Title strip — single surface label (not multi-tab). */}
      <div className="chrome-titlebar flex items-end gap-2 px-2 pt-1.5 sm:px-3">
        <div
          className="mb-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[11px] font-bold tracking-tight text-white"
          aria-hidden="true"
        >
          N
        </div>

        <div
          className="chrome-surface-tab relative flex max-w-[11rem] flex-1 items-center gap-2 rounded-t-[10px] px-3 py-2 sm:max-w-[14rem]"
          title="BrowseIt is one surface — tabs are out of scope"
        >
          <IconGrid size={13} className="shrink-0 text-[var(--accent)]" />
          <span className="truncate text-[13px] font-medium">BrowseIt</span>
        </div>
      </div>

      {/* Navigation + address row */}
      <div className="chrome-toolbar grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        <NavControls canGoBack={false} canGoForward={false} />

        <AddressBar value={address} onChange={onAddressChange} />

        <div className="flex items-center gap-1 sm:gap-1.5">
          <PersonPicker value={personName} onChange={onPersonChange} />

          <button
            type="button"
            className="chrome-btn"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>

          <button
            type="button"
            className="chrome-btn"
            data-active={backgroundMode === "picture"}
            aria-label={
              backgroundMode === "picture"
                ? "Switch to plain background"
                : "Switch to picture background"
            }
            onClick={onToggleBackground}
          >
            {backgroundMode === "picture" ? <IconPlain /> : <IconImage />}
          </button>

          <button
            type="button"
            className="chrome-btn"
            aria-label="Publish a page"
            data-active={publishOpen}
            onClick={onOpenPublish}
          >
            <IconPublish />
          </button>

          <button
            type="button"
            className="chrome-btn"
            aria-label="Open history and search"
            data-active={panelOpen}
            onClick={onOpenPanel}
          >
            <IconHistory />
          </button>

          <span className="chrome-divider mx-1 hidden h-5 w-px sm:block" aria-hidden="true" />

          <div
            className="chrome-avatar hidden h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide text-white sm:flex"
            aria-hidden="true"
            title={personName}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
