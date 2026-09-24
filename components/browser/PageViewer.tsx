"use client";

import { isHomeEntry, type NavEntry } from "@/lib/hooks/useNavigation";
import { IdleHome } from "./IdleHome";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { NowherePlaceholder } from "./NowherePlaceholder";

type PageViewerProps = {
  entry: NavEntry | null;
  html: string | null;
  isLoading: boolean;
};

/**
 * Main viewer: idle home, loading, nowhere placeholder, or sandboxed site HTML.
 * Author HTML enters only via iframe srcdoc — never dangerouslySetInnerHTML.
 */
export function PageViewer({ entry, html, isLoading }: PageViewerProps) {
  // Empty-address home entry (stack root) is the default clock view — not "nowhere".
  if (isHomeEntry(entry)) {
    if (isLoading) return <LoadingPlaceholder />;
    return <IdleHome />;
  }

  if (entry.siteId === null) {
    return <NowherePlaceholder address={entry.address} />;
  }

  if (!html) {
    // Cache miss edge case while loading — keep layout stable.
    if (isLoading) return <LoadingPlaceholder />;
    return <NowherePlaceholder address={entry.address} />;
  }

  return (
    <div className="glass mx-auto flex min-h-[280px] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius)] animate-fade-up sm:min-h-[360px] md:min-h-[420px]">
      <iframe
        sandbox="allow-scripts"
        srcDoc={html}
        title="Site content"
        className="h-full min-h-[280px] w-full flex-1 border-0 bg-white sm:min-h-[360px] md:min-h-[420px]"
      />
    </div>
  );
}
