# Staging Provider Decisions

Date: 2026-05-19

This document records provisional staging-provider choices for Kahani. It is intentionally decision-oriented: no secrets, no production data, and no real family data belong here.

## Status Legend

- `selected`: use for staging now.
- `provisional`: usable for staging, but still needs vendor/security review before production.
- `blocked`: cannot be used until the listed blocker is resolved.

## Decisions

| Surface | Provider | Status | Owner | Region / residency posture | Staging notes | Production caveat |
|---|---|---:|---|---|---|---|
| App hosting | Render | selected | Founder/operator | Prefer US region for API, worker, and database | Staging app: `app-kahani-staging`; env group: `app-kahani-staging-env` | Production needs separate services/env group and backup/restore drill |
| Database | Render Postgres | selected | Founder/operator | US region where available | Staging DB: `app-kahani-staging-postgres`; Render env group uses the internal Postgres URL as `DATABASE_URL` | Production requires paid backup/PITR posture and restore drill |
| Auth | Clerk staging app | selected | Founder/operator | Configure staging app separately from production | Use staging OAuth/social-login credentials | Production must be parent-only, social login only, with Apple sign-in for iOS |
| Text and image AI | OpenRouter | selected | Founder/operator | Use staging key with strict spend cap | Use separate staging key and low provider limits | Vendor allowlist must confirm no training/fine-tuning on production user data |
| Private object storage | AWS S3 | selected | Founder/operator | `us-east-2`; private bucket, public access blocked | Staging bucket: `app-kahani-staging-assets-482311061919-us-east-2`; staging-only IAM user | Production needs private keys, short-lived access, deletion support, and auditability |
| KMS / managed keys | AWS KMS | selected | Founder/operator | `us-east-2`; staging-only key alias | Staging alias: `alias/app-kahani-staging-assets` | Production needs key rotation, recovery plan, audit trail, and fail-closed config |
| Observability and alerts | Sentry | selected | Founder/operator | Avoid sending raw prompt/photo/content payloads | Backend and mobile staging DSNs are configured locally; use `SENTRY_ENVIRONMENT=staging` | Production needs redaction, retention, alert routing, and founder-only critical alerts |
| Product analytics | TBD metadata-only analytics provider or disabled | provisional | Founder/operator | No names, prompts, traits, photos, generated images, or child IDs | Safe default is disabled until allowlist/redaction exists | Production analytics must be anonymous install metadata only |

## Required Follow-Ups

- Keep Render staging resources separate from production: `app-kahani-staging`, `app-kahani-staging-postgres`, and `app-kahani-staging-env`.
- Keep the staging-only Clerk app and OAuth/social-login credentials separate from production.
- Keep the OpenRouter staging key capped before any staging generation smoke test.
- Wire the AWS S3/KMS staging env vars into the private-asset and encryption adapters when those code paths are implemented.
- Configure Sentry redaction before using it for production incident debugging.

## Hard Rules

- Staging cannot use production data.
- Staging cannot use real child or family photos.
- Staging provider payloads must not include `photoUri`, data URLs, file paths, blob URLs, or provider-fetchable family-photo references.
- Passing staging smoke does not mean public signup is ready.
