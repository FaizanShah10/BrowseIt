"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePerson } from "@/lib/context/PersonContext";
import { IconChevron, IconPerson } from "./icons";

/**
 * Compact identity control for the chrome — shown once a person is chosen.
 */
export function PersonPicker() {
  const { people, currentPerson, personId, setCurrentPerson } = usePerson();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const displayName = currentPerson?.name ?? "—";
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!currentPerson || people.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--address-bg)] px-2 text-[12px] sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-[13px] lg:max-w-[11rem] lg:gap-2 lg:px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Current person: ${displayName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconPerson size={15} />
        <span className="hidden truncate font-medium min-[400px]:inline lg:hidden">
          {firstName}
        </span>
        <span className="hidden truncate font-medium lg:inline">{displayName}</span>
        <IconChevron size={14} className="hidden opacity-60 min-[400px]:inline" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="People"
          className="glass-strong absolute right-0 z-30 mt-2 max-h-[min(16rem,50vh)] min-w-[12rem] overflow-y-auto overflow-x-hidden rounded-[var(--radius-sm)] py-1 animate-fade-up"
        >
          {people.map((p) => (
            <li key={p._id} role="option" aria-selected={p._id === personId}>
              <button
                type="button"
                className="flex w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--accent-soft)]"
                onClick={() => {
                  setCurrentPerson(p);
                  setOpen(false);
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * First-load gate — choose who's browsing before the rest of the app is usable.
 * Not a login: just a name from the seed list.
 */
export function PersonGate() {
  const { people, currentPerson, setCurrentPerson, isReady } = usePerson();
  const titleId = useId();

  if (!isReady) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        aria-busy="true"
        aria-label="Loading"
      >
        <p className="glass-strong rounded-[var(--radius)] px-5 py-4 text-sm text-[var(--muted)]">
          Loading…
        </p>
      </div>
    );
  }

  if (currentPerson) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-strong relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-[var(--radius)] pb-[env(safe-area-inset-bottom)] sm:rounded-[var(--radius)] sm:pb-0 animate-fade-up"
      >
        <div className="border-b border-[var(--surface-border)] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            BrowseIt
          </p>
          <h2 id={titleId} className="mt-2 font-display text-xl font-semibold tracking-tight">
            Who&apos;s browsing?
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Pick a name from the list. History, visits, and publish all follow
            whoever you choose — nothing more than a name.
          </p>
        </div>

        {people.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">
            No people in the list yet. Run <code className="font-mono text-xs">npm run seed</code>{" "}
            to load names.
          </p>
        ) : (
          <ul className="max-h-[min(50vh,20rem)] overflow-y-auto py-2" aria-label="People">
            {people.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--accent-soft)]"
                  onClick={() => setCurrentPerson(p)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <IconPerson size={18} />
                  </span>
                  <span className="font-medium">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
