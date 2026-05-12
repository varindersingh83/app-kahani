import { existsSync } from "node:fs";
import path from "node:path";

export function repoRoot() {
  let candidate = process.cwd();
  while (true) {
    if (
      existsSync(path.join(candidate, "package.json")) &&
      existsSync(path.join(candidate, "pnpm-workspace.yaml")) &&
      existsSync(path.join(candidate, "artifacts"))
    ) {
      return candidate;
    }

    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }

  return process.cwd();
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
