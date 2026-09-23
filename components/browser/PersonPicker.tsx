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
  const firstName = current.split(/\s+/)[0] ?? current;

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
        className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--address-bg)] px-2 text-[12px] sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-[13px] lg:max-w-[11rem] lg:gap-2 lg:px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Current person: ${current}`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconPerson size={15} />
        {/* Icon-only on the narrowest phones; first name on tablet; full name on large. */}
        <span className="hidden truncate font-medium min-[400px]:inline lg:hidden">
          {firstName}
        </span>
        <span className="hidden truncate font-medium lg:inline">{current}</span>
        <IconChevron size={14} className="hidden opacity-60 min-[400px]:inline" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="People"
          className="glass-strong absolute right-0 z-30 mt-2 max-h-[min(16rem,50vh)] min-w-[12rem] overflow-y-auto overflow-x-hidden rounded-[var(--radius-sm)] py-1 animate-fade-up"
        >
          {SAMPLE_PEOPLE.map((name) => (
            <li key={name} role="option" aria-selected={name === current}>
              <button
                type="button"
                className="flex w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--accent-soft)]"
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
