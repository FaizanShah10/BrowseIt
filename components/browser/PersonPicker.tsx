"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconChevron, IconPerson } from "./icons";

// Static sample people — real Person list arrives with the data-layer issues.
const SAMPLE_PEOPLE = ["Ada Lovelace", "Grace Hopper", "Alan Turing"] as const;

type PersonPickerProps = {
  value?: string;
  onChange?: (name: string) => void;
};

export function PersonPicker({
  value = SAMPLE_PEOPLE[0],
  onChange,
}: PersonPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = value;

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-8 max-w-[8.5rem] items-center gap-1.5 rounded-full border border-[var(--surface-border)] bg-[var(--address-bg)] px-2.5 text-[13px] sm:max-w-[11rem] sm:gap-2 sm:px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <IconPerson size={15} />
        <span className="truncate font-medium">{current}</span>
        <IconChevron size={14} className="opacity-60" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="People"
          className="glass-strong absolute right-0 z-30 mt-2 min-w-[12rem] overflow-hidden rounded-[var(--radius-sm)] py-1 animate-fade-up"
        >
          {SAMPLE_PEOPLE.map((name) => (
            <li key={name} role="option" aria-selected={name === current}>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]"
                onClick={() => {
                  onChange?.(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
