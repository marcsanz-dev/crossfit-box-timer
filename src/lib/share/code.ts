/**
 * Short codes that coaches read out or type on the phone.
 * - The alphabet drops look-alikes (0/O, 1/I/L), so a code read across the
 *   box is never ambiguous.
 * - 31^6 ≈ 887 million combinations: guessing a live code is impractical, and
 *   shares only contain workout text anyway.
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 6;

/** Shares expire after a week; presets are where workouts live long-term. */
export const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** What the person typed → canonical form: upper case, no spaces or dashes. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s\-·.]/g, "");
}

export function isValidCode(code: string): boolean {
  return (
    code.length === CODE_LENGTH &&
    [...code].every((char) => CODE_ALPHABET.includes(char))
  );
}

/** "K7QM4P" → "K7Q M4P": two groups of three are easier to read and type. */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
