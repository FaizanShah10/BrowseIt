import { parse, type HTMLElement, type TextNode } from "node-html-parser";

const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "p",
  "pre",
  "section",
  "table",
  "tr",
  "ul",
  "ol",
]);

/**
 * Extract visible text from already-sanitized HTML for search indexing.
 * Uses a real HTML parser — never a regex tag-strip — so attribute values
 * are not swept into the index.
 */
export function extractText(sanitizedHtml: string): string {
  const root = parse(sanitizedHtml, {
    blockTextElements: {
      script: false,
      style: false,
      noscript: false,
    },
  });

  const parts: string[] = [];

  function walk(node: HTMLElement | TextNode): void {
    if (node.nodeType === 3) {
      parts.push((node as TextNode).text);
      return;
    }

    if (node.nodeType !== 1) return;

    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase() ?? "";

    if (tag === "br" || tag === "hr") {
      parts.push(" ");
      return;
    }

    for (const child of el.childNodes) {
      walk(child as HTMLElement | TextNode);
    }

    if (BLOCK_TAGS.has(tag)) {
      parts.push(" ");
    }
  }

  walk(root);
  return parts.join("").replace(/\s+/g, " ").trim();
}
