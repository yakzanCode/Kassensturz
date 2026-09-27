// German and English texts for the page.
// Static text in index.html is marked with data-i18n="key" (textContent),
// data-i18n-aria="key" (aria-label) and data-i18n-title="key" (title).

export const TEXTS = {
  de: {
    doc_title: "Kassensturz – Bargeld zählen",
    app_title: "Kassensturz",
    desktop_app: "Desktop-App",
    settings: "Einstellungen",
    language: "Sprache",
    coins: "Münzen",
    notes: "Scheine",
    total: "Gesamt",
    pieces: "Stück gezählt",
    save: "Speichern",
    reset: "Zurücksetzen",
    summary: "Zusammenfassung",
    tip: "Tipp:",
    tip_next: "springt zum nächsten Feld,",
    ctrl: "Strg",
    tip_save: "speichert.",
    save_to_folder: "Speichern in: Ordner „{name}“",
    save_to_downloads: "Speichern in: Downloads-Ordner",
    change_location: "Speicherort ändern",
    quantity_of: "Stückzahl {name}",
    dl_title: "Kassensturz als Desktop-App",
    dl_text: "Das gleiche Programm für Windows – startet ohne Browser, funktioniert komplett offline "
      + "und speichert direkt in einen Ordner Ihrer Wahl.",
    dl_f1: "Ohne Internet nutzbar",
    dl_f2: "Keine Administratorrechte nötig",
    dl_f3: "TXT-Dateien im gewählten Ordner",
    dl_button: "Für Windows herunterladen",
    dl_meta: "Version 1.0.0 · 13,2 MB · Windows 10 / 11",
    dl_help: "Hinweise zur Installation",
    dl_step1: "Die heruntergeladene Datei Kassensturz_Setup_1.0.0.exe öffnen.",
    dl_step2: "„Nur für mich installieren“ wählen – keine Administratorrechte nötig.",
    dl_step3: "Falls Windows „Der Computer wurde durch Windows geschützt“ meldet: Das Programm ist nicht "
      + "digital signiert. Auf „Weitere Informationen“ → „Trotzdem ausführen“ klicken. Bei Firmen-PCs ggf. die IT fragen.",
    checksum: "Prüfsumme (SHA-256):",
    footer: "Alle Eingaben bleiben auf diesem Gerät. Diese Seite sendet keine Daten ins Internet.",
    location: "Speicherort",
    location_info: "In diesem Ordner werden die Kassensturz-Dateien (.txt) gespeichert.",
    location_info_downloads: "Dieser Browser speichert die Dateien im Downloads-Ordner. Einen eigenen Ordner "
      + "können Sie in Microsoft Edge oder Google Chrome wählen.",
    folder: "Ordner: {name}",
    downloads_folder: "Downloads-Ordner des Browsers",
    choose_folder: "Ordner auswählen …",
    use_downloads: "Downloads-Ordner verwenden",
    privacy: "Alle Daten bleiben auf diesem Computer. Die Seite sendet nichts ins Internet.",
    close: "Schließen",
    ok: "OK",
    yes: "Ja",
    no: "Nein",
    folder_error: "Der Ordner konnte nicht ausgewählt werden.",
    empty_question: "Alle Stückzahlen sind 0.\nMöchten Sie trotzdem speichern?",
    save_failed_title: "Speichern fehlgeschlagen",
    save_failed: "Die Datei konnte nicht gespeichert werden. Bitte überprüfen Sie den ausgewählten Speicherort.",
    saved_title: "Gespeichert",
    saved_message: "Kassensturz wurde gespeichert.\n\n{name}\n{where}\n\nNeue Zählung starten?",
    where_downloads: "Downloads-Ordner",
    new_count: "Neue Zählung",
    reset_question: "Möchten Sie alle Eingaben zurücksetzen?",
  },
  en: {
    doc_title: "Cash Counter – count your till",
    app_title: "Cash Counter",
    desktop_app: "Desktop app",
    settings: "Settings",
    language: "Language",
    coins: "Coins",
    notes: "Banknotes",
    total: "Total",
    pieces: "Pieces counted",
    save: "Save",
    reset: "Reset",
    summary: "Summary",
    tip: "Tip:",
    tip_next: "moves to the next field,",
    ctrl: "Ctrl",
    tip_save: "saves.",
    save_to_folder: "Saving to: folder “{name}”",
    save_to_downloads: "Saving to: Downloads folder",
    change_location: "Change save location",
    quantity_of: "Quantity {name}",
    dl_title: "Cash Counter as a desktop app",
    dl_text: "The same program for Windows – runs without a browser, works completely offline "
      + "and saves straight into a folder of your choice.",
    dl_f1: "Works without internet",
    dl_f2: "No administrator rights needed",
    dl_f3: "TXT files in the folder you choose",
    dl_button: "Download for Windows",
    dl_meta: "Version 1.0.0 · 13.2 MB · Windows 10 / 11",
    dl_help: "Installation notes",
    dl_step1: "Open the downloaded file Kassensturz_Setup_1.0.0.exe.",
    dl_step2: "Choose “Install for me only” – no administrator rights needed.",
    dl_step3: "If Windows says “Windows protected your PC”: the program is not digitally signed. "
      + "Click “More info” → “Run anyway”. On company PCs, ask your IT department if needed.",
    checksum: "Checksum (SHA-256):",
    footer: "Everything you enter stays on this device. This page sends no data to the internet.",
    location: "Save location",
    location_info: "Cash count files (.txt) are saved in this folder.",
    location_info_downloads: "This browser saves the files to your Downloads folder. "
      + "You can choose your own folder in Microsoft Edge or Google Chrome.",
    folder: "Folder: {name}",
    downloads_folder: "Browser's Downloads folder",
    choose_folder: "Choose folder …",
    use_downloads: "Use Downloads folder",
    privacy: "All data stays on this computer. The page sends nothing to the internet.",
    close: "Close",
    ok: "OK",
    yes: "Yes",
    no: "No",
    folder_error: "The folder could not be selected.",
    empty_question: "All quantities are 0.\nDo you still want to save?",
    save_failed_title: "Saving failed",
    save_failed: "The file could not be saved. Please check the selected save location.",
    saved_title: "Saved",
    saved_message: "The cash count has been saved.\n\n{name}\n{where}\n\nStart a new count?",
    where_downloads: "Downloads folder",
    new_count: "New count",
    reset_question: "Do you want to reset all entries?",
  },
};

const STORAGE_KEY = "kassensturz-lang";
let current = "de";

/** Saved choice, otherwise the browser language (German -> de, everything else -> en). */
export function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in TEXTS) return saved;
  } catch { /* storage blocked: fall back to the browser language */ }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || "de"];
  return prefs.some((l) => String(l).toLowerCase().startsWith("de")) ? "de" : "en";
}

export function setLanguage(lang, { remember = false } = {}) {
  current = lang in TEXTS ? lang : "de";
  if (remember) {
    try { localStorage.setItem(STORAGE_KEY, current); } catch { /* not important */ }
  }
  applyStatic();
}

export const lang = () => current;

export function t(key, values = {}) {
  const text = TEXTS[current][key] ?? TEXTS.de[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
}

/** Updates every marked element in the page. */
function applyStatic() {
  document.documentElement.lang = current;
  document.title = t("doc_title");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll("[data-lang]")) {
    el.setAttribute("aria-pressed", String(el.dataset.lang === current));
  }
}
