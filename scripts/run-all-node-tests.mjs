import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tsxBin = path.join(repoRoot, "scripts", "node_modules", ".bin", "tsx");
const searchRoots = ["artifacts", "lib"];
const testFiles = [];

for (const root of searchRoots) {
  walk(path.join(repoRoot, root));
}

testFiles.sort();

if (testFiles.length === 0) {
  console.log("No .test.ts files found.");
  process.exit(0);
}

if (!fs.existsSync(tsxBin)) {
  console.error(`Missing test runner: ${path.relative(repoRoot, tsxBin)}`);
  console.error("Run pnpm install before running local tests.");
  process.exit(1);
}

console.log(`Running ${testFiles.length} local TypeScript test files...`);

const child = spawn(tsxBin, ["--test", ...testFiles], {
  cwd: repoRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});

function walk(directory) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      testFiles.push(path.relative(repoRoot, fullPath));
    }
  }
}
