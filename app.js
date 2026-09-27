// Kassensturz / Cash Counter – browser UI. No network requests: everything stays on this computer.
import {
  COINS, NOTES, ALL, parseQuantity, sanitizeInput, lineCents, formatEuro, formatLineValue,
  groupThousands, denomName, baseFilename, numberedFilename, buildText,
} from "./calc.js";
import { writeToFolder, download } from "./storage.js";
import { t, lang, setLanguage, detectLanguage } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const rows = []; // { denom, input, value, row, label, img }
let savedSnapshot = null;

// ------------------------------------------------------------------ build rows

function buildRows(container, denoms) {
  for (const denom of denoms) {
    const row = document.createElement("div");
    row.className = "row";

    const img = document.createElement("img");
    img.className = "pic";
    img.src = `assets/${denom.asset}.webp`;
    img.width = 68;
    img.height = 40;
    img.decoding = "async";

    const label = document.createElement("label");
    label.className = "label";
    label.htmlFor = `q-${denom.asset}`;

    const input = document.createElement("input");
    input.className = "qty";
    input.id = `q-${denom.asset}`;
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.maxLength = 6;
    input.value = "0";

    const value = document.createElement("output");
    value.className = "value";
    value.htmlFor = input.id;

    row.append(img, label, input, value);
    container.append(row);
    rows.push({ denom, input, value, row, label, img });
  }
}

/** Texts that depend on the language but are not in index.html. */
function applyDynamicTexts() {
  for (const r of rows) {
    const name = denomName(r.denom, lang());
    r.label.textContent = name;
    r.img.alt = name;
    r.input.setAttribute("aria-label", t("quantity_of", { name }));
  }
  $("today").textContent = new Date().toLocaleDateString(lang() === "en" ? "en-GB" : "de-DE", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
  recalculate();
  updateSaveHint();
  if ($("settings").open) renderSettings();
}

function switchLanguage(newLang) {
  if (newLang === lang()) return;
  setLanguage(newLang, { remember: true });
  applyDynamicTexts();
}

// ------------------------------------------------------------------ input handling

function quantities() {
  const map = new Map();
  for (const r of rows) {
    let n = 0;
    try { n = parseQuantity(r.input.value); } catch { n = 0; }
    map.set(r.denom, n);
  }
  return map;
}

function recalculate() {
  const q = quantities();
  const l = lang();
  let coins = 0;
  let notes = 0;
  let pieces = 0;
  for (const r of rows) {
    const n = q.get(r.denom);
    r.value.textContent = formatLineValue(r.denom, n, l);
    r.row.classList.toggle("has-value", n > 0);
    pieces += n;
    if (r.denom.isNote) notes += lineCents(r.denom, n); else coins += lineCents(r.denom, n);
  }
  const out = {
    coins: formatEuro(coins, l), notes: formatEuro(notes, l), total: formatEuro(coins + notes, l),
    pieces: groupThousands(pieces, l),
  };
  for (const el of document.querySelectorAll("[data-out]")) el.textContent = out[el.dataset.out];
}

function normalize(input) {
  let n = 0;
  try { n = parseQuantity(input.value); } catch { n = 0; }
  if (input.value !== String(n)) input.value = String(n);
}

function moveFocus(index, step) {
  const next = index + step;
  if (next >= 0 && next < rows.length) rows[next].input.focus();
  else if (next >= rows.length) $("save").focus();
}

function wireInputs() {
  rows.forEach((r, i) => {
    r.input.addEventListener("input", () => {
      const clean = sanitizeInput(r.input.value); // drops "-", ".", letters, pasted junk
      if (clean !== r.input.value) r.input.value = clean;
      recalculate();
    });
    r.input.addEventListener("focus", () => r.input.select()); // typing replaces the 0
    r.input.addEventListener("mouseup", (e) => e.preventDefault(), { passive: false });
    r.input.addEventListener("blur", () => { normalize(r.input); recalculate(); });
    r.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); moveFocus(i, +1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveFocus(i, -1); }
    });
  });
}

function setAllZero() {
  for (const r of rows) r.input.value = "0";
  savedSnapshot = null;
  recalculate();
  rows[0].input.focus();
}

const snapshot = (q) => ALL.map((d) => q.get(d)).join(",");
const hasUnsavedInput = () => {
  const q = quantities();
  return [...q.values()].some((n) => n > 0) && snapshot(q) !== savedSnapshot;
};

// ------------------------------------------------------------------ dialogs

