export const BD_PHONE_REGEX = /^\+880\d{10}$/;

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, "");

  if (/^\+880\d{10}$/.test(cleaned)) return cleaned;
  if (/^880\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0\d{10}$/.test(cleaned)) return `+88${cleaned}`;
  if (/^\d{10}$/.test(cleaned)) return `+880${cleaned}`;

  return cleaned;
}
