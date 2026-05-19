---
title: feat: Staging parallel readiness
type: feat
status: completed
date: 2026-05-19
origin:
  - docs/brainstorms/production-readiness-requirements.md
  - docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md
---

# feat: Staging parallel readiness

## Summary

This plan defines the work that can happen while merge conflicts are being resolved so Kahani can reach a locked, synthetic-data staging environment faster. It focuses on provider decisions, staging accounts, secrets, synthetic test data, smoke testing, launch limits, and documentation that do not require touching the conflicted application files.

---

## Problem Frame

The current branch has unresolved merge conflicts, so code-level staging work is temporarily blocked. Staging preparation can still advance in parallel if it stays outside conflicted files and produces concrete inputs the engineering pass will need after the branch builds cleanly.

---

## Assumptions

*This plan was authored without a separate confirmation round. The items below are agent inferences that should be reviewed before implementation proceeds.*

- Staging should be Render-first, matching the existing production-readiness direction.
- Staging must use synthetic-only family data and capped provider credentials.
- The merge/conflict resolver owns code correctness, typecheck/build, and focused app/API tests; this plan owns parallel operational readiness.

---

## Requirements

- R1. Prepare staging accounts, services, and environment values without modifying conflicted source files.
- R2. Keep staging synthetic-only: no real child, parent, family, prompt, or photo data.
- R3. Make provider and secret ownership explicit before deployment work starts.
- R4. Define a staging smoke test checklist that verifies auth, consent, guardrails, photo-free provider payloads, generation, library, reader, and redacted logs.
- R5. Define beta launch limits and emergency controls before public signup.
- R6. Keep the plan aligned with the existing production-readiness requirements for private storage, KMS, observability, alerts, quotas, vendor allowlisting, and Render API/worker/Postgres topology.

**Origin actors:** Parent account holder, child subject, Kahani operator, AI provider, infrastructure provider
**Origin flows:** Story generation with consent and safety gates, photo-based personalization without external photo processing, production incident response
**Origin acceptance examples:** Prompt-injection block, text AI consent block, no external family-photo processing, unsafe-output quarantine, private share links, idempotent retry, redacted logs

---

## Scope Boundaries

- This plan does not resolve merge conflicts.
- This plan does not implement private storage, KMS, worker queues, deletion routes, or output safety gates.
- This plan does not deploy public production or enable public signup.
- This plan does not permit production data in staging.
- This plan does not choose a local photo-extraction model or enable production photo picking.

### Deferred to Follow-Up Work

- Code implementation for private storage, KMS, durable workers, output safety, alerts, deletion, and share links remains in the broader production-hardening plan.
- Public signup remains blocked until staging passes smoke tests and the launch controls, legal/privacy surfaces, and production hardening gates are complete.

---

## Context & Research

### Relevant Code and Patterns

- `package.json` contains local scripts for API, mobile, mockup, database push, typecheck, build, and e2e tests.
- `.env.example` contains the current local env surface for Postgres, Clerk, mobile API URL, OpenRouter, and mockup settings.
- `README.md` documents the current API/mobile runbook and existing local verification commands.
- `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md` names Render, private storage, KMS, observability, alerts, and synthetic-only staging as launch-critical surfaces.
- `docs/brainstorms/production-readiness-requirements.md` defines the production safety bar, including no external family-photo processing, private storage, deletion, durable jobs, observability, runbooks, and US-only capped signup.

### Institutional Learnings

- Render is the preferred staging/deployment baseline for this repo because the product has an Express API, server-side generation work, managed Postgres needs, and eventually a worker process.
- Family photos are highly sensitive; staging should verify no `photoUri`, data URL, file path, blob URL, or provider-fetchable photo reference can reach provider payloads.

### External References

- Render Background Workers: `https://render.com/docs/background-workers`
- Render Blueprint YAML Reference: `https://render.com/docs/blueprint-spec`
- Render Environment Variables and Secrets: `https://render.com/docs/configure-environment-variables`
- Render Postgres Backups: `https://render.com/docs/postgresql-backups`

---

## Key Technical Decisions

- Split staging prep from conflict resolution: operational readiness can move now, but deployment waits for a clean build.
- Use capped staging credentials: provider spend limits and low quotas should be in place before the first staging smoke run.
- Treat provider choices as provisional but concrete: the staging plan should pick usable vendors now while keeping app abstractions provider-independent in later implementation.
- Use a secrets matrix as the handoff artifact: every staging env var should have an owner, source, staging value status, and production equivalent status.
- Keep staging data synthetic-only: test families, prompts, and generated outputs must be fake and clearly marked.

---

## Open Questions

### Resolved During Planning

- Can work proceed while conflicts are unresolved? Yes, if it stays in provider setup, staging documentation, synthetic fixtures, and test planning.
- Should staging wait for full production-hardening completion? No. A locked synthetic staging environment can come first, but public signup remains blocked.

### Deferred to Implementation

