import type { IProduct } from "./types";

/** Option names that hold colours (admins type these by hand, in either language). */
const COLOUR_OPTION = /^(colou?rs?|রং|রঙ)$/i;

/**
 * Common clothing colour names (English and Bangla) → a swatch colour. Values that
 * are already hex codes ("#1F2A44") are used as they are. Anything else gets no dot
 * but still counts toward "+N", so the card never claims fewer colours than exist.
 */
const NAMED: Record<string, string> = {
  black: "#111111", কালো: "#111111",
  white: "#FFFFFF", সাদা: "#FFFFFF",
  offwhite: "#F5F1E8", ivory: "#F6F1E1", cream: "#F3E9D2", অফহোয়াইট: "#F5F1E8",
  grey: "#8A8F98", gray: "#8A8F98", ধূসর: "#8A8F98", ছাই: "#8A8F98",
  charcoal: "#36454F", silver: "#C0C0C0",
  navy: "#1F2A44", navyblue: "#1F2A44", নেভি: "#1F2A44", নেভিব্লু: "#1F2A44",
  blue: "#2F5DA8", নীল: "#2F5DA8", skyblue: "#87CEEB", আকাশী: "#87CEEB", royalblue: "#2B4DB0",
  red: "#B3261E", লাল: "#B3261E", maroon: "#6D1A2A", মেরুন: "#6D1A2A",
  wine: "#5E1A2E", burgundy: "#6A1B2C", oxblood: "#4A0F1A",
  pink: "#E8A0B4", গোলাপি: "#E8A0B4",
  orange: "#E07A1F", কমলা: "#E07A1F",
  yellow: "#E9C46A", হলুদ: "#E9C46A", mustard: "#C9A227", gold: "#C9A227", golden: "#C9A227", সোনালি: "#C9A227",
  green: "#2E7D4F", সবুজ: "#2E7D4F", olive: "#6B6B2E", জলপাই: "#6B6B2E", bottlegreen: "#0F4D32", mint: "#A8D5BA",
  purple: "#6B3FA0", বেগুনি: "#6B3FA0", lavender: "#B8A6D9",
  brown: "#6F4E37", বাদামি: "#6F4E37", coffee: "#4B3621", chocolate: "#4B2E1F",
  beige: "#D9C7A7", khaki: "#C3B091", tan: "#C8A27A", camel: "#C19A6B", sand: "#D8C3A0",
  teal: "#1F7A7A", turquoise: "#3FB8AF", peach: "#F4B69C", rust: "#A9471F",
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function swatchFor(value: string): string | null {
  const v = value.trim();
  if (HEX.test(v)) return v;
  return NAMED[v.toLowerCase().replace(/[\s_-]+/g, "")] ?? null;
}

export interface ProductSwatches {
  /** Up to `max` colours we can draw, in the admin's order. */
  dots: { name: string; color: string }[];
  /** How many colours the product has in total (drawn or not). */
  total: number;
}

/** The colour option of a product as swatch dots; null when it has no colour option. */
export function getProductSwatches(product: Pick<IProduct, "options">, max = 4): ProductSwatches | null {
  const option = product.options?.find((o) => COLOUR_OPTION.test(o.name.trim()));
  if (!option || option.values.length === 0) return null;
  const dots: ProductSwatches["dots"] = [];
  for (const name of option.values) {
    if (dots.length >= max) break;
    const color = swatchFor(name);
    if (color) dots.push({ name, color });
  }
  return { dots, total: option.values.length };
}