/** Shows a modal dialog; resolves with the value of the clicked button (or `cancel`). */
function ask(title, text, buttons, { cancel = null, error = false } = {}) {
  const dlg = $("dialog");
  $("dialog-title").textContent = title;
  $("dialog-text").textContent = text;
  dlg.classList.toggle("error", error);
  const bar = $("dialog-buttons");
  bar.replaceChildren();
  return new Promise((resolve) => {
    // Resolve directly from the click / key press instead of the dialog's
    // "close" event: some browsers deliver that event late (e.g. in background
    // windows), and a late event could then answer the *next* dialog.
    let done = false;
    const settle = (value) => {
      if (done) return;
      done = true;
      dlg.removeEventListener("keydown", onKey);
      if (dlg.open) dlg.close();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); settle(cancel); }
    };
    let focusBtn = null;
    for (const b of buttons) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = b.primary ? "btn btn-primary" : "btn btn-secondary";
      btn.textContent = b.label;
      btn.addEventListener("click", () => settle(b.value));
      bar.append(btn);
      if (b.primary) focusBtn = btn;
    }
    dlg.addEventListener("keydown", onKey);
    dlg.showModal();
    (focusBtn ?? bar.firstElementChild).focus();
  });
}

const okButton = () => [{ label: t("ok"), value: true, primary: true }];
const yesNo = () => [{ label: t("yes"), value: true }, { label: t("no"), value: false, primary: true }];

// ------------------------------------------------------------------ save folder (File System Access API)

const canPickFolder = "showDirectoryPicker" in window;
let folder = null; // FileSystemDirectoryHandle or null (= downloads)

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("kassensturz", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function kv(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", mode);
    const req = fn(tx.objectStore("kv"));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
const loadFolder = () => kv("readonly", (s) => s.get("folder")).catch(() => null);
const storeFolder = (h) => kv("readwrite", (s) => (h ? s.put(h, "folder") : s.delete("folder")));

function updateSaveHint() {
  $("save-hint").textContent = folder ? t("save_to_folder", { name: folder.name }) : t("save_to_downloads");
}

function renderSettings() {
  $("settings-info").textContent = canPickFolder ? t("location_info") : t("location_info_downloads");
  $("settings-path").textContent = folder ? t("folder", { name: folder.name }) : t("downloads_folder");
  $("settings-actions").hidden = !canPickFolder;
  $("use-downloads").hidden = !folder;
}

async function chooseFolder() {
  try {
    const handle = await window.showDirectoryPicker({ id: "kassensturz", mode: "readwrite", startIn: "documents" });
    folder = handle;
    await storeFolder(handle).catch(() => {});
  } catch (e) {
    if (e?.name !== "AbortError") {
      await ask(t("settings"), t("folder_error"), okButton(), { error: true });
    }
  }
  renderSettings();
  updateSaveHint();
}

async function useDownloads() {
  folder = null;
  await storeFolder(null).catch(() => {});
  renderSettings();
  updateSaveHint();
}

async function ensurePermission(handle) {
  const opts = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

// ------------------------------------------------------------------ actions

let saving = false;

async function save() {
  if (saving || $("dialog").open || $("settings").open) return;
  saving = true;
  try {
    for (const r of rows) normalize(r.input);
    recalculate();
    const q = quantities();

    if (![...q.values()].some((n) => n > 0)) {
      const ok = await ask(t("save"), t("empty_question"), yesNo(), { cancel: false });
      if (!ok) return;
    }

    const now = new Date();
    const text = buildText(q, now, lang());
    const base = baseFilename(now);
    let name;
    let where;
    try {
      if (folder) {
        if (!(await ensurePermission(folder))) throw new Error("permission denied");
        name = await writeToFolder(folder, base, text);
        where = t("folder", { name: folder.name });
      } else {
        name = numberedFilename(base, 1);
        download(name, text);
        where = t("where_downloads");
      }
    } catch {
      await ask(t("save_failed_title"), t("save_failed"), okButton(), { error: true });
      return;
    }
    savedSnapshot = snapshot(q);

    const choice = await ask(t("saved_title"), t("saved_message", { name, where }),
      [{ label: t("close"), value: "close" }, { label: t("new_count"), value: "new", primary: true }]);
    if (choice === "new") setAllZero();
  } finally {
    saving = false;
  }
}

async function reset() {
  const ok = await ask(t("reset"), t("reset_question"), yesNo(), { cancel: false });
  if (ok) setAllZero();
}

function openSettings() {
  renderSettings();
  $("settings").showModal();
}

// ------------------------------------------------------------------ start

async function init() {
  buildRows($("coin-rows"), COINS);
  buildRows($("note-rows"), NOTES);
  wireInputs();
  setLanguage(detectLanguage());
  applyDynamicTexts();

  $("save").addEventListener("click", save);
  $("reset").addEventListener("click", reset);
  $("open-settings").addEventListener("click", openSettings);
  $("save-location").addEventListener("click", openSettings);
  $("choose-folder").addEventListener("click", chooseFolder);
  $("use-downloads").addEventListener("click", useDownloads);
  for (const btn of document.querySelectorAll("[data-lang]")) {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedInput()) { e.preventDefault(); e.returnValue = ""; }
  });

  rows[0].input.focus();

  if (canPickFolder) {
    const stored = await loadFolder();
    if (stored) folder = stored;
  }
  updateSaveHint();

  // Offline support after the first visit (only on https / localhost)
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
