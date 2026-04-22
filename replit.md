# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The workspace now includes Parent Story Studio, an Expo mobile app for parents to sign in with Google, Facebook, or Apple, create child characters with names/photos, generate AI-backed behavior-support or random stories, and save stories to a local library.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile app**: Expo Router + Clerk authentication + AsyncStorage
- **AI story generation**: Shared API server endpoint using Replit-provided OpenAI access

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/mobile run dev` — run the Parent Story Studio mobile app

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
