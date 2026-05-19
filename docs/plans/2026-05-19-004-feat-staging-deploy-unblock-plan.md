---
title: feat: Staging deploy unblock
type: feat
status: active
date: 2026-05-19
origin:
  - docs/staging/readiness-handoff.md
  - docs/staging/smoke-test-checklist.md
  - docs/plans/2026-05-19-003-feat-staging-parallel-readiness-plan.md
---

# feat: Staging deploy unblock

## Summary

This plan turns the current staging-prep state into a first locked staging deploy and smoke run. It focuses on landing the local staging docs/env-template work, verifying Render build/start configuration, pushing the schema to the staging Postgres database, deploying the API, and running the synthetic smoke checklist.

---

## Problem Frame

The provider/dashboard setup is now mostly complete: Render staging resources exist, Clerk and OpenRouter staging keys exist, Sentry DSNs exist, AWS S3/KMS staging resources exist, and local `.env` has staging values. What remains is the execution path from local branch to a deployed, healthy staging API plus evidence from the smoke checklist.

---

## Requirements

- R1. Land the staging-readiness docs and env-template changes without committing local secrets or unrelated untracked files.
- R2. Verify the staging deploy path uses the API server build/start commands and the Render staging env group.
- R3. Verify the staging Postgres schema is pushed and reachable without repointing local `DATABASE_URL` away from local Postgres.
- R4. Use focused deploy gates for API/mobile staging readiness and explicitly separate unrelated mockup-sandbox typecheck noise.
- R5. Deploy the API to `app-kahani-staging` and verify `/api/healthz`.
- R6. Run the synthetic staging smoke checklist and record evidence without real family data.
- R7. Keep public signup blocked after staging smoke until production-hardening blockers remain closed separately.

**Origin actors:** Kahani operator, infrastructure provider, AI provider, parent tester
**Origin flows:** Staging deploy, synthetic story generation with consent and guardrails, provider payload privacy check, staging incident/debug review
**Origin acceptance examples:** healthy staging API, prompt-injection block before provider work, consent-required block, no external family-photo processing, metadata-first logs

---

## Scope Boundaries

- This plan targets a locked synthetic staging deploy, not production launch.
- This plan does not implement private asset storage, KMS encryption, durable workers, account deletion, output safety, or public signup controls.
- This plan does not put real secret values in git.
- This plan does not require fixing the mockup sandbox unless the chosen staging gate insists on full workspace typecheck.
- This plan does not run real-family or production-data tests in staging.

### Deferred to Follow-Up Work

- Render Blueprint (`render.yaml`) can be added after the first dashboard-backed staging deploy if the current Render resources were created manually and need to be codified carefully.
- Full public-signup hardening remains in `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`.
- Root workspace typecheck can be made fully green by fixing mockup sandbox React ref typing, but focused API/mobile staging checks are enough for the first API staging deploy.

---

## Context & Research

### Relevant Code and Patterns

- Root scripts in `package.json` include `db:push`, `typecheck`, and `build`.
- API scripts in `artifacts/api-server/package.json` are `build` and `start`; the API build currently succeeds with `pnpm --filter @workspace/api-server run build`.
- `lib/db/drizzle.config.ts` reads `DATABASE_URL`, so staging schema push needs an execution wrapper or documented one-off env override using local `STAGING_DATABASE_URL`.
- `docs/staging/readiness-handoff.md` defines staging entry criteria, deployment handoff, smoke exit criteria, invalid staging result conditions, and the smoke summary template.
- `docs/staging/smoke-test-checklist.md` defines the actual synthetic smoke steps.
- Current full workspace typecheck fails in `artifacts/mockup-sandbox/src/components/ui/calendar.tsx` and `artifacts/mockup-sandbox/src/components/ui/spinner.tsx`; API and mobile typechecks completed successfully in the last check, and API build completed successfully.

### Institutional Learnings

- Render is the preferred staging baseline for this repo because the backend is an Express API with server-side generation work and managed Postgres needs.
- Focused API/mobile checks are more trustworthy for staging work than workspace-wide checks when unrelated `artifacts/mockup-sandbox` type errors are present.
- Prior production-readiness work used focused verification: API typecheck/build, DB/package checks, and runtime smoke tests for `/api/healthz` and blocked generation behavior.

