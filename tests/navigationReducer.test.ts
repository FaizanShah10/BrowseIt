import { describe, expect, it } from "vitest";
import {
  HOME_ENTRY,
  navigationReducer,
  type NavEntry,
  type NavState,
} from "../lib/hooks/useNavigation";

function entry(partial: Partial<NavEntry> & Pick<NavEntry, "address">): NavEntry {
  return {
    siteId: partial.siteId ?? (partial.address ? `site:${partial.address}` : null),
    scrollY: partial.scrollY ?? 0,
    visitId: partial.visitId ?? (partial.address ? `visit:${partial.address}` : "home"),
    address: partial.address,
  };
}

describe("navigationReducer", () => {
  it("NAVIGATE from home keeps home as the stack root", () => {
    const start: NavState = { entries: [HOME_ENTRY], index: 0 };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: entry({ address: "tidepool.zz" }),
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "tidepool.zz"]);
    expect(next.index).toBe(1);
  });

  it("BACK from the first site returns to home", () => {
    const start: NavState = {
      entries: [HOME_ENTRY, entry({ address: "tidepool.zz" })],
      index: 1,
    };
    const next = navigationReducer(start, { type: "BACK" });
    expect(next.index).toBe(0);
    expect(next.entries[0]).toEqual(HOME_ENTRY);
  });

  it("NAVIGATE appends and destroys forward history", () => {
    const start: NavState = {
      entries: [HOME_ENTRY, entry({ address: "a.zz" }), entry({ address: "b.zz" })],
      index: 1,
    };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: entry({ address: "c.zz" }),
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "a.zz", "c.zz"]);
    expect(next.index).toBe(2);
  });

  it("BACK decrements index and floors at 0", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz" }), entry({ address: "b.zz" })],
      index: 1,
    };
    expect(navigationReducer(start, { type: "BACK" }).index).toBe(0);
    expect(
      navigationReducer({ ...start, index: 0 }, { type: "BACK" }).index,
    ).toBe(0);
  });

  it("FORWARD increments index and caps at the end", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz" }), entry({ address: "b.zz" })],
      index: 0,
    };
    expect(navigationReducer(start, { type: "FORWARD" }).index).toBe(1);
    expect(
      navigationReducer({ ...start, index: 1 }, { type: "FORWARD" }).index,
    ).toBe(1);
  });

  it("UPDATE_SCROLL updates the current entry immutably", () => {
    const a = entry({ address: "a.zz" });
    const b = entry({ address: "b.zz" });
    const start: NavState = { entries: [a, b], index: 1 };
    const next = navigationReducer(start, { type: "UPDATE_SCROLL", scrollY: 120 });
    expect(next.entries[1].scrollY).toBe(120);
    expect(next.entries[0]).toBe(a);
    expect(next.entries[1]).not.toBe(b);
  });
});
