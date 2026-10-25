/**
 * Ghanaian phone entry, used by every field that collects a number.
 *
 * The field sits after a fixed "+233", so it holds the nine digits that follow.
 * Members type their number the way they know it — "0537096725" — so a leading
 * 0 is allowed while they type, and dropped once the tenth digit lands. Past
 * nine digits (ten with the 0) further keys are ignored. A pasted "+233…" or
 * "233…" is folded the same way.
 */
export const GH_PREFIX = "+233";

export function ghanaDigits(text: string): string {
  let d = text.replace(/\D/g, "");
  if (d.startsWith("233") && d.length >= 12) d = d.slice(3);
  if (d.startsWith("0")) {
    d = d.slice(0, 10);
    return d.length === 10 ? d.slice(1) : d;
  }
  return d.slice(0, 9);
}

/** The nine digits are complete. */
export function isCompleteGhana(digits: string): boolean {
  return /^\d{9}$/.test(digits);
}

/** "537096725" → "0537096725", the shape the server stores. Blank stays blank. */
export function toLocalNumber(digits: string): string {
  return digits ? `0${digits}` : "";
}

/** "0537096725" or "+233537096725" → "537096725", for prefilling a field. */
export function fromStoredNumber(phone: string | null | undefined): string {
  return ghanaDigits(phone ?? "");
}
