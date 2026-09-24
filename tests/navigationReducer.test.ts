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
    html:
      partial.html !== undefined
        ? partial.html
        : partial.address
          ? `<p>${partial.address}</p>`
          : null,
    scrollY: partial.scrollY ?? 0,
    visitId: partial.visitId ?? (partial.address ? `visit:${partial.address}` : "home"),
    address: partial.address,
  };
}

const A = entry({ address: "a.zz" });
const B = entry({ address: "b.zz" });
const C = entry({ address: "c.zz" });
const D = entry({ address: "d.zz" });

describe("navigationReducer", () => {
  it("NAVIGATE on empty state produces a single-entry stack at index 0", () => {
    const start: NavState = { entries: [], index: 0 };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: A,
      scrollY: 0,
    });
    expect(next).toEqual({ entries: [A], index: 0 });
  });

  it("NAVIGATE appends normally", () => {
    const start: NavState = { entries: [A], index: 0 };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: B,
      scrollY: 0,
    });
    expect(next.entries.map((e) => e.address)).toEqual(["a.zz", "b.zz"]);
    expect(next.index).toBe(1);
  });

  it("NAVIGATE from home keeps home as the stack root", () => {
    const start: NavState = { entries: [HOME_ENTRY], index: 0 };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: entry({ address: "tidepool.zz" }),
      scrollY: 0,
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "tidepool.zz"]);
    expect(next.index).toBe(1);
  });

  it("forward-destruction: BACK twice from [A,B,C] then NAVIGATE D → [A,D]", () => {
    let state: NavState = { entries: [A, B, C], index: 2 };
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.index).toBe(0);

    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: D,
      scrollY: 0,
    });
    expect(state.entries.map((e) => e.address)).toEqual(["a.zz", "d.zz"]);
    expect(state.index).toBe(1);
    expect(state.entries.find((e) => e.address === "b.zz")).toBeUndefined();
    expect(state.entries.find((e) => e.address === "c.zz")).toBeUndefined();
  });

  it("forward-destruction from mid-stack (index 1), not only from index 0", () => {
    const start: NavState = {
      entries: [HOME_ENTRY, A, B, C],
      index: 1,
    };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: D,
      scrollY: 0,
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "a.zz", "d.zz"]);
    expect(next.index).toBe(2);
    expect(next.entries.find((e) => e.address === "b.zz")).toBeUndefined();
    expect(next.entries.find((e) => e.address === "c.zz")).toBeUndefined();
  });

  it("gate: mid-history branch destroys C and D; second branch destroys B and E", () => {
    let state: NavState = { entries: [HOME_ENTRY], index: 0 };
    for (const address of ["a.zz", "b.zz", "c.zz", "d.zz"]) {
      state = navigationReducer(state, {
        type: "NAVIGATE",
        entry: entry({ address }),
        scrollY: 0,
      });
    }

    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].address).toBe("b.zz");

    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "e.zz" }),
      scrollY: 0,
    });
    expect(state.entries.map((e) => e.address)).toEqual([
      "",
      "a.zz",
      "b.zz",
      "e.zz",
    ]);

    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "f.zz" }),
      scrollY: 0,
    });
    expect(state.entries.map((e) => e.address)).toEqual(["", "a.zz", "f.zz"]);

    const reachable = new Set(state.entries.map((e) => e.address));
    for (const gone of ["b.zz", "c.zz", "d.zz", "e.zz"]) {
      expect(reachable.has(gone)).toBe(false);
    }
  });

  it("BACK at index 0 is a no-op on the index (still saves leave-scroll)", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz", scrollY: 0 })],
      index: 0,
    };
    const next = navigationReducer(start, { type: "BACK", scrollY: 500 });
    expect(next.index).toBe(0);
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].scrollY).toBe(500);
  });

  it("BACK decrements normally", () => {
    const start: NavState = { entries: [A, B, C], index: 2 };
    const next = navigationReducer(start, { type: "BACK", scrollY: 0 });
    expect(next.index).toBe(1);
    expect(next.entries.map((e) => e.address)).toEqual(["a.zz", "b.zz", "c.zz"]);
  });

  it("FORWARD at the last index is a no-op on the index (still saves leave-scroll)", () => {
    const start: NavState = {
      entries: [A, entry({ address: "b.zz", scrollY: 0 })],
      index: 1,
    };
    const next = navigationReducer(start, { type: "FORWARD", scrollY: 400 });
    expect(next.index).toBe(1);
    expect(next.entries.map((e) => e.address)).toEqual(["a.zz", "b.zz"]);
    expect(next.entries[1].scrollY).toBe(400);
  });

  it("FORWARD increments normally", () => {
    const start: NavState = { entries: [A, B, C], index: 0 };
    const next = navigationReducer(start, { type: "FORWARD", scrollY: 0 });
    expect(next.index).toBe(1);
  });

  it("BACK saves scrollY on the entry being left", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz", scrollY: 300 }), B],
      index: 1,
    };
    const next = navigationReducer(start, { type: "BACK", scrollY: 600 });
    expect(next.index).toBe(0);
    expect(next.entries[1].scrollY).toBe(600);
    expect(next.entries[0].scrollY).toBe(300);
  });

  it("FORWARD saves scrollY on the entry being left", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz", scrollY: 0 }), entry({ address: "b.zz", scrollY: 600 })],
      index: 0,
    };
    const next = navigationReducer(start, { type: "FORWARD", scrollY: 300 });
    expect(next.index).toBe(1);
    expect(next.entries[0].scrollY).toBe(300);
    expect(next.entries[1].scrollY).toBe(600);
  });

  it("NAVIGATE saves scrollY on the entry being left before appending", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz", scrollY: 0 })],
      index: 0,
    };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: B,
      scrollY: 300,
    });
    expect(next.entries[0].scrollY).toBe(300);
    expect(next.entries.map((e) => e.address)).toEqual(["a.zz", "b.zz"]);
    expect(next.index).toBe(1);
  });

  it("UPDATE_SCROLL updates only the current entry, immutably", () => {
    const a = entry({ address: "a.zz" });
    const b = entry({ address: "b.zz" });
    const start: NavState = { entries: [a, b], index: 1 };
    const originalEntries = start.entries;

    const next = navigationReducer(start, { type: "UPDATE_SCROLL", scrollY: 120 });

    expect(next.entries[1].scrollY).toBe(120);
    expect(next.entries[0]).toBe(a);
    expect(next.entries[1]).not.toBe(b);
    expect(next.entries).not.toBe(originalEntries);
    expect(originalEntries[1].scrollY).toBe(0);
    expect(start.entries).toBe(originalEntries);
  });

  it("index never goes negative or past the last entry", () => {
    let state: NavState = { entries: [A, B, C], index: 0 };
    for (let i = 0; i < 10; i++) {
      state = navigationReducer(state, { type: "BACK", scrollY: 0 });
      expect(state.index).toBeGreaterThanOrEqual(0);
      expect(state.index).toBeLessThan(state.entries.length);
    }
    expect(state.index).toBe(0);

    state = { entries: [A, B, C], index: 2 };
    for (let i = 0; i < 10; i++) {
      state = navigationReducer(state, { type: "FORWARD", scrollY: 0 });
      expect(state.index).toBeGreaterThanOrEqual(0);
      expect(state.index).toBeLessThan(state.entries.length);
    }
    expect(state.index).toBe(2);
  });

  it("BACK and FORWARD keep entry.html intact (no network needed)", () => {
    const a = entry({ address: "a.zz", html: "<p>A</p>" });
    const b = entry({ address: "b.zz", html: "<p>B</p>" });
    const c = entry({ address: "c.zz", html: "<p>C</p>" });
    let state: NavState = { entries: [a, b, c], index: 2 };

    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>A</p>");
    state = navigationReducer(state, { type: "FORWARD", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "FORWARD", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>C</p>");
  });

  it("RESET returns to the idle home stack", () => {
    const start: NavState = {
      entries: [HOME_ENTRY, entry({ address: "tidepool.zz" }), entry({ address: "garden.zz" })],
      index: 2,
    };
    const next = navigationReducer(start, { type: "RESET" });
    expect(next.entries).toEqual([HOME_ENTRY]);
    expect(next.index).toBe(0);
  });
});
