/**
 * Isomorphic HTML helpers shared by the rich-text editor (client) and the
 * storefront renderer (server). No dependencies.
 */

/** True if the string appears to contain HTML markup. */
export function isHtml(value: string | undefined | null): boolean {
  if (!value) return false;
  return /<[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert legacy plain-text descriptions into safe HTML so they round-trip
 * through the rich-text editor and render with their original line breaks.
 * Blank lines become paragraph breaks; single newlines become <br>.
 */
export function plainTextToHtml(value: string | undefined | null): string {
  if (!value) return "";
  const paragraphs = value
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`);
  return paragraphs.join("");
}
