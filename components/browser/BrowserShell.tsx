"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PublishForm } from "../publish/PublishForm";
import { ChromeHeader } from "./ChromeHeader";
import { PageViewer, type ViewerPreview } from "./PageViewer";
import { SidePanel } from "./SidePanel";
const THEME_KEY = "browseit:theme";
const BG_KEY = "browseit:background";
const BG_IMAGE_KEY = "browseit:background-image";

const BACKGROUNDS = [
  { id: "dawn", src: "/backgrounds/dawn.svg", credit: "Dawn — generated SVG backdrop" },
  { id: "dusk", src: "/backgrounds/dusk.svg", credit: "Dusk — generated SVG backdrop" },
  { id: "mist", src: "/backgrounds/mist.svg", credit: "Mist — generated SVG backdrop" },
] as const;

type ThemeMode = "light" | "dark";
type BackgroundMode = "plain" | "picture";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing / blocked storage — ignore.
  }
}

function systemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * BrowseIt app shell — static chrome for issue #3.
 * No services, repositories, or fetch. Panel / theme / background are UI-only state.
 */
export function BrowserShell() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("plain");
  const [backgroundId, setBackgroundId] = useState<(typeof BACKGROUNDS)[number]["id"]>("dawn");
  const [address, setAddress] = useState("");
  const [personName, setPersonName] = useState("Ada Lovelace");
  const [panelOpen, setPanelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [preview, setPreview] = useState<ViewerPreview>("idle");
  const [showEmptyPanel, setShowEmptyPanel] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const boot = window.requestAnimationFrame(() => {
      const storedTheme = readStorage(THEME_KEY);
      const nextTheme: ThemeMode =
        storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme();
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;

      const storedBg = readStorage(BG_KEY);
      setBackgroundMode(storedBg === "picture" ? "picture" : "plain");

      const storedImage = readStorage(BG_IMAGE_KEY);
      if (BACKGROUNDS.some((b) => b.id === storedImage)) {
        setBackgroundId(storedImage as (typeof BACKGROUNDS)[number]["id"]);
      }

      setReady(true);
    });
    return () => window.cancelAnimationFrame(boot);
  }, []);

  function applyTheme(next: ThemeMode) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    writeStorage(THEME_KEY, next);
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  function toggleBackground() {
    const next: BackgroundMode = backgroundMode === "plain" ? "picture" : "plain";
    setBackgroundMode(next);
    writeStorage(BG_KEY, next);
    if (next === "picture") {
      // Cycle picture when entering picture mode repeatedly from plain.
      const idx = BACKGROUNDS.findIndex((b) => b.id === backgroundId);
      const cycled = BACKGROUNDS[(idx + 1) % BACKGROUNDS.length];
      setBackgroundId(cycled.id);
      writeStorage(BG_IMAGE_KEY, cycled.id);
    }
  }

  const picture = BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <div
        className="shell-backdrop"
        data-mode={backgroundMode}
        style={
          backgroundMode === "picture"
            ? ({ ["--shell-picture"]: `url(${picture.src})` } as CSSProperties)
            : undefined
        }
      />

      <div className="relative z-10 flex min-h-full flex-col">
        <ChromeHeader
          address={address}
          onAddressChange={setAddress}
          theme={theme}
          onToggleTheme={toggleTheme}
          backgroundMode={backgroundMode}
          onToggleBackground={toggleBackground}
          publishOpen={publishOpen}
          onOpenPublish={() => setPublishOpen(true)}
          panelOpen={panelOpen}
          onOpenPanel={() => setPanelOpen(true)}
          personName={personName}
          onPersonChange={setPersonName}
        />

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6 md:py-8">
          {/* Issue #3 only: preview shells without navigation logic. */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 sm:mb-5 sm:gap-2">
            {(
              [
                ["idle", "Home"],
                ["loading", "Loading"],
                ["nowhere", "Nowhere"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                  preview === id
                    ? "bg-[var(--accent)] text-white"
                    : "glass text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                onClick={() => setPreview(id)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                showEmptyPanel
                  ? "bg-[var(--accent)] text-white"
                  : "glass text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => {
                setShowEmptyPanel((v) => !v);
                setPanelOpen(true);
              }}
            >
              Empty panels
            </button>
          </div>

          <PageViewer preview={preview} />
        </main>

        {backgroundMode === "picture" && ready ? (
          <p className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-10 max-w-[70%] text-[10px] text-white/80 drop-shadow sm:bottom-4 sm:left-4 sm:max-w-none sm:text-[11px]">
            {picture.credit}
          </p>
        ) : null}
      </div>

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        showEmpty={showEmptyPanel}
      />
      <PublishForm open={publishOpen} onClose={() => setPublishOpen(false)} />
    </div>
  );
}
