"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { IconGlobe } from "./icons";

type AddressBarProps = {
  /** Normalized address from the current nav entry (after a successful navigation). */
  address?: string;
  isLoading?: boolean;
  onNavigate: (rawAddress: string) => void;
  className?: string;
};

/**
 * Controlled address field. Submits only on Enter — never on blur.
 * Displays the normalized address after navigation; draft while typing.
 */
export function AddressBar({
  address = "",
  isLoading = false,
  onNavigate,
  className = "",
}: AddressBarProps) {
  const id = useId();
  const [draft, setDraft] = useState(address);

  useEffect(() => {
    setDraft(address);
  }, [address]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = draft.trim();
    if (!value || isLoading) return;
    onNavigate(value);
  }

  return (
    <div className={`relative w-full ${className}`}>
      <label htmlFor={id} className="sr-only">
        Address
      </label>
      <IconGlobe
        size={15}
        className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-[var(--muted)]"
      />
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type an address, e.g. tidepool.zz"
        autoComplete="off"
        spellCheck={false}
        aria-busy={isLoading}
        data-loading={isLoading ? "true" : undefined}
        className="address-field w-full rounded-full py-2 pr-10 pl-10 text-[14px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)]"
      />
      {isLoading ? (
        <span
          className="pointer-events-none absolute top-1/2 right-3.5 z-10 flex -translate-y-1/2"
          aria-hidden="true"
        >
          <span className="address-spinner" />
        </span>
      ) : null}
    </div>
  );
}
