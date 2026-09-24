"use client";

import { useId, useState, type FormEvent } from "react";
import { usePerson } from "@/lib/context/PersonContext";
import { normalizeAddress } from "@/lib/normalizeAddress";
import { IconClose } from "../browser/icons";

type PublishFormProps = {
  open: boolean;
  onClose: () => void;
  /** After a successful publish — navigate via the normal browsing path. */
  onPublished: (address: string) => void;
};

type ApiErrorBody = {
  message?: string;
};

/**
 * Publish a new address with raw HTML.
 * Sanitization is server-side only (SiteService.publish → lib/sanitize).
 * Author comes from PersonContext live at submit (not a mount-time prop).
 */
export function PublishForm({ open, onClose, onPublished }: PublishFormProps) {
  const { currentPerson } = usePerson();
  const personId = currentPerson?._id ?? "";
  const personName = currentPerson?.name ?? "";
  const titleId = useId();
  const addressId = useId();
  const pageTitleId = useId();
  const htmlId = useId();

  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const hasPerson = Boolean(personId);
  const normalizedPreview = normalizeAddress(address);

  if (!open) return null;

  function resetForm() {
    setAddress("");
    setTitle("");
    setHtml("");
    setAddressError(null);
    setFormError(null);
    setClientError(null);
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setAddressError(null);
    setFormError(null);
    setClientError(null);

    if (!hasPerson) {
      setClientError("Pick a person from the name list before publishing.");
      return;
    }

    const trimmedAddress = address.trim();
    const trimmedHtml = html.trim();
    const trimmedTitle = title.trim();

    if (!trimmedAddress) {
      setClientError("Address is required.");
      return;
    }
    if (!trimmedHtml) {
      setClientError("HTML is required.");
      return;
    }
    if (!trimmedTitle) {
      setClientError("Title is required.");
      return;
    }

    // UX preview only — server still normalizes and is the authority.
    const normalized = normalizeAddress(trimmedAddress);
    if (!normalized) {
      setAddressError("That address normalizes to nothing. Try something like tidepool.zz.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: normalized,
          title: trimmedTitle,
          html: trimmedHtml,
          authorId: personId,
        }),
      });

      if (res.status === 201) {
        const site = (await res.json()) as { address: string };
        resetForm();
        onClose();
        onPublished(site.address);
        return;
      }

      let message = "Something went wrong.";
      try {
        const body = (await res.json()) as ApiErrorBody;
        if (body.message) message = body.message;
      } catch {
        // Non-JSON error body — keep generic fallback.
      }

      if (res.status === 409) {
        setAddressError(message);
        return;
      }

      if (res.status === 400) {
        // Address-shaped failures stay next to the address field.
        if (/address/i.test(message)) {
          setAddressError(message);
        } else {
          setFormError(message);
        }
        return;
      }

      setFormError(message);
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 md:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Dismiss publish panel"
        onClick={handleClose}
        disabled={submitting}
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
          <button
            type="button"
            className="chrome-btn"
            aria-label="Close"
            onClick={handleClose}
            disabled={submitting}
          >
            <IconClose />
          </button>
        </div>

        <form
          className="flex flex-col gap-4 overflow-y-auto px-5 py-5"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          {hasPerson ? (
            <p className="text-xs text-[var(--muted)]">
              Publishing as <span className="font-medium text-[var(--foreground)]">{personName}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--danger)]" role="status">
              Pick a person from the name list before publishing.
            </p>
          )}

          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor={addressId} className="font-medium">
              Address
            </label>
            <input
              id={addressId}
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (addressError) setAddressError(null);
              }}
              placeholder="e.g. tidepool.zz"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(addressError)}
              aria-describedby={
                addressError
                  ? `${addressId}-error`
                  : normalizedPreview
                    ? `${addressId}-hint`
                    : undefined
              }
              className="glass rounded-[var(--radius-sm)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {normalizedPreview && normalizedPreview !== address.trim().toLowerCase() ? (
              <p id={`${addressId}-hint`} className="text-xs text-[var(--muted)]">
                Will register as{" "}
                <span className="font-medium text-[var(--foreground)]">{normalizedPreview}</span>
              </p>
            ) : null}
            {addressError ? (
              <p
                id={`${addressId}-error`}
                className="text-xs text-[var(--danger)]"
                role="alert"
              >
                {addressError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor={pageTitleId} className="font-medium">
              Title
            </label>
            <input
              id={pageTitleId}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short title"
              className="glass rounded-[var(--radius-sm)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor={htmlId} className="font-medium">
              HTML
            </label>
            <textarea
              id={htmlId}
              rows={8}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<h1>Hello</h1><p>Your page…</p>"
              spellCheck={false}
              className="glass resize-y rounded-[var(--radius-sm)] px-3 py-2.5 font-mono text-[13px] outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {clientError ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {clientError}
            </p>
          ) : null}
          {formError ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !hasPerson}
            className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}
