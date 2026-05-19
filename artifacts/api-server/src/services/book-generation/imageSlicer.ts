import { execFile as execFileCallback } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { SheetSliceManifestEntry } from "./types";

const execFile = promisify(execFileCallback);
const SOURCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SLICER_SCRIPT = resolveSlicerScript();

export type SheetSlicePlan = {
  inputPath: string;
  outputDir: string;
  rows: number;
  cols: number;
  inset: number;
  prefix: string;
  format: string;
  entries: Array<Omit<SheetSliceManifestEntry, "crop">>;
};

export function buildSheetSlicePlan(input: {
  sourceName: string;
  outputRoot?: string;
  rows?: number;
  cols?: number;
  inset?: number;
  prefix?: string;
  format?: string;
}) {
  const rows = input.rows ?? 4;
  const cols = input.cols ?? 3;
  const inset = input.inset ?? 12;
  const prefix = input.prefix ?? "page";
  const format = input.format ?? "png";
  const outputDir = input.outputRoot ?? path.join(os.tmpdir(), `${safeStem(input.sourceName)}-slices`);
  const entries = Array.from({ length: rows * cols }, (_, index) => {
    const pageNumber = index + 1;
    const row = Math.floor(index / cols) + 1;
    const col = (index % cols) + 1;
    return {
      pageNumber,
      row,
      col,
      source: "",
      output: path.join(outputDir, `${prefix}-${String(pageNumber).padStart(2, "0")}.${format}`),
    };
  });

  return {
    inputPath: "",
    outputDir,
    rows,
    cols,
    inset,
    prefix,
    format,
    entries,
  };
}

export async function sliceStoryboardSheet(sheetImageUrl: string) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-sheet-"));
  const { outputDir, rows, cols, inset, prefix, format } = buildSheetSlicePlan({
    sourceName: "storyboard-sheet",
    outputRoot: path.join(tempRoot, "slices"),
  });
  const sourcePath = path.join(tempRoot, `storyboard.${detectExtension(sheetImageUrl)}`);
  const bytes = await loadImageBytes(sheetImageUrl);
  await writeFile(sourcePath, bytes);

  await execFile("python3", [SLICER_SCRIPT, sourcePath, outputDir, "--rows", String(rows), "--cols", String(cols), "--inset", String(inset), "--prefix", prefix, "--format", format]);

  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as Array<SheetSliceManifestEntry>;
  return {
    inputPath: sourcePath,
    outputDir,
    manifestPath,
    entries: manifest.map((entry) => ({
      ...entry,
      source: toFileUrl(entry.source),
      output: toFileUrl(entry.output),
    })),
  };
}

function safeStem(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "sheet";
}

function resolveSlicerScript() {
  const cwdCandidate = path.resolve(process.cwd(), "../../scripts/src/slice-sheet.py");
  if (existsSync(cwdCandidate)) {
    return cwdCandidate;
  }
  return path.resolve(SOURCE_DIR, "../../../../../scripts/src/slice-sheet.py");
}

function detectExtension(source: string) {
  if (source.startsWith("data:image/jpeg")) return "jpg";
  if (source.startsWith("data:image/jpg")) return "jpg";
  if (source.startsWith("data:image/webp")) return "webp";
  if (source.startsWith("data:image/png")) return "png";
  return "png";
}

async function loadImageBytes(source: string) {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL for storyboard sheet.");
    const metadata = source.slice(5, comma);
    const payload = source.slice(comma + 1);
    if (metadata.includes(";base64")) {
      return Buffer.from(payload, "base64");
    }
    return Buffer.from(decodeURIComponent(payload));
  }

  if (source.startsWith("file://")) {
    return readFile(fileURLToPath(source));
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch storyboard sheet image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return readFile(source);
}

function toFileUrl(value: string) {
  if (value.startsWith("file://")) return value;
  return pathToFileURL(value).href;
}
