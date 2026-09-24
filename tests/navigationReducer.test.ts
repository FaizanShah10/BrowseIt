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
      scrollY: 0,
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
    const next = navigationReducer(start, { type: "BACK", scrollY: 0 });
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
      scrollY: 0,
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
        scrollY: 0,
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
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].address).toBe("b.zz");

    // Type E → stack is [home, A, B, E]; C and D unreachable
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
    expect(state.index).toBe(3);

    // Back to A, type F → [home, A, F]; B and E gone
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].address).toBe("a.zz");
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "f.zz" }),
      scrollY: 0,
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

    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "BACK", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>A</p>");
    state = navigationReducer(state, { type: "FORWARD", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>B</p>");
    state = navigationReducer(state, { type: "FORWARD", scrollY: 0 });
    expect(state.entries[state.index].html).toBe("<p>C</p>");
  });

  it("BACK decrements index and floors at 0", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz" }), entry({ address: "b.zz" })],
      index: 1,
    };
    expect(navigationReducer(start, { type: "BACK", scrollY: 0 }).index).toBe(0);
    expect(
      navigationReducer({ ...start, index: 0 }, { type: "BACK", scrollY: 0 }).index,
    ).toBe(0);
  });

  it("FORWARD increments index and caps at the end", () => {
    const start: NavState = {
      entries: [entry({ address: "a.zz" }), entry({ address: "b.zz" })],
      index: 0,
    };
    expect(
      navigationReducer(start, { type: "FORWARD", scrollY: 0 }).index,
    ).toBe(1);
    expect(
      navigationReducer({ ...start, index: 1 }, { type: "FORWARD", scrollY: 0 })
        .index,
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

  it("gate §6.2: BACK saves leave-scroll then restores destination scrollY", () => {
    const a = entry({ address: "a.zz", scrollY: 300 });
    const b = entry({ address: "b.zz", scrollY: 0 });
    const start: NavState = { entries: [a, b], index: 1 };

    // Leave B at 600px, arrive at A which remembered 300.
    const afterBack = navigationReducer(start, { type: "BACK", scrollY: 600 });
    expect(afterBack.index).toBe(0);
    expect(afterBack.entries[1].scrollY).toBe(600);
    expect(afterBack.entries[0].scrollY).toBe(300);

    // Leave A at 300 (unchanged), arrive at B which remembered 600.
    const afterForward = navigationReducer(afterBack, {
      type: "FORWARD",
      scrollY: 300,
    });
    expect(afterForward.index).toBe(1);
    expect(afterForward.entries[0].scrollY).toBe(300);
    expect(afterForward.entries[1].scrollY).toBe(600);
  });

  it("gate §6.2: multi-page trail remembers each scroll independently", () => {
    let state: NavState = { entries: [HOME_ENTRY], index: 0 };
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "a.zz" }),
      scrollY: 0,
    });
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "b.zz" }),
      scrollY: 300,
    });
    state = navigationReducer(state, {
      type: "NAVIGATE",
      entry: entry({ address: "c.zz" }),
      scrollY: 600,
    });
    // Now on C; save 100 when leaving via Back.
    state = navigationReducer(state, { type: "BACK", scrollY: 100 });
    expect(state.entries[state.index].address).toBe("b.zz");
    expect(state.entries[state.index].scrollY).toBe(600);
    expect(state.entries[3].scrollY).toBe(100);

    state = navigationReducer(state, { type: "BACK", scrollY: 600 });
    expect(state.entries[state.index].address).toBe("a.zz");
    expect(state.entries[state.index].scrollY).toBe(300);

    state = navigationReducer(state, { type: "FORWARD", scrollY: 300 });
    expect(state.entries[state.index].address).toBe("b.zz");
    expect(state.entries[state.index].scrollY).toBe(600);

    state = navigationReducer(state, { type: "FORWARD", scrollY: 600 });
    expect(state.entries[state.index].address).toBe("c.zz");
    expect(state.entries[state.index].scrollY).toBe(100);
  });

  it("NAVIGATE atomically saves scroll on the left page before branching", () => {
    const start: NavState = {
      entries: [
        HOME_ENTRY,
        entry({ address: "a.zz", scrollY: 200 }),
        entry({ address: "b.zz" }),
        entry({ address: "c.zz" }),
      ],
      index: 1,
    };
    const next = navigationReducer(start, {
      type: "NAVIGATE",
      entry: entry({ address: "d.zz" }),
      scrollY: 450,
    });
    expect(next.entries.map((e) => e.address)).toEqual(["", "a.zz", "d.zz"]);
    expect(next.entries[1].scrollY).toBe(450);
    expect(next.entries[2].scrollY).toBe(0);
  });

  it("RESET returns to the idle home stack", () => {
    const start: NavState = {
      entries: [
        HOME_ENTRY,
        entry({ address: "tidepool.zz" }),
        entry({ address: "garden.zz" }),
      ],
      index: 2,
    };
    const next = navigationReducer(start, { type: "RESET" });
    expect(next.entries).toEqual([HOME_ENTRY]);
    expect(next.index).toBe(0);
  });
});
