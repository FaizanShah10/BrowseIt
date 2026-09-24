"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PublishForm } from "../publish/PublishForm";
import { usePerson } from "@/lib/context/PersonContext";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { ChromeHeader } from "./ChromeHeader";
import { PageViewer } from "./PageViewer";
import { PersonGate } from "./PersonPicker";
import { SidePanel } from "./SidePanel";

const THEME_KEY = "browseit:theme";
const BG_KEY = "browseit:background";
const BG_IMAGE_KEY = "browseit:background-image";

const BACKGROUNDS = [
  {
    id: "matterhorn",
    src: "/backgrounds/background1.jpg",
    credit: "Matterhorn at dawn — photo backdrop",
  },
  {
    id: "alpine",
    src: "/backgrounds/background2.jpg",
    credit: "Alpine vista — photo backdrop",
  },
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
 * BrowseIt app shell — chrome + navigation + history panel.
 */
export function BrowserShell() {
  const { currentPerson, personId } = usePerson();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("plain");
  const [backgroundId, setBackgroundId] =
    useState<(typeof BACKGROUNDS)[number]["id"]>("matterhorn");
  const [panelOpen, setPanelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const {
    currentEntry,
    navigate,
    back,
    forward,
    pendingScrollY,
    canGoBack,
    canGoForward,
    isLoading,
    invalidateAddress,
  } = useNavigation(personId);

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

  // Alt+Left / Alt+Right — in-app Back/Forward; stop the host browser's own stack.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (canGoBack) back();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (canGoForward) forward();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoBack, canGoForward, back, forward]);

  function applyTheme(next: ThemeMode) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    writeStorage(THEME_KEY, next);
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  function toggleBackground() {
    if (backgroundMode === "plain") {
      // Enter picture mode on the primary photo.
      setBackgroundMode("picture");
      writeStorage(BG_KEY, "picture");
      setBackgroundId("matterhorn");
      writeStorage(BG_IMAGE_KEY, "matterhorn");
      return;
    }
    // Already on a picture — cycle photos, or leave picture mode after the last.
    const idx = BACKGROUNDS.findIndex((b) => b.id === backgroundId);
    const nextIdx = idx + 1;
    if (nextIdx >= BACKGROUNDS.length) {
      setBackgroundMode("plain");
      writeStorage(BG_KEY, "plain");
      return;
    }
    const cycled = BACKGROUNDS[nextIdx];
    setBackgroundId(cycled.id);
    writeStorage(BG_IMAGE_KEY, cycled.id);
  }

  const picture = BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];
  const personName = currentPerson?.name ?? "";
  const hasPerson = Boolean(personId);

  return (
    <div
      className="relative flex min-h-full flex-col overflow-x-hidden"
      data-background={backgroundMode}
    >
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
          address={currentEntry?.address ?? ""}
          isLoading={isLoading}
          onNavigate={(raw) => {
            void navigate(raw, "typed");
          }}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={back}
          onForward={forward}
          theme={theme}
          onToggleTheme={toggleTheme}
          backgroundMode={backgroundMode}
          onToggleBackground={toggleBackground}
          publishOpen={publishOpen}
          onOpenPublish={() => {
            if (hasPerson) setPublishOpen(true);
          }}
          panelOpen={panelOpen}
          onOpenPanel={() => {
            if (hasPerson) setPanelOpen(true);
          }}
          personName={personName}
        />

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6 md:py-8">
          <PageViewer
            entry={currentEntry}
            isLoading={isLoading}
            pendingScrollY={pendingScrollY}
            onNavigate={(raw) => {
              void navigate(raw, "link");
            }}
            onHomeNavigate={(raw) => {
              void navigate(raw, "history");
            }}
          />
        </main>

        {backgroundMode === "picture" && ready ? (
          <p className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-10 max-w-[70%] text-[10px] text-white/80 drop-shadow sm:bottom-4 sm:left-4 sm:max-w-none sm:text-[11px]">
            {picture.credit}
          </p>
        ) : null}
      </div>

      <SidePanel
        open={panelOpen && hasPerson}
        onClose={() => setPanelOpen(false)}
        personId={personId}
        onHistoryNavigate={(address) => {
          void navigate(address, "history");
        }}
        onSearchNavigate={(address) => {
          void navigate(address, "search");
        }}
      />
      <PublishForm
        open={publishOpen && hasPerson}
        onClose={() => setPublishOpen(false)}
        onPublished={(address) => {
          invalidateAddress(address);
          void navigate(address, "typed");
        }}
      />
      <PersonGate />
    </div>
  );
}
