# Kassensturz – Web

The browser version of Kassensturz. Enter how many pieces of each Euro coin and banknote you
counted; every line and the total are calculated instantly. **Speichern** creates a dated TXT file
in exactly the same format as the desktop app.

- Plain HTML, CSS and JavaScript ("vanilla JS"). No framework, no build step, no backend.
- German and English: follows the browser language, with a **DE | EN** switch in the top bar
  (the choice is remembered in the browser). In English the page is called **Cash Counter**.
  All texts are in `i18n.js`; static texts in `index.html` are marked with `data-i18n="key"`.
- **No data leaves the computer.** The page makes no network requests; nothing is uploaded.
- Money is calculated in whole cents (no rounding errors).
- Works on PC, tablet and phone. After the first visit it can also open offline
  (service worker), and Edge/Chrome can install it like an app.

## Saving

| Browser | Where the TXT file goes |
|---|---|
| Microsoft Edge, Google Chrome | Any folder you choose under **⚙ Einstellungen → Ordner auswählen …**. The folder is remembered. Same-day files are numbered `26-09-2026_Kassensturz.txt`, `…_2.txt`, `…_3.txt` – never overwritten. The browser may ask once per session to allow saving there. |
| Firefox, Safari, or no folder chosen | Downloaded to the browser's **Downloads** folder. If a file with the same name exists, the browser adds its own number, e.g. `… (1).txt`. |

## Files

```
index.html            page structure
style.css             design (same look as the desktop app)
calc.js               denominations, integer-cent maths, number formats (de/en), TXT text
i18n.js               all German and English texts, language detection and switch
storage.js            saving: into a chosen folder or as a download
app.js                everything the page does (inputs, buttons, dialogs, settings)
sw.js                 offline support (service worker)
manifest.webmanifest  lets Edge/Chrome install the page as an app
assets/               coin and note pictures (WebP) and icons
downloads/            Windows installer of the desktop app
vercel.json           Vercel settings: strict security headers
.vercelignore         files that are NOT uploaded to Vercel (tests, tools, …)
tests/calc.test.mjs   automatic tests for the calculations
tools/prepare_images.py   makes the web pictures from the desktop app's assets
```

## Run it on your computer

```bat
cd "C:\Users\yakza\Desktop\Kassensturz-web"
npm start
```

Then open <http://localhost:5173> in Edge or Chrome. (Opening `index.html` directly by
double-click does not work, because browsers block JavaScript modules from `file://`.)

Run the tests:

```bat
npm test
```

## Put it online with Vercel

You need a free account at <https://vercel.com> (sign up with GitHub, Google or e-mail).
In a terminal (e.g. VS Code → Terminal → New Terminal):

```bat
cd "C:\Users\yakza\Desktop\Kassensturz-web"
npx vercel login
npx vercel
npx vercel --prod
```

1. `npx vercel login` opens the browser – log in and confirm.
2. `npx vercel` asks a few questions the first time. Answer: set up and deploy → **Y**,
   scope → your account, link to existing project → **N**, project name → `kassensturz`,
   directory → `./` (Enter), modify settings → **N**. You get a **preview** link to test.
3. `npx vercel --prod` publishes the final version, e.g. `https://kassensturz.vercel.app`.

To publish changes later, run `npx vercel --prod` again. If you changed files that are cached
for offline use, increase the version in `sw.js` (`kassensturz-v1` → `kassensturz-v2`) so every
browser picks up the new version.

**Before publishing:** Vercel's free Hobby plan is for personal, non-commercial use – check the
plan if you use it at work. The page will be public, including the money pictures, so make sure
you are allowed to publish those images.

## Desktop app download

The page offers the Windows installer at `downloads/Kassensturz_Setup_1.0.0.exe`
(section "Kassensturz als Desktop-App", and the "Desktop-App" link in the top bar).
It is served as a download (`vercel.json`) and never cached for offline use.

After rebuilding the desktop app (`..\Kassensturz\build.bat`):

1. Copy `..\Kassensturz\release\Kassensturz_Setup_1.0.0.exe` into `downloads\`.
2. Update the size (`13,2 MB` / `13.2 MB`) in `index.html` and `i18n.js`, and the SHA-256
   checksum in `index.html`. Get the checksum with:
   `powershell (Get-FileHash downloads\Kassensturz_Setup_1.0.0.exe).Hash`
3. For a new version number, also rename the file and update the link and version text.

The installer is not digitally signed, so Edge/Windows may warn when it is downloaded or started.

## Layout

| Screen | Layout |
|---|---|
| Phone (< 720 px) | One column; total, Speichern and Zurücksetzen pinned at the bottom |
| Tablet (720–1179 px) | Coins and notes side by side; summary bar pinned at the bottom |
| Desktop (≥ 1180 px) | Coins, notes and a summary panel on the right |

Each denomination row switches between a one-line and a two-line layout depending on the width
of its card (CSS container queries).

## Changing the pictures

Replace the pictures in the desktop project (`..\Kassensturz\assets\`), then run:

```bat
"C:\Users\yakza\Desktop\Kassensturz\.venv\Scripts\python.exe" tools\prepare_images.py
```

It trims white borders, makes the white background around the coins transparent and writes
small WebP files into `assets/`. After changing pictures, raise the cache version in `sw.js`.
