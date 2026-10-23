/** First user-perceived character, so a Bengali conjunct or vowel sign stays whole in a monogram. */
export function firstGrapheme(text: string, locale?: string): string {
  try {
    const seg = new Intl.Segmenter(locale, { granularity: "grapheme" });
    const first = seg.segment(text.trim())[Symbol.iterator]().next();
    return first.done ? "" : first.value.segment;
  } catch {
    return Array.from(text.trim())[0] ?? "";
  }
}
