// Denominations and money arithmetic.
// All amounts are whole cents (integers). Decimals are only produced for display.

export const MAX_QUANTITY = 999999;

const d = (cents, label, asset, isNote) => Object.freeze({ cents, label, asset, isNote });

export const COINS = Object.freeze([
  d(1, "1 Cent", "coin_1_cent", false),
  d(2, "2 Cent", "coin_2_cent", false),
  d(5, "5 Cent", "coin_5_cent", false),
  d(10, "10 Cent", "coin_10_cent", false),
  d(20, "20 Cent", "coin_20_cent", false),
  d(50, "50 Cent", "coin_50_cent", false),
  d(100, "1 Euro", "coin_1_euro", false),
  d(200, "2 Euro", "coin_2_euro", false),
]);

export const NOTES = Object.freeze([
  d(500, "5 Euro", "note_5_euro", true),
  d(1000, "10 Euro", "note_10_euro", true),
  d(2000, "20 Euro", "note_20_euro", true),
  d(5000, "50 Euro", "note_50_euro", true),
  d(10000, "100 Euro", "note_100_euro", true),
  d(20000, "200 Euro", "note_200_euro", true),
  d(50000, "500 Euro", "note_500_euro", true),
]);

export const ALL = Object.freeze([...COINS, ...NOTES]);

/** Field text -> quantity. Empty means 0. Throws for anything but 0..MAX_QUANTITY. */
export function parseQuantity(text) {
  const t = String(text).trim();
  if (t === "") return 0;
  if (!/^[0-9]+$/.test(t)) throw new RangeError(`Keine gültige Stückzahl: ${t}`);
  const n = Number(t);
  if (n > MAX_QUANTITY) throw new RangeError(`Stückzahl zu groß: ${n}`);
  return n;
}

/** Keeps only ASCII digits, at most 6 of them (used while typing). */
export function sanitizeInput(text) {
  return String(text).replace(/[^0-9]/g, "").slice(0, String(MAX_QUANTITY).length);
}

export function lineCents(denom, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new RangeError("Ungültige Stückzahl");
  return denom.cents * quantity;
}

/** quantities: Map(denomination -> number). Missing entries count as 0. */
export function totalCents(quantities) {
  return ALL.reduce((sum, dn) => sum + lineCents(dn, quantities.get(dn) ?? 0), 0);
}

const groupThousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** 82488 -> "824,88 €", 123456 -> "1.234,56 €" */
export function formatEuro(cents) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}${groupThousands(euros)},${rest} €`;
}

/** 240 -> "240 Cent", 50000 -> "50.000 Cent" */
export function formatCent(cents) {
  return `${groupThousands(cents)} Cent`;
}

/** Cent coins show their line value in Cent, everything else in Euro. */
export function formatLineValue(denom, quantity) {
  const c = lineCents(denom, quantity);
  return denom.cents < 100 ? formatCent(c) : formatEuro(c);
}

const pad2 = (n) => String(n).padStart(2, "0");

/** "26-09-2026_Kassensturz" (without .txt) */
export function baseFilename(date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}_Kassensturz`;
}

/** Name for the n-th file of the same day: 1 -> base.txt, 2 -> base_2.txt, ... */
export function numberedFilename(base, n) {
  return n === 1 ? `${base}.txt` : `${base}_${n}.txt`;
}

/** The human-readable TXT record (Windows line endings). */
export function buildText(quantities, date) {
  const day = `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  const line = (dn) => {
    const q = quantities.get(dn) ?? 0;
    return `${dn.label}: ${q} Stück = ${formatLineValue(dn, q)}`;
  };
  const lines = [
    `Kassensturz – ${day}`, "", "Münzen", "", ...COINS.map(line),
    "", "Scheine", "", ...NOTES.map(line),
    "", "-".repeat(30), "", `Gesamt: ${formatEuro(totalCents(quantities))}`, "",
  ];
  return lines.join("\r\n");
}
