import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_EXPO_PORT ?? 19007);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: "output/playwright",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 HOME=$PWD/.local/expo-home XDG_CONFIG_HOME=$PWD/.local/expo-home/.config EXPO_NO_TELEMETRY=1 pnpm --filter @workspace/mobile exec expo start --localhost --web --clear --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
