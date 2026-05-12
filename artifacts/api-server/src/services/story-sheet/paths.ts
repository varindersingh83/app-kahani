import { existsSync } from "node:fs";
import path from "node:path";

export function repoRoot() {
  const candidates = [
    path.resolve(process.cwd(), "../.."),
    process.cwd(),
    path.resolve(process.cwd(), "../../.."),
  ];

  for (const candidate of candidates) {
    if (
      existsSync(path.join(candidate, "package.json")) &&
      existsSync(path.join(candidate, "artifacts"))
    ) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), "../..");
}

export function storySheetRunsRoot() {
  return path.join(repoRoot(), "artifacts", "story-sheet-runs");
}

export function storySheetRunDir(bookId: string) {
  return path.join(storySheetRunsRoot(), bookId);
}

export function promptPath(name: string) {
  return path.join(repoRoot(), "scripts", "data", name);
}

export function slicerScriptPath() {
  return path.join(repoRoot(), "scripts", "src", "slice-sheet.py");
}
