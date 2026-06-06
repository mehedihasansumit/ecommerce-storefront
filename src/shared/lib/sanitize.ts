import sanitizeHtml from "sanitize-html";

/**
 * Server-side sanitizer for stored product description HTML.
 * Allowlist matches the tags the rich-text editor (TipTap StarterKit + Link)
 * can produce. Everything else (scripts, event handlers, styles) is stripped.
 *
 * Never render stored description HTML without passing it through this first.
 */
export function sanitizeDescription(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener nofollow",
        target: "_blank",
      }),
    },
  });
}
