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

## Prerequisites

- Node.js 24
- pnpm
- PostgreSQL, only if you are working on database-backed features

This repo enforces pnpm in `preinstall`, so avoid `npm install` or `yarn install`.

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

The current book pipeline uses the image model twice: once for the cover, and once for the full 3x4 storyboard sheet. The storyboard-sheet call returns the canonical story text plus the sheet image, and the server slices that sheet into page images before packaging the final book. If cover generation fails, the pipeline can still continue without a cover image.

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

Story generation is available at `POST /api/stories/generate`, but it requires `AI_INTEGRATIONS_OPENROUTER_BASE_URL` and `AI_INTEGRATIONS_OPENROUTER_API_KEY`. Set `AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL` to choose the image model used for both the cover and storyboard-sheet calls; it defaults to `google/gemini-3.1-flash-image-preview` when unset. The older `AI_INTEGRATIONS_OPENAI_*` variables still work as backwards-compatible fallbacks.

For the persistent book pipeline, use `POST /api/books`. The created book can be fetched later with `GET /api/books/:bookId`, and the per-page progress and events live at `GET /api/books/:bookId/pages` and `GET /api/books/:bookId/events`.

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

`dev:mobile` points the app at the local API server with `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`. When `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set, the mobile app skips the Clerk sign-in screen for local development and opens the app directly.

If you need Clerk auth in the mobile app, set `CLERK_PUBLISHABLE_KEY` before starting the Replit-oriented `dev` script. That script maps the value to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

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
- Story generation: with AI env vars set, send a valid `POST /api/stories/generate` request and confirm it returns a generated story JSON payload.

Harness for the new book pipeline:

```sh
pnpm --filter @workspace/scripts run book:harness
```

That command posts a sample parent request to `POST /api/books`, prints the final `bookId`, and writes the response to `artifacts/book-runs/<timestamp>/book.json` and `book.md`.
It also writes `book.html`, which shows the cover and the page text together in a browser-friendly layout. Open that file in your browser if you want the closest thing to a book preview; most browsers can print it to PDF.

If you want to send your own input directly with `curl`, use:

```sh
curl -sS http://localhost:8080/api/books \
  -H 'Content-Type: application/json' \
  -d '{"mode":"behavior","prompt":"My child is learning to share.","character":{"name":"Ava","photoUri":"file:///parent/uploads/ava.jpg"},"supportingCharacters":[{"name":"Leo","relationship":"little brother"}]}'
```

The response includes a `bookId`. Use it to fetch the saved book:

```sh
curl -sS http://localhost:8080/api/books/<bookId>
curl -sS http://localhost:8080/api/books/<bookId>/pages
curl -sS http://localhost:8080/api/books/<bookId>/events
```

To watch live API logs in a second terminal, start the API server with:

```sh
pnpm run dev:api | tee /tmp/kahani-api.log
```

Then follow the log file while the harness runs:

```sh
tail -f /tmp/kahani-api.log
```

If you want to watch just the book-specific event stream, poll:

```sh
curl -sS http://localhost:8080/api/books/<bookId>/events
```

To test the single-sheet slicing idea from an attachment like the one you sent, run:

```sh
pnpm --filter @workspace/scripts run slice:sheet -- "/Users/varindernagra/Downloads/ChatGPT Image Apr 23, 2026, 03_11_54 PM.png"
```

That assumes a 3x4 grid of 12 pages. The script writes 12 cropped page images plus a `manifest.json` into a sibling `*-slices` folder. Adjust `--rows`, `--cols`, and `--inset` if the image layout changes.

To turn the face contact sheet into reusable test assets, run:

```sh
pnpm --filter @workspace/scripts run faces:test-data -- "/Users/varindernagra/Downloads/ChatGPT Image Apr 23, 2026, 10_18_36 PM.png"
```

That slices the sheet into `men/`, `women/`, and `kids/` folders, writes 45 cropped portraits, and exports `manifest.json` plus `role-combinations.json` so you can quickly pick dad / mom / kid / sibling / friend combinations in tests.

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
