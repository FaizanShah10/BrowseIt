import { describe, expect, it } from "vitest";
import { sanitize } from "../lib/sanitize";

describe("sanitize", () => {
  it("strips <script> tags and their contents", () => {
    const out = sanitize('<p>hi</p><script>alert("x")</script>');
    expect(out).not.toMatch(/script/i);
    expect(out).not.toContain("alert");
    expect(out).toContain("hi");
  });

  it("strips every on* event handler attribute", () => {
    const out = sanitize('<p onclick="evil()" onmouseover="x()">safe</p>');
    expect(out).not.toMatch(/on\w+=/i);
    expect(out).not.toContain("evil");
    expect(out).toContain("safe");
  });

  it("strips javascript: URLs", () => {
    const out = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("strips <iframe> tags", () => {
    const out = sanitize('<p>ok</p><iframe src="https://evil.test"></iframe>');
    expect(out).not.toMatch(/iframe/i);
    expect(out).toContain("ok");
  });

  it("strips <object> tags", () => {
    const out = sanitize('<object data="x.swf"></object><p>ok</p>');
    expect(out).not.toMatch(/object/i);
    expect(out).toContain("ok");
  });

  it("strips <embed> tags", () => {
    const out = sanitize('<embed src="x.swf"><p>ok</p>');
    expect(out).not.toMatch(/embed/i);
    expect(out).toContain("ok");
  });

  it("strips <form> tags", () => {
    const out = sanitize('<form action="/steal"><input name="pw"></form><p>ok</p>');
    expect(out).not.toMatch(/form/i);
    expect(out).not.toMatch(/input/i);
    expect(out).toContain("ok");
  });

  it("strips <meta> tags", () => {
    const out = sanitize('<meta http-equiv="refresh" content="0;url=https://evil.test"><p>ok</p>');
    expect(out).not.toMatch(/meta/i);
    expect(out).toContain("ok");
  });

  it("strips <link> tags", () => {
    const out = sanitize('<link rel="stylesheet" href="https://evil.test/x.css"><p>ok</p>');
    expect(out).not.toMatch(/<link/i);
    expect(out).toContain("ok");
  });

  it("strips <style> tags and their contents", () => {
    const out = sanitize("<style>body{display:none}</style><p>ok</p>");
    expect(out).not.toMatch(/style/i);
    expect(out).not.toContain("display:none");
    expect(out).toContain("ok");
  });

  it("keeps safe markup and http(s) links", () => {
    const out = sanitize(
      '<h1>Title</h1><p>Hello <a href="https://garden.zz">friend</a></p>',
    );
    expect(out).toContain("<h1>Title</h1>");
    expect(out).toContain('href="https://garden.zz"');
    expect(out).toContain("friend");
  });
});
