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

Most commands are run by setting environment variables inline. For local development, these are the important ones:

```sh
# Required by the API server process.
PORT=8080

# Required for Drizzle database commands and any code that imports lib/db.
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/kahani

# Required only for AI story generation.
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=your-api-key

# Required only for Clerk auth flows.
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

The mockup sandbox also requires:

```sh
PORT=8081
BASE_PATH=/
```

The Expo mobile `dev` script is currently Replit-oriented and expects Replit domain variables. For plain local Expo work, use the manual command shown below.

## Run The API Server

```sh
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Then smoke test it:

```sh
curl http://localhost:8080/api/healthz
```

Expected response:

```json
{"status":"ok"}
```

Story generation is available at `POST /api/stories/generate`, but it requires `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`.

## Run The Mockup Sandbox

```sh
PORT=8081 BASE_PATH=/ pnpm --filter @workspace/mockup-sandbox run dev
```

Open `http://localhost:8081/`.

## Run The Mobile App Locally

For the Replit-style script:

```sh
PORT=18115 pnpm --filter @workspace/mobile run dev
```

For a normal local Expo session, this is usually easier:

```sh
pnpm --filter @workspace/mobile exec expo start --localhost
```

If you need Clerk auth in the mobile app, set `CLERK_PUBLISHABLE_KEY` before starting Expo. The app maps that value to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the Replit-oriented `dev` script.

## Database Tasks

Push the Drizzle schema to a development database:

```sh
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/kahani pnpm --filter @workspace/db run push
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

## Useful Workspace Commands

```sh
# Full typecheck across libraries, artifacts, and scripts.
pnpm run typecheck

# Typecheck, then build all packages with build scripts.
pnpm run build

# Regenerate OpenAPI-derived clients and schemas.
pnpm --filter @workspace/api-spec run codegen
```
