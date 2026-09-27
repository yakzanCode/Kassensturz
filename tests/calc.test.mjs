// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import * as c from "../calc.js";

const byLabel = Object.fromEntries(c.ALL.map((d) => [d.label, d]));
const q = (obj) => new Map(Object.entries(obj).map(([k, v]) => [byLabel[k], v]));
const DAY = new Date(2026, 8, 26); // 26.09.2026 (months start at 0)

// Quantities from the original specification (sum is 825,88 €)
const EXAMPLE = {
  "1 Cent": 12, "2 Cent": 8, "5 Cent": 6, "10 Cent": 9, "20 Cent": 12, "50 Cent": 10,
  "1 Euro": 15, "2 Euro": 11, "5 Euro": 4, "10 Euro": 7, "20 Euro": 12, "50 Euro": 5,
  "100 Euro": 2, "200 Euro": 0, "500 Euro": 0,
};

test("exact denominations", () => {
  assert.deepEqual(c.ALL.map((d) => d.cents),
    [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]);
  assert.deepEqual(c.COINS.map((d) => d.label),
    ["1 Cent", "2 Cent", "5 Cent", "10 Cent", "20 Cent", "50 Cent", "1 Euro", "2 Euro"]);
});

test("parseQuantity accepts whole numbers", () => {
  for (const [t, n] of [["0", 0], ["1", 1], ["10", 10], ["100", 100], ["", 0], ["  ", 0], ["007", 7], ["999999", 999999]]) {
    assert.equal(c.parseQuantity(t), n, t);
  }
});

test("parseQuantity rejects bad input", () => {
  for (const t of ["-1", "1.5", "1,5", "abc", "1e3", "+3", "12a", "€", "١٢", "0x10", "1000000"]) {
    assert.throws(() => c.parseQuantity(t), RangeError, t);
  }
});

test("sanitizeInput keeps only digits, max 6", () => {
  assert.equal(c.sanitizeInput("-1.x12"), "112");
  assert.equal(c.sanitizeInput("abc"), "");
  assert.equal(c.sanitizeInput("1234567"), "123456");
  assert.equal(c.sanitizeInput("١٢3"), "3");
});

test("spec examples", () => {
  assert.equal(c.lineCents(byLabel["20 Cent"], 12), 240);
  assert.equal(c.lineCents(byLabel["50 Cent"], 10), 500);
  assert.equal(c.lineCents(byLabel["2 Euro"], 11), 2200);
  assert.equal(c.lineCents(byLabel["20 Euro"], 12), 24000);
  assert.throws(() => c.lineCents(byLabel["1 Euro"], -1));
  assert.throws(() => c.lineCents(byLabel["1 Euro"], 1.5));
});

test("every denomination individually", () => {
  for (const d of c.ALL) for (const n of [0, 1, 7, 100, 999999]) {
    assert.equal(c.totalCents(new Map([[d, n]])), d.cents * n);
  }
});

test("line display", () => {
  assert.equal(c.formatLineValue(byLabel["20 Cent"], 12), "240 Cent");
  assert.equal(c.formatLineValue(byLabel["50 Cent"], 1000), "50.000 Cent");
  assert.equal(c.formatLineValue(byLabel["1 Euro"], 15), "15,00 €");
  assert.equal(c.formatLineValue(byLabel["20 Euro"], 12), "240,00 €");
  assert.equal(c.formatLineValue(byLabel["500 Euro"], 0), "0,00 €");
});

test("totals are exact", () => {
  assert.equal(c.totalCents(q(EXAMPLE)), 82588);
  assert.equal(c.formatEuro(c.totalCents(q({ "10 Cent": 1, "20 Cent": 1 }))), "0,30 €");
  assert.equal(c.totalCents(new Map(c.ALL.map((d) => [d, 1]))), 88888);
  const max = new Map(c.ALL.map((d) => [d, c.MAX_QUANTITY]));
  assert.equal(c.formatEuro(c.totalCents(max)), "888.879.111,12 €");
});

test("formatEuro", () => {
  assert.equal(c.formatEuro(0), "0,00 €");
  assert.equal(c.formatEuro(5), "0,05 €");
  assert.equal(c.formatEuro(123456), "1.234,56 €");
});

test("file names", () => {
  const base = c.baseFilename(DAY);
  assert.equal(base, "26-09-2026_Kassensturz");
  assert.equal(c.numberedFilename(base, 1), "26-09-2026_Kassensturz.txt");
  assert.equal(c.numberedFilename(base, 3), "26-09-2026_Kassensturz_3.txt");
  assert.equal(c.baseFilename(new Date(2026, 0, 5)), "05-01-2026_Kassensturz");
});

test("TXT content matches the desktop app", () => {
  const text = c.buildText(q(EXAMPLE), DAY);
  assert.ok(text.startsWith("Kassensturz – 26.09.2026\r\n"));
  for (const l of ["Münzen", "Scheine", "20 Cent: 12 Stück = 240 Cent", "1 Euro: 15 Stück = 15,00 €",
    "200 Euro: 0 Stück = 0,00 €", "Gesamt: 825,88 €"]) {
    assert.ok(text.includes(`\r\n${l}\r\n`), l);
  }
  assert.ok(!/(?<!\r)\n/.test(text), "only CRLF line endings");
});
