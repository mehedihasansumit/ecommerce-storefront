/**
 * HTTP `Range` handling for the media proxy. Video players (Safari in particular)
 * only play when byte ranges get a 206, and seeking re-downloads the whole file
 * without one.
 *
 * Returns the inclusive byte span to serve, "unsatisfiable" for a start past the
 * end (416), or null when the whole object should be sent (no header, another
 * unit, multiple ranges, or a malformed value).
 */
export function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | "unsatisfiable" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  const last = size - 1;
  if (rawStart === "") {
    // Suffix range: the last N bytes.
    const length = Number(rawEnd);
    if (length === 0) return "unsatisfiable";
    return { start: Math.max(0, size - length), end: last };
  }

  const start = Number(rawStart);
  if (start > last) return "unsatisfiable";
  const end = rawEnd === "" ? last : Math.min(Number(rawEnd), last);
  if (end < start) return null;
  return { start, end };
}