- Exact Render service names and env group naming: choose when creating the Render project.
- Exact private object storage and KMS vendor values: choose during vendor setup, then record in the secrets matrix.
- Exact observability and analytics provider payload shapes: finalize after provider choice and redaction review.

---

## Implementation Units

### U1. Staging Provider Decision Sheet

**Goal:** Pick provisional staging providers and record the rationale, owner, account URL, region posture, and launch-blocking caveats.

**Requirements:** R1, R3, R6

**Dependencies:** None

**Files:**
- Create: `docs/staging/provider-decisions.md`

**Approach:**
- Record decisions for Render, Postgres, Clerk, OpenRouter, private object storage, KMS/managed keys, observability/alerts, and metadata-only analytics.
- Mark each vendor as `selected`, `provisional`, or `blocked`.
- Capture whether the vendor supports US-region controls, no-training/deletion commitments, auditability, and staging/prod separation.

**Patterns to follow:**
- Vendor and production constraints from `docs/brainstorms/production-readiness-requirements.md`
- Render-first posture from `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`

**Test scenarios:**
- Test expectation: none -- this is an operational decision artifact.

**Verification:**
- Every staging-critical provider has a named owner, status, and next action.
- Any missing vendor decision is visible as a blocker rather than hidden in chat.

---

### U2. Staging Secrets Matrix

**Goal:** Produce a concrete env var matrix for staging so deployment setup can proceed immediately after the branch builds.

**Requirements:** R1, R3, R6

**Dependencies:** U1

**Files:**
- Create: `docs/staging/secrets-matrix.md`
- Modify: `.env.example`

**Approach:**
- List required staging variables for database, Clerk, OpenRouter, mobile public API URL, storage, KMS, analytics, alerts, and production safety toggles.
- For each value, record owner, source system, staging status, rotation notes, and whether a production counterpart will be required.
- Keep real secret values out of the repo.
- Update `.env.example` only with non-secret variable names and comments for production/staging-only values.

**Patterns to follow:**
- Existing local variable naming in `.env.example`
- Production env validation expectations from the follow-on production-hardening plan

**Test scenarios:**
- Error path: matrix includes a required variable without an owner or source system -> reviewer marks the matrix incomplete.
- Error path: `.env.example` contains a real secret-looking value -> reviewer rejects the change.
- Integration: every env var referenced by staging docs appears in the matrix or is explicitly local-only.

**Verification:**
- A deployer can fill Render staging env vars from the matrix without guessing names or ownership.
- No secret values are committed.

---

### U3. Synthetic Staging Fixture Pack

**Goal:** Create approved synthetic characters, prompts, and expected blocked prompts for staging QA.

**Requirements:** R2, R4

**Dependencies:** None

**Files:**
- Create: `docs/staging/synthetic-fixtures.md`

**Approach:**
- Define fake parent and child names, generic characters, behavior prompts, random-story prompts, consent test states, and prompt-injection strings.
- Include explicit non-use guidance: no real family names, real child behavior notes, real photos, real prompts from users, or copied production outputs.
- Include expected result labels for smoke testing: allowed generation, consent-required block, guardrail block, and no-photo-provider-payload verification.

**Patterns to follow:**
- Acceptance examples in `docs/brainstorms/production-readiness-requirements.md`
- Photo privacy constraints in `docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md`

**Test scenarios:**
- Covers prompt-injection block. Synthetic injection prompt is submitted during smoke testing -> request is blocked before provider work.
- Covers text AI consent block. Synthetic user without consent attempts generation -> request is blocked with consent-required behavior.
- Covers no external family-photo processing. Synthetic character contains no photo or real-person data -> provider payload remains photo-free.

**Verification:**
- QA can run staging smoke tests without inventing data.
- Fixture document clearly forbids real family data in staging.

---

### U4. Staging Smoke Test Checklist

**Goal:** Define the exact staging verification path to run after conflicts resolve, build passes, and staging deploys.

**Requirements:** R2, R4, R6

**Dependencies:** U2, U3

**Files:**
- Create: `docs/staging/smoke-test-checklist.md`

**Approach:**
- Split checks into preflight, auth, character creation, consent, generation, guardrails, provider payload privacy, library/reader, logs, and shutdown controls.
- Make each check state the input, action, expected outcome, and pass/fail evidence to capture.
- Keep checks synthetic-only and narrow enough to run before every staging promotion.
- Include a hard stop if the branch still has unresolved conflicts, typecheck/build failures, or staging provider credentials are uncapped.

**Patterns to follow:**
- Local verification shape in `README.md`
- Guardrail, consent, and photo-policy acceptance examples from the production-readiness requirements

**Test scenarios:**
- Happy path: signed-in staging parent creates a generic child, generates a story, opens reader, and sees the story in Library.
- Error path: prompt-injection fixture returns a blocked response and creates no provider work.
- Error path: missing external text AI consent returns consent-required behavior and creates no generation job.
- Integration: provider request evidence shows no photo URI, data URL, file path, blob URL, or real photo reference.
- Integration: failed generation logs expose metadata only, with no raw prompt, child name, photo, or generated image content.

