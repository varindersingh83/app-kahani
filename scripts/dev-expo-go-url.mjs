import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const logDir = path.join(repoRoot, ".local", "logs");
const expoPort = Number(process.env.EXPO_PORT || 8081);
const apiPort = Number(process.env.API_PORT || 8080);
const host = process.env.EXPO_LAN_HOST || getLanHost();
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${host}:${apiPort}`;
const expoGoUrl = `exp://${host}:${expoPort}`;

await fs.promises.mkdir(logDir, { recursive: true });

const apiRunning = await checkJson(`http://localhost:${apiPort}/api/healthz`);
if (!apiRunning) {
  startBackgroundProcess("api", ["run", "dev:api"], {
    PORT: String(apiPort),
  });
  await waitFor(
    () => checkJson(`http://localhost:${apiPort}/api/healthz`),
    "API",
  );
}

const expoRunning = await checkText(
  `http://localhost:${expoPort}/status`,
  "packager-status:running",
);
if (!expoRunning) {
  startBackgroundProcess(
    "expo",
    [
      "--filter",
      "@workspace/mobile",
      "exec",
      "expo",
      "start",
      "--host",
      "lan",
      "--port",
      String(expoPort),
      "--non-interactive",
    ],
    {
      HOME: path.join(repoRoot, ".local", "expo-home"),
      XDG_CONFIG_HOME: path.join(repoRoot, ".local", "expo-home", ".config"),
      EXPO_NO_TELEMETRY: "1",
      EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
      EXPO_PUBLIC_DOMAIN: host,
    },
  );
  await waitFor(
    () =>
      checkText(
        `http://localhost:${expoPort}/status`,
        "packager-status:running",
      ),
    "Expo",
  );
}

console.log("");
console.log("Kahani local app is running.");
console.log(`Expo Go URL: ${expoGoUrl}`);
console.log(`Expo status: http://localhost:${expoPort}/status`);
console.log(`API health: http://localhost:${apiPort}/api/healthz`);
console.log("");
console.log("If Expo Go cannot connect, make sure your phone is on the same Wi-Fi as this computer.");
console.log(`Logs: ${path.relative(repoRoot, logDir)}/api.log and ${path.relative(repoRoot, logDir)}/expo.log`);

function startBackgroundProcess(name, args, env = {}) {
  const logPath = path.join(logDir, `${name}.log`);
  const out = fs.openSync(logPath, "a");
  const child = spawn("pnpm", args, {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", out, out],
  });

  child.unref();
  console.log(`Started ${name} in background. Log: ${path.relative(repoRoot, logPath)}`);
}

async function waitFor(check, label) {
  const started = Date.now();
  const timeoutMs = Number(process.env.LOCAL_APP_START_TIMEOUT_MS || 120_000);

  while (Date.now() - started < timeoutMs) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`${label} did not become ready within ${timeoutMs / 1000}s. Check .local/logs/${label.toLowerCase()}.log.`);
}

function checkJson(url) {
  return request(url).then(
    ({ statusCode, body }) => {
      if (statusCode !== 200) return false;
      try {
        const data = JSON.parse(body);
        return data.status === "ok";
      } catch {
        return false;
      }
    },
    () => false,
  );
}

function checkText(url, expected) {
  return request(url).then(
    ({ statusCode, body }) => statusCode === 200 && body.includes(expected),
    () => false,
  );
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
