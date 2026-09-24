"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { injectFrameScript } from "@/lib/frameBridge/injectedScript";
import { frameMessageSchema } from "@/lib/frameBridge/messageSchema";
import { isHomeEntry, type NavEntry } from "@/lib/hooks/useNavigation";
import { IdleHome } from "./IdleHome";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { NowherePlaceholder } from "./NowherePlaceholder";

type PageViewerProps = {
  entry: NavEntry | null;
  isLoading: boolean;
  /** Set by Back/Forward; cleared here after restore. */
  pendingScrollY: MutableRefObject<number | null>;
  /** Link clicks from the sandboxed frame (method: 'link'). */
  onNavigate?: (rawAddress: string) => void;
};

/**
 * Main viewer: idle home, loading, nowhere placeholder, or sandboxed site HTML.
 * Author HTML enters only via iframe srcdoc — never dangerouslySetInnerHTML.
 * Parent owns scrolling: iframe height tracks content via resize messages.
 */
export function PageViewer({
  entry,
  isLoading,
  pendingScrollY,
  onNavigate,
}: PageViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(280);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const isLiveSite =
    !isHomeEntry(entry) && entry.siteId !== null && entry.html !== null;

  /** After paint; clear pending so only the final Back/Forward destination wins. */
  function restorePendingScroll() {
    if (pendingScrollY.current === null) return;
    const y = pendingScrollY.current;
    pendingScrollY.current = null;
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  }

  // Nowhere / home: no resize message — restore immediately so pending doesn't stick.
  useEffect(() => {
    if (isLiveSite) return;
    if (pendingScrollY.current === null) return;
    restorePendingScroll();
    // pendingScrollY is a stable ref; restore on entry change only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.address, entry?.visitId, isLiveSite]);

  // Reset height when the live page changes so restore waits for a fresh resize.
  useEffect(() => {
    if (!isLiveSite) return;
    setIframeHeight(280);
  }, [entry?.address, entry?.visitId, isLiveSite]);

  useEffect(() => {
    if (!isLiveSite) return;

    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const parsed = frameMessageSchema.safeParse(e.data);
      if (!parsed.success) return;

      const msg = parsed.data;
      if (msg.type === "navigate") {
        onNavigateRef.current?.(msg.address);
        return;
      }

      if (msg.type === "resize") {
        const height = Math.max(1, Math.ceil(msg.height));
        // Apply height on the DOM before restore so scrollY is reachable this frame.
        if (iframeRef.current) {
          iframeRef.current.style.height = `${height}px`;
        }
        setIframeHeight(height);
        if (pendingScrollY.current !== null) {
          restorePendingScroll();
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pendingScrollY is a stable ref
  }, [isLiveSite, entry?.address, entry?.visitId]);

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
    <div className="glass mx-auto w-full max-w-4xl overflow-hidden rounded-[var(--radius)] animate-fade-up">
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        srcDoc={injectFrameScript(entry.html)}
        title="Site content"
        className="w-full border-0 bg-white"
        style={{ height: iframeHeight, overflow: "hidden", display: "block" }}
      />
    </div>
  );
}
