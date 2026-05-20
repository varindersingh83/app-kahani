# Staging Smoke Test Checklist

Date: 2026-05-19

Run this checklist only after the branch has no conflicts, typecheck/build pass, staging secrets are present, and provider credentials are capped. Use synthetic fixtures only.

## Result Legend

- `Pass`: expected behavior confirmed with evidence.
- `Fail`: expected behavior not confirmed.
- `Blocked`: cannot run because a prerequisite is missing.
- `N/A`: intentionally not applicable to this staging slice.

## Preflight

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Clean branch | Inspect git status and unresolved files | No unresolved conflicts; no accidental unrelated changes | Git status summary | |
| Build gate | Run the agreed typecheck/build gate | Gate passes before deploy | Render build succeeded with `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` | Pass |
| Focused staging gate | Verify API typecheck, API build, and mobile typecheck | All focused checks pass; root workspace failures are documented separately if unrelated | API typecheck passed; mobile typecheck passed; API build passed | Pass |
| Root typecheck debt | Run or review root workspace typecheck if required by policy | Known mockup sandbox React ref errors are either fixed or accepted as non-blocking for API staging | Known non-blocking debt in mockup sandbox React ref typing | N/A |
| Staging DB schema | Verify current schema is applied to staging Postgres | Schema push completed using external staging DB URL or from inside Render | External `STAGING_DATABASE_URL` with `sslmode=require`; schema push completed with `Changes applied` | Pass |
| Staging env | Compare Render env against `docs/staging/secrets-matrix.md` | All `needed` values present; no production credentials | Screenshot or env review note without values | |
| Provider caps | Inspect OpenRouter staging key | Low staging spend cap is set | Provider dashboard note without key value | |
| Sentry config | Inspect staging env names only | Backend/mobile DSNs exist and `SENTRY_ENVIRONMENT` is `staging` | Env review note without DSN values | |
| AWS private assets | Inspect staging env names only | S3 bucket, region, access key ID, KMS provider, KMS region, and key alias/id are present | Env review note without secret values | |
| Synthetic data | Confirm tester uses `docs/staging/synthetic-fixtures.md` | No real family data used | Fixture IDs used | |

## API And Auth

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Health endpoint | Open staging `/api/healthz` | Returns healthy status | `GET https://app-kahani-staging.onrender.com/api/healthz` -> `{"status":"ok"}` | Pass |
| Staging sign-in | Create short-lived Clerk session for `kahani-staging-tester-01@example.com` | Parent can access staging API | Authenticated consent/guardrail API calls reached route logic | Pass |
| Unauthenticated generation | Call generation route without auth in staging-like config | Request is rejected before generation | `POST /api/stories/generate` returned 401 `Sign in is required.` | Pass |

## Consent

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Consent missing | Use `consent-missing` fixture | Generation blocked with consent-required behavior | Authenticated `POST /api/stories/generate` returned 403 `external_text_ai_consent_required` | Pass |
| Consent accepted | Use `consent-accepted` fixture | Generation can proceed if guardrails pass | Job/result evidence | |
| Consent stale | Use `consent-stale` if supported | Current consent is required | Response status/body summary | |

## Behavior Taxonomy Chat

Use `docs/staging/behavior-taxonomy-smoke-fixtures.md`.

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Clear classification | Submit `bedtime-separation` or `bedtime-transition` | Request classifies without asking the parent to choose a category | Response/body summary | |
| One clarification | Submit `vague-bedtime` | Returns one clarification question and no story job starts | Response/body summary | |
| Clarification answer | Answer the vague bedtime question with a specific visible behavior | Classified story job can start after consent | Response/body summary | |
| Primary issue auto-pick | Submit `multi-issue-bedtime` | Primary focus uses the most intense visible behavior; secondary issues do not become story goals | Response/body summary | |
| Developmental red flag | Submit `developmental-red-flag` | Blocked with professional-support guidance before provider work | Response/body summary | |
| Medical red flag | Submit `medical-red-flag` | Blocked with professional-support guidance before provider work | Response/body summary | |

## Character Creation

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Generic child | Create Riley from fixture pack | Character saves without a real photo | Screenshot or API/local state note | |
| Photo picker gate | Inspect staging Add Character flow | Production/staging photo upload is hidden or explicitly disabled until local extraction is validated | Screenshot | |
| No hidden photo data | Inspect generated request or app state where available | No `photoUri` or raw photo field is sent for generic character | Network/log evidence | |

## Generation And Reader

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Allowed story | Submit `allowed-sharing` after consent | Story generation starts and completes, or fails safely with redacted error | Job ID/result summary | |
| Flexible page boundary | Verify 8, 12, and 20 page service fixtures | Reader/story mapping preserves all pages without a 12-page cap | Test output or artifact summary | |
| Reader opens | Open generated story in reader | Pages render without app crash | Screenshot | |
| Library path | Save/open generated story in Library | Story is visible or documented current flow is confirmed | Screenshot | |

## Guardrails

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Prompt injection | Submit `inject-ignore-rules` | Blocked before provider work | Authenticated request returned 400 `input_guardrail_blocked`, category `prompt_injection` | Pass |
| System prompt extraction | Submit `inject-system-prompt` | Blocked before provider work | Authenticated request returned 400 `input_guardrail_blocked`, category `prompt_injection` | Pass |
| Urgent risk | Submit `urgent-medical` | Blocked with parent-safe guidance before provider work | Authenticated request returned 400 `input_guardrail_blocked`, category `high_risk_safety` | Pass |
| Crisis/self-harm | Submit `self-harm-crisis` | Blocked with parent-safe guidance before provider work | Authenticated request returned 400 `input_guardrail_blocked`, category `high_risk_safety` | Pass |

## Provider Payload Privacy

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| No family photos | Inspect provider-call evidence for allowed story | No photo URI, data URL, file path, blob URL, or family-photo URL | Redacted payload field summary | |
| No real names | Inspect provider-call evidence | Uses synthetic/redacted names only | Redacted payload field summary | |
| No raw prompt in logs | Inspect staging logs for failed and successful runs | Logs are metadata-first and do not expose raw prompt text | Log excerpt summary without sensitive content | |

## Operational Controls

| Check | Input / action | Expected result | Evidence | Result |
|---|---|---|---|---|
| Signup shutdown owner | Review `docs/staging/launch-limits.md` | Named owner and control exist | Doc link / owner | |
| Generation shutdown owner | Review `docs/staging/launch-limits.md` | Named owner and control exist | Doc link / owner | |
| Alert route | Trigger or dry-run alert path where available | Alert owner and destination are confirmed | Dry-run note | |
| Sentry redaction | Inspect captured staging event if available | Event contains no raw prompt, photo, child name, or generated image content | Redacted Sentry event summary | |

## Hard Stop Conditions

Stop and do not promote staging if any of these occur:

- real family data is used
- provider credentials are uncapped
- prompt-injection prompts reach provider work
- family-photo references reach provider payloads
- staging uses production database, production Clerk app, or production provider key
- typecheck/build fails
- unresolved conflicts remain
- staging DB schema has not been applied
- Render service branch/build/start/env-group settings have not been verified
