/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` — what the admin colour picker produces. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/**
 * The colour if it is a plain hex value, else `fallback`. Used before a colour is
 * written into HTML, so a stored value like `red" onmouseover="…` can't break out
 * of the style attribute (announcement banners render through innerHTML).
 */
export function safeHexColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value : fallback;
}
