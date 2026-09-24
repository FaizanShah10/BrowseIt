"use client";

import { isHomeEntry, type NavEntry } from "@/lib/hooks/useNavigation";
import { IdleHome } from "./IdleHome";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { NowherePlaceholder } from "./NowherePlaceholder";

type PageViewerProps = {
  entry: NavEntry | null;
  isLoading: boolean;
};

/**
 * Main viewer: idle home, loading, nowhere placeholder, or sandboxed site HTML.
 * Author HTML enters only via iframe srcdoc — never dangerouslySetInnerHTML.
 * Back/Forward render from entry.html synchronously — no fetch, no cache lookup.
 */
export function PageViewer({ entry, isLoading }: PageViewerProps) {
  // Empty stack or empty-address home entry — default clock view, not "nowhere".
  if (isHomeEntry(entry)) {
    if (isLoading) return <LoadingPlaceholder />;
    return <IdleHome />;
  }

  // Dead address — siteId null means nowhere (html is also null).
  if (entry.siteId === null || entry.html === null) {
    return <NowherePlaceholder address={entry.address} />;
  }

  // Live site — HTML already on the stack entry (instant on Back/Forward).
  return (
    <div className="glass mx-auto flex min-h-[280px] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius)] animate-fade-up sm:min-h-[360px] md:min-h-[420px]">
      <iframe
        sandbox="allow-scripts"
        srcDoc={entry.html}
        title="Site content"
        className="h-full min-h-[280px] w-full flex-1 border-0 bg-white sm:min-h-[360px] md:min-h-[420px]"
      />
    </div>
  );
}
