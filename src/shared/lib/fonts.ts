/**
 * Store typefaces: the one place that decides which families the admin offers and where
 * each one loads from. A Store picks a body family (`theme.fontFamily`) and an optional
 * display family for headings (`theme.headingFont`).
 *
 * Google Fonts by default; the families in FONTSHARE_FAMILIES are served by Fontshare
 * (free for commercial use). Inter is the platform default and is not fetched.
 */
const FONTSHARE_FAMILIES = new Set(["Switzer", "Satoshi", "General Sans", "Cabinet Grotesk", "Erode"]);

/** Families never fetched: the platform default. */
const UNLOADED_FAMILIES = new Set(["Inter"]);

/** Body font options in the admin theme editor. */
export const STORE_FONTS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Roboto",
  "Open Sans",
  "Switzer",
  "Satoshi",
  "General Sans",
  "Instrument Sans",
  "Hind Siliguri",
] as const;

/** Heading (display) font options in the admin theme editor. */
export const STORE_HEADING_FONTS = [
  "Cormorant Garamond",
  "Playfair Display",
  "Montserrat",
  "Poppins",
  "Inter",
  "Cabinet Grotesk",
  "Erode",
  "Bodoni Moda",
  "Tiro Bangla",
] as const;

/**
 * Stylesheet URLs that load the given families: at most one Google Fonts URL (all Google
 * families combined) plus one per Fontshare family. Empty and duplicate names are ignored.
 */
export function fontStylesheetUrls(families: (string | undefined | null)[]): string[] {
  const unique = [...new Set(families.filter((f): f is string => Boolean(f)))].filter(
    (f) => !UNLOADED_FAMILIES.has(f)
  );
  const google = unique.filter((f) => !FONTSHARE_FAMILIES.has(f));
  const fontshare = unique.filter((f) => FONTSHARE_FAMILIES.has(f));

  const urls: string[] = [];
  if (google.length) {
    urls.push(
      `https://fonts.googleapis.com/css2?${google
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
        .join("&")}&display=swap`
    );
  }
  for (const f of fontshare) {
    const slug = f.toLowerCase().replace(/\s+/g, "-");
    urls.push(`https://api.fontshare.com/v2/css?f[]=${slug}@400,500,600,700&display=swap`);
  }
  return urls;
}
