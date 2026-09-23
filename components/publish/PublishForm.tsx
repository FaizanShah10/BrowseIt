"use client";

import { useId } from "react";
import { IconClose } from "../browser/icons";

type PublishFormProps = {
  open: boolean;
  onClose: () => void;
};

/** Publish panel shell — form fields are visual only until the publish issue. */
export function PublishForm({ open, onClose }: PublishFormProps) {
  const titleId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 md:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Dismiss publish panel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-strong relative z-10 flex max-h-[min(92vh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius)] pb-[env(safe-area-inset-bottom)] sm:max-h-[90vh] sm:rounded-[var(--radius)] sm:pb-0 animate-fade-up"
      >
        <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            Publish a page
          </h2>
          <button type="button" className="chrome-btn" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <form
          className="flex flex-col gap-4 overflow-y-auto px-5 py-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Address</span>
            <input
              type="text"
              placeholder="e.g. tidepool.zz"
              className="glass rounded-[var(--radius-sm)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Title</span>
            <input
              type="text"
              placeholder="A short title"
              className="glass rounded-[var(--radius-sm)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">HTML</span>
            <textarea
              rows={8}
              placeholder="<p>Your page…</p>"
              className="glass resize-y rounded-[var(--radius-sm)] px-3 py-2.5 font-mono text-[13px] outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Visual shell only — sanitize-on-write and POST /api/sites land in a later issue.
          </p>
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Publish
          </button>
        </form>
      </div>
    </div>
  );
}
