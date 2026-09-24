import { describe, expect, it } from "vitest";
import { sanitize } from "../lib/sanitize";

describe("sanitize allowlist", () => {
  it("strips <script> tags entirely, including their content", () => {
    const out = sanitize("<script>alert(1)</script><p>ok</p>");
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("ok");
  });

  it("strips onclick event handler attributes", () => {
    const out = sanitize('<button onclick="alert(1)">go</button><p>ok</p>');
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toContain("alert(1)");
  });

  it("strips onerror event handler attributes", () => {
    const out = sanitize('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toContain("alert(1)");
    expect(out).toMatch(/<img/i);
  });

  it("strips onload event handler attributes", () => {
    const out = sanitize('<body onload="alert(1)"><p>ok</p></body>');
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toContain("alert(1)");
  });

  it("strips onmouseover event handler attributes", () => {
    const out = sanitize('<p onmouseover="alert(1)">safe</p>');
    expect(out).not.toMatch(/onmouseover/i);
    expect(out).toContain("safe");
  });

  it("strips onfocus event handler attributes", () => {
    const out = sanitize('<a href="tidepool.zz" onfocus="alert(1)">link</a>');
    expect(out).not.toMatch(/onfocus/i);
    expect(out).toContain("link");
  });

  it("neutralizes javascript: URLs", () => {
    const out = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/javascript:/i);
    // href is dropped; the anchor (and its text) may remain.
    expect(out).not.toMatch(/href=["']javascript:/i);
  });

  it("strips <iframe>", () => {
    const out = sanitize('<iframe src="evil.com"></iframe><p>ok</p>');
    expect(out).not.toMatch(/<iframe/i);
    expect(out).toContain("ok");
  });

  it("strips <object>", () => {
    const out = sanitize('<object data="x.swf"></object><p>ok</p>');
    expect(out).not.toMatch(/<object/i);
    expect(out).toContain("ok");
  });

  it("strips <embed>", () => {
    const out = sanitize('<embed src="x.swf"><p>ok</p>');
    expect(out).not.toMatch(/<embed/i);
    expect(out).toContain("ok");
  });

  it("strips <form>", () => {
    const out = sanitize('<form action="/steal"><input name="pw"></form><p>ok</p>');
    expect(out).not.toMatch(/<form/i);
    expect(out).not.toMatch(/action=/i);
    expect(out).toContain("ok");
  });

  it("strips <meta http-equiv=refresh> redirects", () => {
    const out = sanitize(
      '<meta http-equiv="refresh" content="0;url=evil.com"><p>ok</p>',
    );
    expect(out).not.toMatch(/<meta/i);
    expect(out).not.toContain("evil.com");
    expect(out).toContain("ok");
  });

  it("strips <link> (stylesheet / CSS exfiltration)", () => {
    const out = sanitize(
      '<link rel="stylesheet" href="evil.com/steal.css"><p>ok</p>',
    );
    expect(out).not.toMatch(/<link/i);
    expect(out).not.toContain("steal.css");
    expect(out).toContain("ok");
  });

  it("strips <style> and its contents", () => {
    const out = sanitize(
      "<style>body{background:url(https://evil.com/x)}</style><p>ok</p>",
    );
    expect(out).not.toMatch(/<style/i);
    expect(out).not.toContain("background:url");
    expect(out).not.toContain("evil.com");
    expect(out).toContain("ok");
  });

  it("keeps legitimate content untouched", () => {
    const html = `
      <h1>Tidepool</h1>
      <p>A quiet cove with <strong>bold</strong> and <em>italic</em> text.</p>
      <p><a href="tidepool.zz">Home cove</a></p>
      <p><img src="https://example.com/wave.jpg" alt="wave"></p>
    `;
    const out = sanitize(html);
    expect(out).toContain("<h1>Tidepool</h1>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain('href="tidepool.zz"');
    expect(out).toContain('src="https://example.com/wave.jpg"');
    expect(out).toContain('alt="wave"');
  });

  it("strips unquoted onerror handlers", () => {
    const out = sanitize("<img src=x onerror=alert(1)>");
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toContain("alert(1)");
  });

  it("neutralizes javascript: URLs with leading whitespace", () => {
    const out = sanitize('<a href="  javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("strips uppercase <SCRIPT> tags", () => {
    const out = sanitize("<SCRIPT>alert(1)</SCRIPT><p>ok</p>");
    expect(out).not.toMatch(/script/i);
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("ok");
  });

  it("strips svg onload event handlers", () => {
    const out = sanitize("<svg onload=alert(1)><p>ok</p>");
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toContain("alert(1)");
  });
});
