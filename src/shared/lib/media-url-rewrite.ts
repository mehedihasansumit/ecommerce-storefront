/**
 * Moves stored media references from the app's `/api/media/<key>` proxy to the
 * bucket's public CDN base (`S3_PUBLIC_URL`, e.g. an R2 custom domain). Works on
 * any JSON-shaped value (text columns, jsonb banners, image variant maps) and
 * leaves everything else untouched, so running it twice changes nothing.
 */

// "/api/media/<key>" at the start of a string, optionally after an http(s) origin.
const PROXY_PATH = /^(?:https?:\/\/[^/]+)?\/api\/media\/(.+)$/;

export function rewriteMediaUrls(value: unknown, publicBase: string): unknown {
  const base = publicBase.replace(/\/+$/, "");
  if (typeof value === "string") {
    const match = PROXY_PATH.exec(value);
    return match ? `${base}/${match[1]}` : value;
  }
  if (Array.isArray(value)) return value.map((v) => rewriteMediaUrls(v, base));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, rewriteMediaUrls(v, base)])
    );
  }
  return value;
}
