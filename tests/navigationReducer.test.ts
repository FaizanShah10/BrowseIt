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

describe("navigationReducer", () => {
  it("NAVIGATE from home keeps home as the stack root", () => {
    const start: NavState = { entries: [HOME_ENTRY], index: 0 };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: entry({ address: "tidepool.zz" }),
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "tidepool.zz"]);
    expect(next.index).toBe(1);
    expect(next.entries[1].html).toBe("<p>tidepool.zz</p>");
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
    // Destroyed forward entries are gone — including their HTML.
    expect(next.entries.find((e) => e.address === "b.zz")).toBeUndefined();
  });

  it("gate: mid-history branch destroys C and D; second branch destroys B and E", () => {
    // A → B → C → D
    let state: NavState = { entries: [HOME_ENTRY], index: 0 };
    for (const address of ["a.zz", "b.zz", "c.zz", "d.zz"]) {
      state = navigationReducer(state, {
        type: "NAVIGATE",
        entry: entry({ address }),
      });
    }
    expect(state.entries.map((e) => e.address)).toEqual([
      "",
      "a.zz",
      "b.zz",
      "c.zz",
      "d.zz",
    ]);

    // Back twice → on B
    state = navigationReducer(state, { type: "BACK" });
    state = navigationReducer(state, { type: "BACK" });
    expect(state.entries[state.index].address).toBe("b.zz");

    // Type E → stack is [home, A, B, E]; C and D unreachable
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "e.zz" }),
    });
    expect(state.entries.map((e) => e.address)).toEqual([
      "",
      "a.zz",
      "b.zz",
      "e.zz",
    ]);
    expect(state.index).toBe(3);

    // Back to A, type F → [home, A, F]; B and E gone
    state = navigationReducer(state, { type: "BACK" });
    state = navigationReducer(state, { type: "BACK" });
    expect(state.entries[state.index].address).toBe("a.zz");
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "f.zz" }),
    });
    expect(state.entries.map((e) => e.address)).toEqual(["", "a.zz", "f.zz"]);
    expect(state.index).toBe(2);

    // No Back/Forward sequence recovers destroyed entries.
    const reachable = new Set(state.entries.map((e) => e.address));
    for (const gone of ["b.zz", "c.zz", "d.zz", "e.zz"]) {
      expect(reachable.has(gone)).toBe(false);
    }
  });

  it("BACK and FORWARD keep entry.html intact (no network needed)", () => {
    const a = entry({ address: "a.zz", html: "<p>A</p>" });
    const b = entry({ address: "b.zz", html: "<p>B</p>" });
    const c = entry({ address: "c.zz", html: "<p>C</p>" });
    let state: NavState = { entries: [a, b, c], index: 2 };

    state = navigationReducer(state, { type: "BACK" });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "BACK" });
    expect(state.entries[state.index].html).toBe("<p>A</p>");
    state = navigationReducer(state, { type: "FORWARD" });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "FORWARD" });
    expect(state.entries[state.index].html).toBe("<p>C</p>");
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