### External References

- Render Node Express docs: `https://render.com/docs/deploy-node-express-app`
- Render default env vars: `https://render.com/docs/environment-variables`
- Render Blueprint YAML reference: `https://render.com/docs/blueprint-spec`

---

## Key Technical Decisions

- Use a dashboard-backed Render deploy for the first staging smoke, because Render resources and env group already exist and no `render.yaml` is currently checked in.
- Treat focused API/mobile verification as the staging gate; record the mockup sandbox root typecheck failure separately so it does not block API staging.
- Keep local `DATABASE_URL` pointed at local Postgres and use `STAGING_DATABASE_URL` only as the source for a staging schema push.
- Commit and push only staging docs and `.env.example`; leave `.env`, Playwright logs, and screenshots untracked.
- Run staging smoke with synthetic fixtures only and record evidence in the handoff template rather than chat-only notes.

---

## Open Questions

### Resolved During Planning

- Does staging require all production-hardening work? No. A locked synthetic staging deploy can happen before public-signup hardening is complete.
- Does root workspace typecheck failure block API staging? No, not if the failure is limited to unrelated mockup sandbox UI files and focused API/mobile checks pass.
- Should production data be copied to staging? No. Staging is synthetic-only.

### Deferred to Implementation

- Exact Render dashboard build/start command values: verify from the current service settings before deploy.
- Exact staging API URL: capture from Render after deploy.
- Exact staging schema push result: verify against the live staging database before smoke testing.
- Whether to fix mockup sandbox ref typing now: only if the team wants root workspace typecheck green before staging.

---

## Implementation Units

### U1. Land Staging Readiness Work

**Goal:** Commit and push the staging-readiness docs and `.env.example` changes so Render and reviewers can consume them from git.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `.env.example`
- Create: `docs/plans/2026-05-19-003-feat-staging-parallel-readiness-plan.md`
- Create: `docs/staging/provider-decisions.md`
- Create: `docs/staging/secrets-matrix.md`
- Create: `docs/staging/synthetic-fixtures.md`
- Create: `docs/staging/smoke-test-checklist.md`
- Create: `docs/staging/launch-limits.md`
- Create: `docs/staging/readiness-handoff.md`

**Approach:**
- Stage only the planned docs and `.env.example`.
- Exclude local `.env`, Playwright logs, screenshots, and other unrelated untracked files.
- Run a secret-pattern review before commit so no credentials, DSNs, or database URLs are committed.

**Patterns to follow:**
- Existing staging docs under `docs/staging/`
- Existing local-secret boundary where `.env` stays untracked

**Test scenarios:**
- Error path: a staged file contains an AWS secret, OpenRouter key, Clerk secret, Sentry DSN value, or staging Postgres URL -> remove the value before commit.
- Edge case: unrelated untracked screenshots or Playwright logs exist -> they remain uncommitted.

**Verification:**
- Git branch has a commit containing only staging docs and `.env.example`.
- Remote branch is pushed and available for Render/manual review.

---

### U2. Verify Render Service Configuration

**Goal:** Confirm `app-kahani-staging` builds and starts the API server from the correct branch and uses `app-kahani-staging-env`.

**Requirements:** R2, R5

**Dependencies:** U1

**Files:**
- Modify: `docs/staging/readiness-handoff.md`

**Approach:**
- Verify the Render service is linked to the intended repository and branch.
- Verify build and start commands target `@workspace/api-server`, not the mobile app or mockup sandbox.
- Verify the service is attached to `app-kahani-staging-env`.
- Record the confirmed build/start/branch/env-group values in the readiness handoff without adding secret values.

**Patterns to follow:**
- API package scripts in `artifacts/api-server/package.json`
- Render Node Express guidance that custom apps should use their own build/start commands

**Test scenarios:**
- Error path: Render build command runs root `pnpm run build` and fails on mockup sandbox -> switch to focused API build for staging.
- Error path: Render start command points at the wrong package or file -> update to API server start.
- Error path: service is not attached to `app-kahani-staging-env` -> attach env group before deploy.

