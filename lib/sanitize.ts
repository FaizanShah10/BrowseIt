import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const FORBIDDEN_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "meta",
  "link",
  "style",
];

/**
 * Strict allowlist sanitizer for publish-time write.
 * Strips scripts, event handlers, javascript: URLs, and containment-breaking tags.
 */
export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "name"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["class", "id", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    exclusiveFilter(frame) {
      return FORBIDDEN_TAGS.includes(frame.tag);
    },
  });
}
