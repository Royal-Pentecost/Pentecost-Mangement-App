import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

/**
 * Import and export, working the same way from every screen.
 *
 * On a device a file is written into the cache directory and handed to the
 * system share sheet, which is how a phone "downloads" anything. On the web
 * preview there is no share sheet, so the same content goes out as a Blob the
 * browser saves. Callers never see the difference — they get a `FileResult`
 * back and can say what happened.
 */
export interface FileResult {
  ok: boolean;
  /** Ready to show the user — why it failed, or where the file went. */
  message: string;
}

const isWeb = Platform.OS === "web";

/** Trigger a browser download. Web only. */
function downloadInBrowser(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Write text out as a file the user can keep — share sheet on device, download on web. */
export async function exportTextFile(
  name: string,
  mime: string,
  content: string,
): Promise<FileResult> {
  try {
    if (isWeb) {
      downloadInBrowser(name, mime, content);
      return { ok: true, message: `${name} downloaded` };
    }

    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(content);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: name, UTI: utiFor(mime) });
      return { ok: true, message: `${name} ready to save or send` };
    }

    return { ok: true, message: `Saved to ${file.uri}` };
  } catch (e) {
    return { ok: false, message: `Could not export ${name}: ${errorText(e)}` };
  }
}

/** Render HTML to a real PDF and hand it to the user. */
export async function exportPdf(name: string, html: string): Promise<FileResult> {
  try {
    if (isWeb) {
      // No print-to-file on web; the browser's own print dialog does the job.
      await Print.printAsync({ html });
      return { ok: true, message: `${name} sent to print` };
    }

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: name, UTI: "com.adobe.pdf" });
      return { ok: true, message: `${name} ready to save or send` };
    }

    return { ok: true, message: `Saved to ${uri}` };
  } catch (e) {
    return { ok: false, message: `Could not create ${name}: ${errorText(e)}` };
  }
}

/** Let the user choose a text file and read it back. */
export async function importTextFile(
  mimeTypes: string[] = ["text/csv", "text/comma-separated-values", "text/plain"],
): Promise<{ ok: boolean; message: string; name?: string; content?: string }> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: mimeTypes, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return { ok: false, message: "Import cancelled" };

    const asset = picked.assets[0];
    // On web the picker hands back a blob: URL, which only `fetch` can read.
    const content = isWeb ? await (await fetch(asset.uri)).text() : await new File(asset.uri).text();

    return { ok: true, message: `Read ${asset.name}`, name: asset.name, content };
  } catch (e) {
    return { ok: false, message: `Could not read that file: ${errorText(e)}` };
  }
}

/** Quote a CSV cell only when it needs it. */
function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Build a CSV document from a header row and matching value rows. */
export function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

/**
 * Parse a CSV back into objects keyed by the header row. Deliberately simple —
 * it handles quoted cells and embedded commas, which is what a spreadsheet
 * export produces, and nothing more exotic.
 */
export function fromCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (ch !== "\r") {
      value += ch;
    }
  }

  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((r) => r.some((v) => v.trim() !== ""));
  if (!headers) return [];

  return body.map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (r[i] ?? "").trim();
    });
    return record;
  });
}

/** A timestamped filename, so repeated exports don't overwrite each other. */
export function stampedName(base: string, extension: string) {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${base}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${extension}`;
}

function utiFor(mime: string) {
  if (mime === "text/csv") return "public.comma-separated-values-text";
  if (mime === "application/pdf") return "com.adobe.pdf";
  return "public.plain-text";
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
