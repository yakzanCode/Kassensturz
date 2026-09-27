// Denominations and money arithmetic.
// All amounts are whole cents (integers). Decimals are only produced for display.
// Formatting takes a language: "de" (default: 1.234,56 € / 240 Cent) or "en" (€1,234.56 / 240 cents).

export const MAX_QUANTITY = 999999;

const d = (cents, label, labelEn, asset, isNote) => Object.freeze({ cents, label, labelEn, asset, isNote });

export const COINS = Object.freeze([
  d(1, "1 Cent", "1 cent", "coin_1_cent", false),
  d(2, "2 Cent", "2 cent", "coin_2_cent", false),
  d(5, "5 Cent", "5 cent", "coin_5_cent", false),
  d(10, "10 Cent", "10 cent", "coin_10_cent", false),
  d(20, "20 Cent", "20 cent", "coin_20_cent", false),
  d(50, "50 Cent", "50 cent", "coin_50_cent", false),
  d(100, "1 Euro", "1 euro", "coin_1_euro", false),
  d(200, "2 Euro", "2 euro", "coin_2_euro", false),
]);

export const NOTES = Object.freeze([
  d(500, "5 Euro", "5 euro", "note_5_euro", true),
  d(1000, "10 Euro", "10 euro", "note_10_euro", true),
  d(2000, "20 Euro", "20 euro", "note_20_euro", true),
  d(5000, "50 Euro", "50 euro", "note_50_euro", true),
  d(10000, "100 Euro", "100 euro", "note_100_euro", true),
  d(20000, "200 Euro", "200 euro", "note_200_euro", true),
  d(50000, "500 Euro", "500 euro", "note_500_euro", true),
]);

export const ALL = Object.freeze([...COINS, ...NOTES]);

export const denomName = (denom, lang = "de") => (lang === "en" ? denom.labelEn : denom.label);

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

/** 12345 -> "12.345" (de) or "12,345" (en) */
export const groupThousands = (n, lang = "de") =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : ".");

/** 82488 -> "824,88 €" (de) or "€824.88" (en) */
export function formatEuro(cents, lang = "de") {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = groupThousands(Math.floor(abs / 100), lang);
  const rest = String(abs % 100).padStart(2, "0");
  return lang === "en" ? `${sign}€${euros}.${rest}` : `${sign}${euros},${rest} €`;
}

/** 240 -> "240 Cent" (de) or "240 cents" (en; "1 cent") */
export function formatCent(cents, lang = "de") {
  if (lang === "en") return `${groupThousands(cents, "en")} ${cents === 1 ? "cent" : "cents"}`;
  return `${groupThousands(cents)} Cent`;
}

/** Cent coins show their line value in cents, everything else in euros. */
export function formatLineValue(denom, quantity, lang = "de") {
  const c = lineCents(denom, quantity);
  return denom.cents < 100 ? formatCent(c, lang) : formatEuro(c, lang);
}

const pad2 = (n) => String(n).padStart(2, "0");

/** "26.09.2026" (de) or "26/09/2026" (en) */
export function formatDate(date, lang = "de") {
  const sep = lang === "en" ? "/" : ".";
  return [pad2(date.getDate()), pad2(date.getMonth() + 1), date.getFullYear()].join(sep);
}

/** "26-09-2026_Kassensturz" (without .txt) – the same in every language */
export function baseFilename(date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}_Kassensturz`;
}

/** Name for the n-th file of the same day: 1 -> base.txt, 2 -> base_2.txt, ... */
export function numberedFilename(base, n) {
  return n === 1 ? `${base}.txt` : `${base}_${n}.txt`;
}

const TXT = {
  de: { title: "Kassensturz", coins: "Münzen", notes: "Scheine", pcs: "Stück", total: "Gesamt" },
  en: { title: "Cash count", coins: "Coins", notes: "Banknotes", pcs: "pcs", total: "Total" },
};

/** The human-readable TXT record (Windows line endings). */
export function buildText(quantities, date, lang = "de") {
  const w = TXT[lang] ?? TXT.de;
  const line = (dn) => {
    const q = quantities.get(dn) ?? 0;
    return `${denomName(dn, lang)}: ${q} ${w.pcs} = ${formatLineValue(dn, q, lang)}`;
  };
  const lines = [
    `${w.title} – ${formatDate(date, lang)}`, "", w.coins, "", ...COINS.map(line),
    "", w.notes, "", ...NOTES.map(line),
    "", "-".repeat(30), "", `${w.total}: ${formatEuro(totalCents(quantities), lang)}`, "",
  ];
  return lines.join("\r\n");
}
