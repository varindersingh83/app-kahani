import { readFile } from "node:fs/promises";
import { scanPromptInjection } from "@workspace/guardrails";

async function readCliInput(args: string[]) {
  if (args.length > 0) return args.join(" ");

  if (process.stdin.isTTY) {
    throw new Error("Provide text as arguments or pipe text to stdin.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function maybeReadFile(args: string[]) {
  const fileFlagIndex = args.findIndex((arg) => arg === "--file" || arg === "-f");
  if (fileFlagIndex === -1) return null;

  const filePath = args[fileFlagIndex + 1];
  if (!filePath) {
    throw new Error("--file requires a path.");
  }

  return {
    text: await readFile(filePath, "utf8"),
    remainingArgs: args.filter((_, index) => index !== fileFlagIndex && index !== fileFlagIndex + 1),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fileInput = await maybeReadFile(args);
  const text = fileInput?.text ?? (await readCliInput(fileInput?.remainingArgs ?? args));
  const result = scanPromptInjection(text);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.verdict === "block" ? 2 : result.verdict === "review" ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 64;
  });
}
