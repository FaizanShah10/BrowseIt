"use client";

import { useId } from "react";
import { IconSearch } from "../browser/icons";

type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  isLoading?: boolean;
};

/**
 * Full-text search input — visually distinct from AddressBar (search icon +
 * body-oriented placeholder, glass field instead of address-field chrome).
 */
export function SearchBar({
  value = "",
  onChange,
  isLoading = false,
}: SearchBarProps) {
  const id = useId();

  return (
    <div className="relative px-3 pb-3">
      <label htmlFor={id} className="sr-only">
        Search the Small Web
      </label>
      <div className="relative">
        <IconSearch
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Search page bodies…"
          autoComplete="off"
          spellCheck={false}
          aria-busy={isLoading}
          data-loading={isLoading ? "true" : undefined}
          className="search-field glass w-full rounded-full py-2.5 pr-10 pl-10 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)]"
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
    </div>
  );
}