**Verification:**
- Render service settings show the expected branch, env group, build command, and start command.
- Readiness handoff captures these settings without secrets.

---

### U3. Push And Verify Staging Database Schema

**Goal:** Apply the current Drizzle schema to `app-kahani-staging-postgres` and verify the API can reach it.

**Requirements:** R3, R5

**Dependencies:** U1

**Files:**
- Modify: `docs/staging/readiness-handoff.md`
- Modify: `docs/staging/smoke-test-checklist.md`

**Approach:**
- Use local `STAGING_DATABASE_URL` as the source for staging schema work while preserving local `DATABASE_URL`.
- Push the Drizzle schema to staging Postgres through the existing DB package path.
- Record the schema-push evidence and any destructive-operation warnings.
- Add a smoke preflight evidence field for staging schema state if missing.

**Patterns to follow:**
- `lib/db/drizzle.config.ts` expects `DATABASE_URL`.
- Root `db:push` delegates to the DB package.

**Test scenarios:**
- Error path: `STAGING_DATABASE_URL` is missing locally -> block schema push rather than using local `DATABASE_URL` accidentally.
- Error path: schema push prompts for destructive changes -> stop and review before applying.
- Integration: API health and any DB-backed smoke endpoint can connect after schema push.

**Verification:**
- Staging DB has the expected schema.
- Local `.env` still points `DATABASE_URL` at local Postgres.
- Readiness handoff records staging schema evidence.

---

### U4. Define Focused Staging Verification Gate

**Goal:** Make the staging deploy gate explicit so unrelated mockup sandbox typecheck failures do not block API staging, while still keeping root typecheck debt visible.

**Requirements:** R4

**Dependencies:** U1

**Files:**
- Modify: `docs/staging/readiness-handoff.md`
- Modify: `docs/staging/smoke-test-checklist.md`

**Approach:**
- Define focused staging gates as API typecheck, API build, mobile typecheck, and API health smoke.
- Record root workspace typecheck status separately.
- If full workspace green is required by policy, route mockup sandbox errors into a separate fix before deploy; otherwise proceed with focused staging gates.

**Patterns to follow:**
- Prior repo learning that mockup sandbox React ref errors are unrelated to API/mobile staging checks
- Existing focused package scripts for API and mobile

**Test scenarios:**
- Happy path: API typecheck/build and mobile typecheck pass while root typecheck fails only in mockup sandbox -> staging may proceed with documented exception.
- Error path: API typecheck or API build fails -> staging deploy is blocked.
- Error path: mobile typecheck fails and staging includes mobile web/native smoke -> staging smoke is blocked until fixed.

**Verification:**
- Readiness docs distinguish focused deploy blockers from unrelated workspace debt.
- Staging decision is auditable from recorded verification outputs.

---

### U5. Deploy Staging API And Verify Health

**Goal:** Deploy the pushed branch to Render and verify the staging API is alive before running deeper smoke tests.

**Requirements:** R2, R5

**Dependencies:** U1, U2, U3, U4

**Files:**
- Modify: `docs/staging/readiness-handoff.md`

**Approach:**
- Trigger a Render deploy from the pushed branch or commit.
- Confirm build succeeds and runtime starts.
- Capture the staging API URL from Render.
- Verify `/api/healthz`.
- Record deploy commit, URL, and health result in the handoff summary.

**Patterns to follow:**
- API health route under `artifacts/api-server/src/routes/health.ts`
- Render deploy behavior: failed builds should leave the previous live version running

**Test scenarios:**
- Happy path: deploy succeeds and `/api/healthz` returns healthy status.
- Error path: build fails because of wrong install/build command -> fix Render command and redeploy.
- Error path: runtime fails due to missing env var -> update Render env group and redeploy.
- Error path: health endpoint fails after deploy -> inspect Render logs and block smoke testing.

**Verification:**
- Staging API URL responds to `/api/healthz`.
- Readiness handoff records branch/commit, URL, deploy result, and health evidence.

---

### U6. Run Synthetic Staging Smoke

**Goal:** Run the documented smoke checklist with synthetic fixtures and capture pass/fail evidence.

