/**
 * A map of locale → translated string.
 * e.g. { en: "T-Shirt", bn: "টি-শার্ট" }
 *
 * Fields typed as LocalizedString may also contain a bare string
 * in legacy documents written before multi-language support was added.
 * Always read them through the t() helper from @/shared/lib/i18n.
 */
export type LocalizedString = Record<string, string>;
