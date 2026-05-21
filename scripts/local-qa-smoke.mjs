import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const qaDir = path.join(repoRoot, ".local", "qa");
const apiPort = Number(process.env.API_PORT || 8080);
const expoPort = Number(process.env.EXPO_PORT || 8081);
const host = process.env.EXPO_LAN_HOST || getLanHost();
const startedAt = Date.now();
const steps = [];
const tsxBin = path.join(repoRoot, "scripts", "node_modules", ".bin", "tsx");

const focusedTests = [
  "artifacts/mobile/services/onboardingConsent.test.ts",
  "artifacts/mobile/services/analytics.test.ts",
  "artifacts/mobile/services/runtimeConfig.test.ts",
  "artifacts/mobile/services/photoExtractionGate.test.ts",
  "artifacts/mobile/services/photoTraitPolicy.test.ts",
  "artifacts/mobile/services/photoTraitExtractor.test.ts",
  "artifacts/mobile/services/characterPrivacy.test.ts",
  "artifacts/mobile/services/cartoonCharacter.test.ts",
  "artifacts/mobile/services/storyChat.test.ts",
  "artifacts/mobile/services/photoDescriptors.test.ts",
  "artifacts/api-server/src/services/safety/inputGuardrails.test.ts",
  "artifacts/api-server/src/services/safety/providerPayloadPolicy.test.ts",
  "artifacts/api-server/src/services/consent/consentService.test.ts",
  "artifacts/api-server/src/routes/generationConsent.test.ts",
  "artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts",
  "artifacts/api-server/src/services/book-generation/validation.test.ts",
];

await fs.promises.mkdir(qaDir, { recursive: true });

try {
  await recordStep("api health", () =>
    checkJson(`http://localhost:${apiPort}/api/healthz`, (data) => data.status === "ok"),
  );
  await recordStep("expo status", () =>
    checkText(`http://localhost:${expoPort}/status`, "packager-status:running"),
  );

  if (!isTruthy(process.env.LOCAL_QA_SKIP_TESTS)) {
    await recordStep("focused behavior/security tests", () =>
      runCommand(
        fs.existsSync(tsxBin) ? tsxBin : "pnpm",
        fs.existsSync(tsxBin)
          ? ["--test", ...focusedTests]
          : ["--filter", "@workspace/scripts", "exec", "tsx", "--test", ...focusedTests.map((testPath) => `../${testPath}`)],
        Number(process.env.LOCAL_QA_TEST_TIMEOUT_MS || 60_000),
      ),
    );
  }

  await writeStatus(true);
  console.log(
    `Local QA passed in ${formatDuration(Date.now() - startedAt)}. Expo Go URL: exp://${host}:${expoPort}`,
  );
} catch (error) {
  await writeStatus(false, error);
  console.error(`Local QA failed after ${formatDuration(Date.now() - startedAt)}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function recordStep(name, check) {
  const stepStartedAt = Date.now();

  try {
    await check();
    steps.push({
      name,
      ok: true,
      durationMs: Date.now() - stepStartedAt,
    });
    console.log(`ok - ${name}`);
  } catch (error) {
    steps.push({
      name,
      ok: false,
      durationMs: Date.now() - stepStartedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function writeStatus(ok, error) {
  const status = {
    ok,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    expoGoUrl: `exp://${host}:${expoPort}`,
    apiHealthUrl: `http://localhost:${apiPort}/api/healthz`,
    expoStatusUrl: `http://localhost:${expoPort}/status`,
    steps,
    error: error instanceof Error ? error.message : error ? String(error) : undefined,
  };

  const json = `${JSON.stringify(status, null, 2)}\n`;
  await fs.promises.writeFile(path.join(qaDir, "status.json"), json);
  await fs.promises.appendFile(path.join(qaDir, "history.jsonl"), `${JSON.stringify(status)}\n`);
}

function runCommand(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} ${args.join(" ")} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        const summary = output.match(/# tests .+|# pass .+|# fail .+/g)?.join(", ");
        if (summary) console.log(`   ${summary}`);
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${tail(output)}`));
    });
  });
}

function checkJson(url, validate) {
  return request(url).then(({ statusCode, body }) => {
    if (statusCode !== 200) {
      throw new Error(`${url} returned ${statusCode}`);
    }

    const data = JSON.parse(body);
    if (!validate(data)) {
      throw new Error(`${url} returned unexpected body: ${body}`);
    }
  });
}

function checkText(url, expected) {
  return request(url).then(({ statusCode, body }) => {
    if (statusCode !== 200 || !body.includes(expected)) {
      throw new Error(`${url} returned unexpected response: ${statusCode} ${body}`);
    }
  });
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 5_000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out: ${url}`));
    });
    req.on("error", reject);
  });
}

function getLanHost() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (
        address.family === "IPv4" &&
        !address.internal &&
        !address.address.startsWith("169.254.")
      ) {
        return address.address;
      }
    }
  }

  return "localhost";
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(value?.trim() ?? "");
}

function formatDuration(durationMs) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function tail(value) {
  return value.split("\n").slice(-40).join("\n");
}