**Verification:**
- The checklist is runnable by a founder/operator without reading source code.
- Each smoke result has a concrete evidence field.

---

### U5. Launch Limits And Emergency Controls

**Goal:** Decide the staging-to-beta guardrails for caps, spend, alerts, and shutdown before public signup is considered.

**Requirements:** R5, R6

**Dependencies:** U1

**Files:**
- Create: `docs/staging/launch-limits.md`

**Approach:**
- Define initial beta user cap, per-user daily generation cap, global daily generation cap, monthly provider spend cap, and abuse/rate-limit assumptions.
- Define alert recipients and alert triggers for spend spike, provider failure spike, stuck jobs, unsafe output, photo-policy violation, deletion failure, and auth outage.
- Define manual shutdown controls for disabling signup and generation separately.

**Patterns to follow:**
- Launch controls from `docs/brainstorms/production-readiness-requirements.md`
- Alert/runbook expectations from `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`

**Test scenarios:**
- Error path: provider spend exceeds staging cap -> alert owner and generation shutdown procedure are defined.
- Error path: unsafe output or photo-policy violation is detected -> public signup remains blocked and incident path is clear.
- Edge case: signup needs to pause while existing staging testers keep access -> separate signup and generation controls are documented.

**Verification:**
- Public signup cannot be proposed without explicit numeric limits and named shutdown owners.
- Founder/operator knows which lever to pull for signup pause versus generation pause.

---

### U6. Staging Readiness Handoff

**Goal:** Create the final checklist that connects conflict resolution, build verification, Render deployment, smoke testing, and public-signup blockers.

**Requirements:** R1, R2, R4, R5, R6

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Create: `docs/staging/readiness-handoff.md`

**Approach:**
- Define the entry criteria for staging deploy: no unresolved conflicts, generated clients aligned, typecheck/build green, required staging secrets present, provider caps set.
- Define the staging deploy handoff: Render API service, worker service when available, managed Postgres, Clerk staging app, provider keys, and public mobile API URL.
- Define exit criteria: smoke checklist passed, no real data used, redaction evidence captured, launch limits reviewed, public-signup blockers still listed separately.
- Make clear that passing staging smoke does not equal public launch readiness.

**Patterns to follow:**
- Current local runbook in `README.md`
- Production-hardening rollout sequence in `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`

**Test scenarios:**
- Integration: conflict resolver reports clean branch and build pass -> handoff document shows which staging steps can start.
- Error path: smoke test passes but private storage/KMS/durable worker are still incomplete -> public signup remains blocked.
- Error path: any staging run uses real family data -> staging result is invalid and must be rerun with synthetic fixtures.

**Verification:**
- Engineering, product, and operations have one shared checklist for whether staging is ready.
- The checklist separates staging smoke readiness from public launch readiness.

---

## System-Wide Impact

- **Interaction graph:** This plan coordinates deployment operators, conflict-resolution engineers, provider accounts, staging secrets, and QA smoke testing.
- **Error propagation:** Missing provider decisions, secrets, caps, or clean build status should block staging deploy rather than fail during smoke testing.
- **State lifecycle risks:** Staging data must remain synthetic and disposable; any real data contamination invalidates the run.
- **API surface parity:** Staging env names and smoke expectations must stay aligned with `.env.example`, OpenAPI-generated clients, and API route behavior after conflict resolution.
- **Integration coverage:** Smoke testing must cross auth, consent, generation, guardrails, provider payload privacy, logs, library, and reader surfaces.
- **Unchanged invariants:** This plan does not weaken the existing production-readiness requirement that public signup waits for private storage, KMS, durable jobs, output safety, observability, and launch controls.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Staging prep drifts from the final merged code | Keep docs focused on providers, env, fixtures, and smoke expectations; re-check after conflicts resolve. |
| Real family data accidentally enters staging | Use a synthetic fixture pack and mark any real-data run invalid. |
| Provider accounts are created without caps | Make capped credentials an entry criterion for staging smoke. |
| Passing staging smoke is mistaken for launch readiness | Readiness handoff must list public-signup blockers separately. |
| Secret values leak into docs | Secrets matrix records names, owners, and sources only; never actual values. |

---

## Documentation / Operational Notes

- Keep all staging docs under `docs/staging/` so the conflict-resolution branch can consume them as a handoff bundle.
- Update `README.md` only after the staging flow exists and has been exercised.
- If provider choices change during implementation, update `docs/staging/provider-decisions.md` and `docs/staging/secrets-matrix.md` together.

---

## Sources & References

- Origin document: `docs/brainstorms/production-readiness-requirements.md`
- Related plan: `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md`
- Local runbook: `README.md`
- Local env template: `.env.example`
- Render Background Workers: `https://render.com/docs/background-workers`
- Render Blueprint YAML Reference: `https://render.com/docs/blueprint-spec`
- Render Environment Variables and Secrets: `https://render.com/docs/configure-environment-variables`
- Render Postgres Backups: `https://render.com/docs/postgresql-backups`