**Requirements:** R6, R7

**Dependencies:** U5

**Files:**
- Modify: `docs/staging/readiness-handoff.md`
- Modify: `docs/staging/smoke-test-checklist.md`

**Approach:**
- Use only `docs/staging/synthetic-fixtures.md` data.
- Exercise health, auth, consent, allowed generation, guardrail blocks, provider-payload privacy, reader/library behavior, and redacted logging checks where supported by current staging code.
- Mark unsupported production-hardening checks as blocked or not applicable rather than pretending they passed.
- Keep public signup status explicitly blocked after smoke.

**Patterns to follow:**
- `docs/staging/synthetic-fixtures.md`
- `docs/staging/smoke-test-checklist.md`
- `docs/staging/launch-limits.md`

**Test scenarios:**
- Happy path: synthetic allowed prompt starts and completes generation, or fails safely with redacted error.
- Error path: prompt-injection fixture is blocked before provider work.
- Error path: missing/stale consent fixture is blocked where consent enforcement is active.
- Integration: provider-call evidence contains no family photo URI, data URL, file path, blob URL, or real family photo reference.
- Integration: logs/Sentry event summaries do not expose raw prompts, photos, child names, or generated image content.

**Verification:**
- Smoke checklist contains pass/fail/blocked results and evidence references.
- Handoff summary records remaining blockers.
- Public signup remains marked blocked.

---

## System-Wide Impact

- **Interaction graph:** Git branch, Render service, Render env group, staging Postgres, Clerk staging app, OpenRouter staging key, AWS S3/KMS staging resources, Sentry, and mobile/API smoke surfaces all need to align.
- **Error propagation:** Build/config/schema failures should stop before smoke testing; smoke failures should record evidence and keep public signup blocked.
- **State lifecycle risks:** Staging schema pushes must not target local or production databases by accident.
- **API surface parity:** API spec/client changes are not expected in this plan, but codegen alignment remains an entry gate if API files changed.
- **Integration coverage:** The important evidence is cross-system: deployed API health, auth, generation, provider privacy, and logs.
- **Unchanged invariants:** Staging can proceed before public launch hardening, but public signup remains blocked until the production-hardening plan is complete.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Staging deploy uses root build and fails on mockup sandbox | Use focused API build/start settings for the Render API service. |
| Staging schema push targets the wrong database | Require `STAGING_DATABASE_URL` and record that local `DATABASE_URL` remains local. |
| Secrets leak into git during staging handoff | Stage only docs/env-template, run secret-pattern review, and never commit `.env`. |
| Staging smoke uses real family data | Use synthetic fixtures only; invalidate any run using real data. |
| Passing staging is mistaken for public launch | Keep public signup blocked in every handoff summary. |
| Dashboard-only Render config drifts | Record confirmed dashboard values now; codify `render.yaml` later if needed. |

---

## Operational Notes

- Current deploy target: `app-kahani-staging`.
- Current staging DB: `app-kahani-staging-postgres`.
- Current env group: `app-kahani-staging-env`.
- Current storage/KMS staging resources: `app-kahani-staging-assets-482311061919-us-east-2` and `alias/app-kahani-staging-assets`.
- Current observability provider: Sentry backend/mobile DSNs with `SENTRY_ENVIRONMENT=staging`.
- Do not treat AWS S3/KMS availability as proof that private asset/encryption code exists; those remain production-hardening implementation work.

---

## Sources & References

- Staging readiness: `docs/staging/readiness-handoff.md`
- Staging smoke: `docs/staging/smoke-test-checklist.md`
- Staging providers: `docs/staging/provider-decisions.md`
- Staging secrets: `docs/staging/secrets-matrix.md`
- Staging fixtures: `docs/staging/synthetic-fixtures.md`
- Related staging-prep plan: `docs/plans/2026-05-19-003-feat-staging-parallel-readiness-plan.md`
- Production-hardening plan: `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`
- Render Node Express docs: `https://render.com/docs/deploy-node-express-app`
- Render environment variables docs: `https://render.com/docs/environment-variables`
- Render Blueprint YAML reference: `https://render.com/docs/blueprint-spec`
