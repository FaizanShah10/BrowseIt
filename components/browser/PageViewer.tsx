"use client";

import { IdleHome } from "./IdleHome";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { NowherePlaceholder } from "./NowherePlaceholder";

export type ViewerPreview = "idle" | "loading" | "nowhere";

type PageViewerProps = {
  /** Issue #3 preview switch — real navigation replaces this later. */
  preview?: ViewerPreview;
};

/**
 * Main viewer region. Issue #3: static shells only (idle / loading / nowhere).
 * Sandboxed iframe rendering arrives with the iframe-bridge / browser issues.
 */
export function PageViewer({ preview = "idle" }: PageViewerProps) {
  if (preview === "loading") {
    return <LoadingPlaceholder />;
  }
  if (preview === "nowhere") {
    return <NowherePlaceholder />;
  }
  return <IdleHome />;
}
