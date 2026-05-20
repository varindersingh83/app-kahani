# Staging Secrets Matrix

Date: 2026-05-19

This matrix tracks staging environment variables and ownership. Do not put real secret values in this file.

## Status Legend

- `needed`: required before staging deploy or smoke test.
- `optional`: useful but not required for the first locked staging smoke.
- `future`: required for later production-hardening units.

## Core Runtime

| Variable | Status | Owner | Source system | Secret? | Staging use | Production counterpart |
|---|---:|---|---|---:|---|---|
| `NODE_ENV` | needed | Engineering | Render service env | no | Set to `production` for staging-like fail-closed checks when ready | yes |
| `PORT` | needed | Render | Render service env | no | API bind port | yes |
| `LOG_LEVEL` | needed | Engineering | Render service env | no | `info` for staging, `debug` only during controlled investigation | yes |
| `DATABASE_URL` | needed | Founder/operator | Render Postgres internal URL | yes | Render staging uses the internal URL from `app-kahani-staging-postgres` via `app-kahani-staging-env` | yes |
| `STAGING_DATABASE_URL` | needed | Founder/operator | Render Postgres internal URL | yes | Local-only pointer at staging DB while local `DATABASE_URL` stays on local Postgres | no |
| `EXPO_PUBLIC_API_BASE_URL` | needed | Engineering | Render API URL | no | Mobile app points at staging API | yes |

## Auth

| Variable | Status | Owner | Source system | Secret? | Staging use | Production counterpart |
|---|---:|---|---|---:|---|---|
| `CLERK_PUBLISHABLE_KEY` | needed | Founder/operator | Clerk staging app | no | Staging mobile/API auth | yes |
| `CLERK_SECRET_KEY` | needed | Founder/operator | Clerk staging app | yes | API auth verification | yes |
| `CLERK_PROXY_URL` | optional | Engineering | Clerk / deployment config | no | Only if proxying Clerk through API | maybe |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | needed | Founder/operator | Clerk staging app | no | Mobile public Clerk key when build system does not map it | yes |

## AI Providers

| Variable | Status | Owner | Source system | Secret? | Staging use | Production counterpart |
|---|---:|---|---|---:|---|---|
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` | needed | Engineering | OpenRouter | no | OpenAI-compatible base URL | yes |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | needed | Founder/operator | OpenRouter staging key | yes | Capped staging provider key | yes |
| `AI_INTEGRATIONS_OPENROUTER_MODEL` | needed | Product/engineering | OpenRouter model choice | no | Text/story model | yes |
| `AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL` | needed | Product/engineering | OpenRouter model choice | no | Image/storyboard model | yes |
| `OPENROUTER_SITE_URL` | optional | Engineering | Staging URL | no | Provider attribution | yes |
| `OPENROUTER_APP_TITLE` | optional | Product | App metadata | no | Provider attribution | yes |

## Production-Hardening Variables

These are not all consumed by the current code yet. They reserve the staging/prod env surface expected by the production-hardening plan.

| Variable | Status | Owner | Source system | Secret? | Staging use | Production counterpart |
|---|---:|---|---|---:|---|---|
| `PRIVATE_ASSET_STORAGE_PROVIDER` | future | Engineering | AWS | no | `aws-s3` for staging private assets | yes |
| `PRIVATE_ASSET_BUCKET` | future | Founder/operator | AWS S3 | no | Staging private bucket name | yes |
| `PRIVATE_ASSET_REGION` | future | Founder/operator | AWS S3 | no | Staging bucket region | yes |
| `PRIVATE_ASSET_ACCESS_KEY_ID` | future | Founder/operator | AWS IAM | yes | Staging-only S3/KMS auth | yes |
| `PRIVATE_ASSET_SECRET_ACCESS_KEY` | future | Founder/operator | AWS IAM | yes | Staging-only S3/KMS auth | yes |
| `KMS_PROVIDER` | future | Engineering | AWS | no | `aws-kms` for staging encryption boundary | yes |
| `KMS_KEY_ID` | future | Founder/operator | AWS KMS | yes | Staging KMS alias/key identifier | yes |
| `KMS_REGION` | future | Founder/operator | AWS KMS | no | Staging KMS region | yes |
| `ANALYTICS_PROVIDER` | optional | Product/engineering | Provider decision | no | Metadata-only analytics adapter or disabled | yes |
| `ANALYTICS_WRITE_KEY` | optional | Founder/operator | Analytics provider | yes | Staging analytics key if enabled | yes |
| `ALERT_WEBHOOK_URL` | future | Founder/operator | Alerting provider | yes | Critical alert destination | yes |
| `SENTRY_BACKEND_DSN` | needed | Founder/operator | Sentry | yes | Backend error capture for staging | yes |
| `SENTRY_MOBILE_DSN` | needed | Founder/operator | Sentry | yes | Mobile error capture for staging | yes |
| `EXPO_PUBLIC_SENTRY_DSN` | needed | Founder/operator | Sentry | no | Public mobile DSN when Expo needs public env naming | yes |
| `SENTRY_ENVIRONMENT` | needed | Engineering | Runtime env | no | Set to `staging` for staging services/builds | yes |
| `GENERATION_DAILY_GLOBAL_LIMIT` | future | Product/engineering | Launch limits | no | Staging/beta generation cap | yes |
| `GENERATION_DAILY_USER_LIMIT` | future | Product/engineering | Launch limits | no | Per-user generation cap | yes |
| `GENERATION_MONTHLY_SPEND_LIMIT_USD` | future | Product/engineering | Launch limits | no | Provider spend cap | yes |
| `SIGNUP_ENABLED` | future | Founder/operator | Runtime env | no | Fast signup shutdown | yes |
| `GENERATION_ENABLED` | future | Founder/operator | Runtime env | no | Fast generation shutdown | yes |
| `REQUIRED_CONSENT_VERSION` | future | Product/legal | Consent copy version | no | Consent enforcement | yes |

## Review Rules

- Every `needed` variable must have an owner and source before staging deploy.
- Every secret must be entered directly in the provider dashboard or secret manager, not committed.
- Staging and production values must be separate.
- Capped OpenRouter credentials are required before running provider-backed staging smoke tests.
- Local `.env` may contain `STAGING_DATABASE_URL` and staging secrets, but committed docs and `.env.example` must not contain secret values.
