import { describe, expect, it } from "vitest";
import { extractText } from "../lib/extractText";

describe("extractText", () => {
  it("extracts visible text from simple markup", () => {
    expect(extractText("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
  });

  it("does not index attribute values (unlike a regex tag-strip)", () => {
    const text = extractText(
      '<a href="https://secret.test/path" title="hidden-title">visible link</a><p>body</p>',
    );
    expect(text).toContain("visible link");
    expect(text).toContain("body");
    expect(text).not.toContain("secret.test");
    expect(text).not.toContain("hidden-title");
  });

  it("collapses whitespace and separates block elements", () => {
    expect(extractText("<p>one</p>\n\n<p>two</p>")).toBe("one two");
    expect(extractText("<h1>Tidepool</h1><p>Salt water</p>")).toBe(
      "Tidepool Salt water",
    );
  });

  it("returns empty string for empty input", () => {
    expect(extractText("")).toBe("");
  });
});
