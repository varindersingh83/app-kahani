# Staging Readiness Handoff

Date: 2026-05-19

This is the shared handoff between conflict resolution, staging setup, smoke testing, and public-signup readiness. Passing this handoff means staging can be exercised with synthetic data; it does not mean Kahani is ready for public signup.

## Entry Criteria For Staging Deploy

| Gate | Required state | Evidence |
|---|---|---|
| Branch state | No unresolved conflicts | Git status summary |
| Generated clients | API spec, generated React client, and generated Zod schemas are aligned if API changed | Codegen/typecheck output |
| Typecheck/build | Agreed typecheck and build gates pass | Build output or CI link |
| Staging providers | Provider decisions are recorded | `docs/staging/provider-decisions.md` |
| Staging secrets | All `needed` env vars have owners and are entered in Render/Clerk/provider dashboards | `docs/staging/secrets-matrix.md` plus dashboard review |
| Provider caps | OpenRouter staging key has low cap | Provider dashboard review without secret values |
| Synthetic data | Testers use only approved synthetic fixtures | `docs/staging/synthetic-fixtures.md` |

## Deployment Handoff

| Surface | Expected staging setup | Owner |
|---|---|---|
| API service | Render web service `app-kahani-staging` pointing at staging env group `app-kahani-staging-env` | Engineering/founder |
| Worker service | Render background worker when worker entrypoint exists | Engineering/founder |
| Database | Render Postgres `app-kahani-staging-postgres`, synthetic data only | Founder/operator |
| Auth | Clerk staging app and staging OAuth/social-login config | Founder/operator |
| Mobile public API URL | `EXPO_PUBLIC_API_BASE_URL` points at Render staging API | Engineering |
| AI provider | OpenRouter staging key and staging model choices | Founder/operator |
| Storage/KMS | AWS S3 bucket `app-kahani-staging-assets-482311061919-us-east-2` and KMS alias `alias/app-kahani-staging-assets` | Founder/operator |
| Alerts | Sentry backend/mobile DSNs configured for staging | Founder/operator |

## Smoke Exit Criteria

| Gate | Required state | Evidence |
|---|---|---|
| Health | API health endpoint responds | Response summary |
| Auth | Staging sign-in works with staging Clerk app | Screenshot/tester note |
| Consent | Missing/stale consent blocks generation where supported | Response summary |
| Guardrails | Injection and urgent-risk fixtures block before provider work | Response and provider-call absence evidence |
| Generation | Allowed synthetic prompt completes or fails safely | Job/result summary |
| Provider payload privacy | No family-photo URI/data/path/blob/photo reference reaches provider payload | Redacted payload summary |
| Reader/library | Generated story opens in reader and follows current saved-library behavior | Screenshot/tester note |
| Logs | Logs remain metadata-first and redacted | Log summary without sensitive content |
| Controls | Signup/generation shutdown owners are named | `docs/staging/launch-limits.md` |

## Public Signup Remains Blocked By

- private generated asset storage and authenticated short-lived access
- KMS/app-level encryption boundary for sensitive fields/assets
- account deletion workflow and retryable deletion state
- durable Postgres-backed worker with idempotency, retry limits, stuck-job detection, and cost controls
- output safety gates, quarantine, redacted failed-job artifacts, and alerts
- Terms, Privacy Policy, vendor allowlist, and internal security review
- tested backup/restore drill for production database posture

## Invalid Staging Result Conditions

Discard the smoke result and rerun if:

- any real family data was used
- staging used production credentials or production database data
- provider caps were missing
- a guardrail-blocked prompt reached provider work
- a family-photo reference reached provider payloads
- logs exposed raw prompts, photos, child names, or generated image content

## Handoff Summary Template

Use this format after each staging smoke run:

```text
Branch/commit:
Staging API URL:
Staging mobile surface:
Database:
Provider key type: staging capped / other
Storage/KMS: AWS staging / other
Observability: Sentry staging / other
Fixture IDs used:
Smoke result: pass / fail / blocked
Failed checks:
Evidence location:
Public signup status: blocked
Remaining blockers:
```
