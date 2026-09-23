"use client";

import { useId } from "react";
import { IconGlobe } from "./icons";

type AddressBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

/** Visual-only address field. Navigation wiring lands in a later issue. */
export function AddressBar({ value = "", onChange, className = "" }: AddressBarProps) {
  const id = useId();

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
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Type an address, e.g. tidepool.zz"
        autoComplete="off"
        spellCheck={false}
        className="address-field w-full rounded-full py-2 pr-4 pl-10 text-[14px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );
}
