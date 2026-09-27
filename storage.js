// Writing the TXT record: into a chosen folder (Edge/Chrome) or as a download.
import { numberedFilename } from "./calc.js";

/** Writes into the folder without ever overwriting: base.txt, base_2.txt, ... Returns the file name. */
export async function writeToFolder(dir, base, text) {
  for (let n = 1; n <= 999; n++) {
    const name = numberedFilename(base, n);
    try {
      await dir.getFileHandle(name); // exists -> try the next number
      continue;
    } catch (e) {
      if (e?.name !== "NotFoundError") throw e;
    }
    const file = await dir.getFileHandle(name, { create: true });
    const w = await file.createWritable();
    await w.write(new Blob([text], { type: "text/plain;charset=utf-8" }));
    await w.close();
    return name;
  }
  throw new Error("Zu viele Dateien für diesen Tag");
}

/** Offers the text as a file download (browser's Downloads folder). */
export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
