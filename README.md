# Kahani App

Kahani is a pnpm workspace TypeScript monorepo for Parent Story Studio. It includes an Express API, generated API clients/schemas, database schema tooling, a Vite mockup sandbox, and an Expo mobile app.

## Project Layout

- `artifacts/api-server` - Express API server. Main local health endpoint: `/api/healthz`.
- `artifacts/mobile` - Expo Router mobile app for Parent Story Studio.
- `artifacts/mockup-sandbox` - Vite React sandbox for mockup work.
- `lib/api-spec` - OpenAPI spec and Orval code generation config.
- `lib/api-client-react` - generated React API client.
- `lib/api-zod` - generated Zod request/response schemas.
- `lib/db` - Drizzle/PostgreSQL schema and migration push tooling.
- `scripts` - workspace utility scripts.

## Current App Flow

The main product surface is the Expo mobile app in `artifacts/mobile`. Parents add child characters on the Add Character tab, including a name and optional uploaded image. The Create Story tab lets a parent choose one saved character, choose behavior support or random story mode, enter a behavior/story prompt, and generate a picture book through the API. The newly generated book appears on the same Create Story screen as the current story card.

The Library tab reads from the app's local `AsyncStorage` story state. Today, a generated book is not automatically added to the saved library grid immediately after generation; it becomes a saved library item when the parent opens the reader and saves it from the end page. The Library can still show the current unsaved story as the featured book.

Character creation currently persists only `name` and `photoUri`. The screen also collects avatar, age, gender, hair, skin, outfit, and personality UI values, but those values are not yet saved into `StoryContext` or sent to the backend.

## Backend Generation Flow

The mobile app calls `POST /api/stories/generate`, which validates the request, starts the story-sheet generation job, and returns the packaged story JSON used by the frontend once polling completes. The fuller persistent backend surface is `POST /api/books`; it returns a `bookId`, status, generated story, QA flag, and retry total. Saved backend jobs can be inspected with `GET /api/books/:bookId`, `GET /api/books/:bookId/pages`, and `GET /api/books/:bookId/events`.

The generation pipeline lives under `artifacts/api-server/src/services/story-sheet`. It creates a local generation job, normalizes the parent input, builds a 12-page story JSON plan, generates one 4x4 storyboard sheet, slices the sheet into cover/ownership/end/blank/page images, and packages the final story.

Important current backend requirements: `DATABASE_URL` must point at a reachable Postgres database for the full pipeline, and AI generation requires `AI_INTEGRATIONS_OPENROUTER_BASE_URL` plus `AI_INTEGRATIONS_OPENROUTER_API_KEY`. Clerk middleware is wired, but local development skips auth when Clerk env vars are absent.

## Prerequisites

- Node.js 24
- pnpm
- PostgreSQL, only if you are working on database-backed features

This repo enforces pnpm in `preinstall`, so avoid `npm install` or `yarn install`.

Check the active Node version before starting the local runtime:

```sh
node -v
pnpm -v
```

If your shell is running with `CODEX_CI=1`, unset it for long-running dev servers. Expo exits immediately in CI mode, and the API build can behave differently under the Codex CI environment:

```sh
unset CODEX_CI
```

## Install Dependencies

From the repository root:

```sh
pnpm install
```

## Environment Variables

Copy the example file before starting local development:

```sh
cp .env.example .env
```

The root dev scripts load `.env` automatically. For local development, these are the important values:

```sh
# API server
PORT=8080

# Database
DATABASE_URL=postgresql://localhost:5432/kahani

# Required only for AI story generation.
AI_INTEGRATIONS_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_INTEGRATIONS_OPENROUTER_API_KEY=your-api-key
AI_INTEGRATIONS_OPENROUTER_MODEL=openai/gpt-5.4-nano
AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL=google/gemini-3.1-flash-image-preview

# Optional when using OpenRouter.
OPENROUTER_SITE_URL=http://localhost:8080
OPENROUTER_APP_TITLE=Kahani

# Required only for Clerk auth flows.
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

For OpenRouter, keep the same internal env names and point the OpenAI-compatible base URL at OpenRouter:

```sh
AI_INTEGRATIONS_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_INTEGRATIONS_OPENROUTER_API_KEY=your-openrouter-api-key
AI_INTEGRATIONS_OPENROUTER_MODEL=google/gemini-3-flash-preview
AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL=google/gemini-3.1-flash-image-preview
OPENROUTER_SITE_URL=http://localhost:8080
OPENROUTER_APP_TITLE=Kahani
```

`OPENROUTER_SITE_URL` and `OPENROUTER_APP_TITLE` are optional attribution headers. The image model must be an OpenRouter model ID, usually with a provider prefix such as `google/gemini-3.1-flash-image-preview`, or whichever model you choose in OpenRouter.

The current book pipeline uses the image model once for the full 4x4 storyboard sheet. The first row contains the cover, ownership page, end page, and blank page; the remaining 12 panels are the story pages. The image prompt includes an image-spec section that carries the child reference photo, optional appearance description, and supporting-character consistency rules before the server slices the sheet into page images.

The mockup sandbox also requires:

```sh
MOCKUP_PORT=8081
BASE_PATH=/
```

The Expo mobile `dev` script is currently Replit-oriented and expects Replit domain variables. For plain local Expo work, use the manual command shown below.

## Run The API Server

```sh
pnpm run dev:api
```

Then smoke test it:

```sh
curl http://localhost:8080/api/healthz
```

Expected response:

```json
{"status":"ok"}
```

The API listens on `http://localhost:8080` by default. If you are starting it from a sandboxed agent environment and see `listen EPERM: operation not permitted 0.0.0.0:8080`, rerun the same command from a normal terminal so the process can bind the port.

