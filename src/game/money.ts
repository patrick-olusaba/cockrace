// ─── Money ──────────────────────────────────────────────────────────────────
// One place for the currency. It was formatted inline in four different files
// with three different conventions — a trailing "$", a space-separated variant
// in the result modal, and a bare number in the stepper. Changing currency
// meant finding all of them.

/** Kenyan shilling. Change this line and the whole game follows. */
export const CURRENCY = 'KSh';

/**
 * "KSh 9,999,500".
 *
 * The symbol LEADS, which is the Kenyan convention — unlike the trailing "$"
 * this replaced. Grouping is en-KE (comma thousands); the modal used to swap
 * commas for spaces to match a reference screenshot, and that's dropped.
 */
export function money(n: number): string {
  return `${CURRENCY} ${Math.round(n).toLocaleString('en-KE')}`;
}

/** "+KSh 350" / "-KSh 100". The sign leads the symbol. */
export function moneySigned(n: number): string {
  return `${n < 0 ? '-' : '+'}${money(Math.abs(n))}`;
}
