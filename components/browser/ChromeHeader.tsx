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
  isLoading: boolean;
  onNavigate: (rawAddress: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  backgroundMode: "plain" | "picture";
  onToggleBackground: () => void;
  publishOpen: boolean;
  onOpenPublish: () => void;
  panelOpen: boolean;
  onOpenPanel: () => void;
  personName?: string;
};

/**
 * Two-tier browser chrome: title strip + nav/address row.
 * One surface only — the “BrowseIt” chip is decorative window chrome, not a tab strip.
 */
export function ChromeHeader({
  address,
  isLoading,
  onNavigate,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  theme,
  onToggleTheme,
  backgroundMode,
  onToggleBackground,
  publishOpen,
  onOpenPublish,
  panelOpen,
  onOpenPanel,
  personName = "",
}: ChromeHeaderProps) {
  const initials = personName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="browser-chrome sticky top-0 z-20">
      <div className="chrome-titlebar flex items-end gap-2 px-2 pt-1 sm:px-3 sm:pt-1.5">
        <div
          className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[10px] font-bold tracking-tight text-white sm:mb-1.5 sm:h-7 sm:w-7 sm:text-[11px]"
          aria-hidden="true"
        >
          N
        </div>

        <div
          className="chrome-surface-tab relative flex max-w-[9.5rem] flex-1 items-center gap-1.5 rounded-t-[10px] px-2.5 py-1.5 sm:max-w-[14rem] sm:gap-2 sm:px-3 sm:py-2"
          title="BrowseIt is one surface — tabs are out of scope"
        >
          <IconGrid size={13} className="shrink-0 text-[var(--accent)]" />
          <span className="truncate text-[12px] font-medium sm:text-[13px]">BrowseIt</span>
        </div>
      </div>

      <div className="chrome-toolbar px-2 py-1.5 sm:px-3 sm:py-2">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-1 gap-y-1.5 sm:gap-x-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-3">
          <NavControls
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={onBack}
            onForward={onForward}
          />

          <div className="chrome-actions flex min-w-0 items-center justify-end gap-0.5 sm:gap-1 md:col-start-3 md:row-start-1 md:gap-1.5">
            <PersonPicker />

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

            <span
              className="chrome-divider mx-0.5 hidden h-5 w-px md:mx-1 md:block"
              aria-hidden="true"
            />

            <div
              className="chrome-avatar hidden h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide text-white lg:flex"
              aria-hidden="true"
              title={personName}
            >
              {initials}
            </div>
          </div>

          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
            <AddressBar
              address={address}
              isLoading={isLoading}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
