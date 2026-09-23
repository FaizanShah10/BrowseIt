"use client";

import { useEffect, useState } from "react";

/** Large live clock for the idle / New Tab surface. Client-only; no libraries. */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const boot = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(boot);
      window.clearInterval(id);
    };
  }, []);

  const time = now
    ? now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—:—";

  const date = now
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "\u00a0";

  return (
    <div className="animate-fade-up px-2 text-center">
      <p className="font-display text-[clamp(2.75rem,14vw,6.5rem)] font-medium leading-none tracking-tight tabular-nums">
        {time}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)] sm:mt-3 sm:text-base md:text-lg">
        {date}
      </p>
    </div>
  );
}