Story generation is available at `POST /api/stories/generate`, but it requires `AI_INTEGRATIONS_OPENROUTER_BASE_URL` and `AI_INTEGRATIONS_OPENROUTER_API_KEY`. Set `AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL` to choose the image model used for both the cover and storyboard-sheet calls; it defaults to `google/gemini-3.1-flash-image-preview` when unset. The older `AI_INTEGRATIONS_OPENAI_*` variables still work as backwards-compatible fallbacks.

For persistent backend jobs, use `POST /api/books`. The created book can be fetched later with `GET /api/books/:bookId`, and the per-page progress and events live at `GET /api/books/:bookId/pages` and `GET /api/books/:bookId/events`.

## Render Production Shape

Production is Render-first: one web service for `@workspace/api-server`, one background worker service using `start:worker`, and one managed Postgres database. The blueprint lives in `render.yaml`.

Production startup fails closed when required auth, database, encryption, private asset storage, provider, analytics, alerting, consent-version, or provider-photo-policy settings are missing. Keep staging synthetic-only; do not copy production family data into staging.

Before public signup, review:

- `docs/security/internal-security-review.md`
- `docs/security/vendor-allowlist.md`
- `docs/runbooks/production-launch.md`

## Run The Mockup Sandbox

```sh
pnpm run dev:mockup
```

Open `http://localhost:8081/`.

## Run The Mobile App Locally

For the Replit-style script:

```sh
PORT=18115 pnpm --filter @workspace/mobile run dev
```

For a normal local Expo session, this is usually easier:

```sh
pnpm run dev:mobile
```

`dev:mobile` points the app at the local API server with `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` and starts Metro. Expo may choose an open port if `8081` is busy. When `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set, the mobile app skips the Clerk sign-in screen for local development and opens the app directly.

Smoke test Metro after it starts:

```sh
curl http://localhost:8081/status
```

Expected response:

```text
packager-status:running
```

For browser testing, start Expo web on a fixed port and verify the browser renders the app, not only that Metro returns HTML:

```sh
HOME=$PWD/.local/expo-home \
XDG_CONFIG_HOME=$PWD/.local/expo-home/.config \
EXPO_NO_TELEMETRY=1 \
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 \
pnpm --filter @workspace/mobile exec expo start --localhost --web --clear --port 19007
```

Open `http://localhost:19007/library`. If the page forever spins or shows the Expo red error overlay, check the Metro terminal for a web bundle error. A common failure is importing native-only modules at module scope. Keep web-safe fallbacks for providers such as `react-native-gesture-handler` and `react-native-keyboard-controller` so the browser does not evaluate their native entrypoints.

If Expo fails during startup with `TypeError: fetch failed` while validating native module versions, use Expo offline mode:

```sh
HOME=$PWD/.local/expo-home \
XDG_CONFIG_HOME=$PWD/.local/expo-home/.config \
EXPO_NO_TELEMETRY=1 \
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 \
pnpm --filter @workspace/mobile exec expo start --offline --port 8081
```

If you need Clerk auth in the mobile app, set `CLERK_PUBLISHABLE_KEY` before starting the Replit-oriented `dev` script. That script maps the value to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

## Story Sheet Flow

The live parent-to-carousel flow is the story-sheet runner in `scripts/`.

```sh
pnpm --filter @workspace/scripts run story:sheet-run
```

It reads the parent prompt and character inputs, generates the story JSON, creates the storyboard sheet, slices it into 16 panels, and writes the carousel assets into `artifacts/story-sheet-runs/`.

## Database Tasks

Push the Drizzle schema to a development database:

```sh
pnpm run db:push
```

Use `push-force` only when you intentionally want Drizzle to apply potentially destructive schema changes in development.

## API Code Generation

After editing `lib/api-spec/openapi.yaml`, regenerate the API client and Zod schemas:

```sh
pnpm --filter @workspace/api-spec run codegen
```

This also runs the library typecheck.

## Basic Testing

There are no dedicated unit or end-to-end test scripts in the repo yet. Start with these checks before opening a PR:

```sh
pnpm run typecheck
pnpm run build
```

Run focused package checks while developing:

```sh
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/mockup-sandbox run typecheck
pnpm --filter @workspace/mobile run typecheck
```

Recommended smoke tests:

- API: start the API server and `curl http://localhost:8080/api/healthz`.
- Mockup sandbox: start Vite, open `http://localhost:8081/`, and confirm the UI renders.
- Mobile: start Expo and confirm the app loads in a simulator, browser, or Expo Go.
- Story generation: with AI env vars set, run the story-sheet flow and confirm it writes the sheet, sliced pages, and carousel HTML.

## Useful Workspace Commands

```sh
# Full typecheck across libraries, artifacts, and scripts.
pnpm run typecheck

# Start the local API server on port 8080.
pnpm run dev:api

# Start Expo against the local API server.
pnpm run dev:mobile

# Start the Vite mockup sandbox on port 8081.
pnpm run dev:mockup

# Typecheck, then build all packages with build scripts.
pnpm run build

# Regenerate OpenAPI-derived clients and schemas.
pnpm --filter @workspace/api-spec run codegen
```
