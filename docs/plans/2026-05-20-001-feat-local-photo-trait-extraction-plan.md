---
title: feat: Local photo trait extraction
type: feat
status: completed
date: 2026-05-20
origin:
  - docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md
  - docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md
---

# feat: Local photo trait extraction

## Summary

Implement a privacy-first character photo flow where family photos stay on device, the app locally decides whether a photo is usable, and provider calls receive only redacted, non-sensitive descriptors. A usable photo should skip redundant manual characteristics. An unreadable photo should get one guided retry, then a minimal manual fallback.

This plan does not relax the production hardening baseline. The API must continue stripping all provider-reference image URIs, analytics must stay metadata-only, and production must fail closed until a local model is approved.

---

## Problem Frame

Kahani needs enough visual consistency for child and caregiver characters to make generated storybooks feel personal. The risky shortcut would be sending family photos to an LLM or image provider. That is explicitly out of scope. The product needs a local-only image gate that reduces parent friction without creating biometric, analytics, logging, or provider exposure.

The current branch is not ready for this promise yet. `artifacts/mobile/app/(tabs)/characters.tsx` still lets parents pick a photo and turns it into a persistable URI or data URL. `artifacts/mobile/services/photoDescriptors.ts` only converts parent-entered text and presentation into a descriptor; it does not inspect photos locally. The backend safety layer is stronger: `artifacts/api-server/src/services/safety/providerPayloadPolicy.ts` disables provider reference images, and `artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts` verifies redacted image prompts. The plan therefore focuses on closing the mobile/local-extraction side while preserving backend defense in depth.

---

## Scope

In scope:
- Required consent before any photo processing path is available.
- Local photo usability check for single-person human/child photos.
- One retry for unreadable, ambiguous, unsupported, or low-confidence photos.
- Minimal manual fallback after retry failure or skip.
- Strict descriptor allowlist for coarse visible traits only.
- Immediate raw-photo discard after local processing.
- Local descriptor persistence and deletion with the character.
- Metadata-only analytics for flow learning and debugging.
- API provider boundary tests proving no photo, data URL, file URI, blob URI, fetchable URL, embedding, hash, or extracted-trait telemetry reaches providers.

Out of scope:
- Cloud or provider-side photo analysis.
- Face recognition, identity matching, biometric templates, face embeddings, or perceptual hashes.
- Race, ethnicity, health, disability, body size, attractiveness, emotion, or identity-level likeness labels.
- Production avatars sourced from retained raw photos.
- Analytics keyed by child ID, character ID, name, prompt, photo, descriptor, manual characteristic, or generated image.
- Re-running extraction after character creation in v1.

---

## Requirements Trace

| Requirement | Plan coverage |
| --- | --- |
| R1-R5 photo-first creation, retry, fallback, child/adult support | U2, U3, U4 |
| R6 local-only model | U2, U3 |
| R7 approved non-sensitive descriptors | U3 |
| R8 unreadable/unsafe photos discarded | U2, U4 |
| R9 parent-friendly retry guidance | U4 |
| R10 no raw-photo retention | U2, U5 |
| R11-R12 minimal non-sensitive manual fallback | U4 |
| R13-R15 provider boundary and redacted prompts | U6 |
| R16-R18 metadata-only analytics and production UI restraint | U1, U7 |

Acceptance examples AE1-AE5 from the brainstorm are covered in the verification plan.

---

## Technical Decisions

- Consent is the first gate. If the parent does not consent, the app does not expose the character creation or generation flow.
- Photo analysis is local-only and optional at launch. Production defaults to disabled until a model passes the documented review gate.
- The model adapter returns structured signals, not free-form prose. The policy layer owns descriptor conversion.
- Any disallowed trait, low confidence, timeout, unsupported platform, or adapter error rejects the whole photo-derived descriptor and moves to retry/fallback.
- Raw photos are temporary inputs. They must not become the character source of truth, analytics payloads, logs, API payloads, or generated assets.
- Descriptor text is not a parent-facing production feature. Production can show a neutral local-only indicator, while development can expose a debug inspector.
- Backend provider-photo stripping remains mandatory even if mobile clients are correct.

---

## Implementation Units

### U1. Consent And Metadata Analytics Foundation

**Goal:** Ensure local photo processing and product-learning analytics are impossible before required consent.

**Files:**
- Create or extend: `artifacts/mobile/services/onboardingConsent.ts`
- Create or extend: `artifacts/mobile/services/onboardingConsent.test.ts`
- Create or extend: `artifacts/mobile/services/analytics.ts`
- Create or extend: `artifacts/mobile/services/analytics.test.ts`
- Modify: `artifacts/mobile/app/_layout.tsx`
- Modify: `artifacts/mobile/app/(tabs)/characters.tsx`

**Approach:**
- Add a single beginning consent gate for app use. Decline means the app remains blocked.
- Include local photo processing, external AI story/image generation, metadata-only analytics, and deletion expectations in the consent version.
- Generate anonymous install analytics state only after consent.
- Enforce an analytics allowlist for events such as `photo_check_attempted`, `photo_check_succeeded`, `photo_check_failed`, `photo_retry_used`, `manual_fallback_used`, duration bucket, model version, platform, and app version.
- Reject fields that look like names, prompts, photos, data URLs, file/blob/http URLs, descriptors, manual characteristics, generated content, child IDs, or character IDs.

**Tests:**
- `artifacts/mobile/services/onboardingConsent.test.ts`
- `artifacts/mobile/services/analytics.test.ts`
- Add focused app startup coverage for consent-blocked character creation if a mobile UI test harness already exists.

**Verification:**
- `pnpm --filter @workspace/mobile exec tsx --test artifacts/mobile/services/onboardingConsent.test.ts artifacts/mobile/services/analytics.test.ts`
- `pnpm --filter @workspace/mobile run typecheck`

### U2. Local Photo Gate And Model Evaluation

**Goal:** Add the fail-closed extraction gate and document the model approval criteria before integrating any image model.

**Files:**
- Create: `docs/security/local-photo-extraction-model-evaluation.md`
- Create: `artifacts/mobile/services/photoExtractionGate.ts`
- Create: `artifacts/mobile/services/photoExtractionGate.test.ts`
- Modify: `artifacts/mobile/app.json`
- Modify: `artifacts/mobile/app/(tabs)/characters.tsx`

**Approach:**
- Gate extraction behind explicit build/runtime configuration, defaulting off in production.
- Document acceptable model requirements: bundled on device, offline, auditable license/source, iOS support for v1, no network calls, no biometric identity output, bounded latency, deterministic failure categories, and removable without breaking generic creation.
- Return `unavailable` on unsupported platforms, missing model, production-disabled state, timeout, or adapter error.
- Keep the current production UI generic-only while the gate is disabled.

**Tests:**
- `artifacts/mobile/services/photoExtractionGate.test.ts`

**Verification:**
- Gate-disabled production config never renders the photo picker or extraction path.
- Model-evaluation doc has explicit approve/reject criteria and a release checklist.

### U3. Trait Policy And Local Extractor Boundary

**Goal:** Convert local model output into a safe descriptor only when every signal is allowed and confident.

**Files:**
- Create: `artifacts/mobile/services/photoTraitPolicy.ts`
- Create: `artifacts/mobile/services/photoTraitPolicy.test.ts`
- Create: `artifacts/mobile/services/photoTraitExtractor.ts`
- Create: `artifacts/mobile/services/photoTraitExtractor.test.ts`
- Modify: `artifacts/mobile/services/photoDescriptors.ts`
- Modify: `artifacts/mobile/services/photoDescriptors.test.ts`

**Approach:**
- Define exact allowed fields for v1: broad hair color, broad clothing color, glasses boolean, and general presentation only when parent-selected or model confidence is high enough and non-sensitive.
- Reject the whole descriptor on disallowed fields such as race, ethnicity, health, disability, body size, attractiveness, mood, exact age, identity, or similarity claims.
- Use typed model output, not free-form extracted prose.
- Keep descriptor wording suitable for image prompts but redacted from names and raw photo instructions.
- Preserve generic/manual descriptor behavior for non-photo fallback.

**Tests:**
- `artifacts/mobile/services/photoTraitPolicy.test.ts`
- `artifacts/mobile/services/photoTraitExtractor.test.ts`
- `artifacts/mobile/services/photoDescriptors.test.ts`

**Verification:**
- Allowed coarse traits produce a descriptor.
- Any disallowed key or suspicious free-form value discards the descriptor and returns a fallback reason.
- No test fixture includes real family photos.

### U4. Character Creation Retry And Manual Fallback UX

**Goal:** Replace the current photo picker behavior with the brainstormed photo-first flow: success skips manual characteristics, failure gets one retry, then minimal fallback.

**Files:**
- Modify: `artifacts/mobile/app/(tabs)/characters.tsx`
- Modify: `artifacts/mobile/context/StoryContext.tsx`
- Create or extend: `artifacts/mobile/services/characterPrivacy.ts`
- Create or extend: `artifacts/mobile/services/characterPrivacy.test.ts`
- Add if harness exists: `artifacts/mobile/app/(tabs)/characters.photoExtraction.test.tsx`

**Approach:**
- Collect name and relationship first.
- When extraction is enabled, allow one photo upload and run the local gate immediately.
- If usable, discard the raw photo, save only the approved local descriptor and a photo-derived indicator, and do not ask manual characteristics.
- If unreadable, ambiguous, non-human, unsafe, or low-confidence, show one plain-language retry prompt.
- If retry fails or is skipped, discard the photo and show the minimal manual fallback fields only.
- Keep parent/adult characters under the same no-upload/no-retention rules.
- Hide raw descriptor text in production; development may expose debug output only behind non-production checks.

**Tests:**
- `artifacts/mobile/services/characterPrivacy.test.ts`
- `artifacts/mobile/app/(tabs)/characters.photoExtraction.test.tsx` if the project has React Native screen testing available.

**Verification:**
- AE1: clear single-child local success saves without manual fields.
- AE2: blurry or non-human failure offers exactly one retry.
- AE3: retry failure shows only minimal non-sensitive fallback.
- Production build does not persist `photoUri`, data URL, blob URL, or file URL as a saved character field.

### U5. Local Persistence, Deletion, And Storage Hygiene

**Goal:** Make the saved character record reflect the privacy promise: no raw photo source of truth, no retained upload, and descriptor deletion with the character.

**Files:**
- Modify: `artifacts/mobile/context/StoryContext.tsx`
- Modify: `artifacts/mobile/services/photoDescriptors.ts`
- Create or extend: `artifacts/mobile/services/characterPrivacy.ts`
- Add migration tests if storage migration utilities exist: `artifacts/mobile/context/StoryContext.test.tsx`

**Approach:**
- Replace saved `photoUri` usage for production characters with a safe metadata shape, such as `appearance` plus `appearanceSource: "local-photo" | "manual" | "generic"`.
- Add a local storage migration that drops stale `photoUri` or data URL values from character records in production-safe mode.
- Ensure `removeCharacter` removes descriptor/source metadata.
- Ensure generated story request creation never includes stale local photo values.

**Tests:**
- Character storage migration drops `photoUri` but preserves name, relationship, selected character, and safe appearance source.
- Removing a character removes descriptor/source metadata.

**Verification:**
- Inspect stored AsyncStorage payload in a dev run and confirm no raw image strings remain after save/delete.
- `rg -n "photoUri|data:image|blob:|file://" artifacts/mobile/context artifacts/mobile/services` has only allowed code/test references.

### U6. Provider Boundary Defense In Depth

**Goal:** Keep API generation photo-free even when stale or malformed clients send photo fields.

**Files:**
- Modify if needed: `artifacts/api-server/src/services/safety/providerPayloadPolicy.ts`
- Modify if needed: `artifacts/api-server/src/services/safety/providerPayloadPolicy.test.ts`
- Modify if needed: `artifacts/api-server/src/services/story-sheet/generator.ts`
- Modify if needed: `artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts`
- Search/patch if needed: `artifacts/api-server/src/services/book-generation/*`

**Approach:**
- Keep `sanitizeProviderReferenceImageUris` returning an empty list for family-photo privacy.
- Ensure story and image prompt construction uses redacted labels like "the child" and "the caregiver" where possible.
- Add regression tests for data URL, file URI, blob URI, http/https URL, and accidental reference-image arrays.
- Search older book-generation services for `photoUri` propagation and either remove provider-facing use or clearly quarantine it as legacy non-production code.

**Tests:**
- `artifacts/api-server/src/services/safety/providerPayloadPolicy.test.ts`
- `artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts`
- Add focused tests under `artifacts/api-server/src/services/book-generation/` if legacy code still forwards `photoUri`.

**Verification:**
- `pnpm --filter @workspace/api-server exec tsx --test artifacts/api-server/src/services/safety/providerPayloadPolicy.test.ts artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts`
- `rg -n "referenceImageUri|referenceImageUris|photoUri" artifacts/api-server/src` and review every hit for provider exposure.

### U7. Observability, Runbook, And Release Gate

**Goal:** Let the team learn from behavior without collecting sensitive family content.

**Files:**
- Create: `docs/runbooks/local-photo-trait-extraction.md`
- Modify: `docs/security/local-photo-extraction-model-evaluation.md`
- Modify: `docs/plans/2026-05-19-002-feat-production-hardening-follow-on-plan.md` only if this focused plan changes the broader production sequence.

**Approach:**
- Document allowed analytics events and forbidden fields.
- Document how to debug extraction failures using metadata only: platform, app version, model version, failure category, retry state, duration bucket, and anonymized install cohort.
- Add a release gate checklist: consent version shipped, gate default verified, model approved, production UI hides raw traits, provider-photo tests pass, storage migration checked, and rollback disables extraction remotely or by config.
- Document incident handling for suspected photo retention or provider exposure: disable extraction, block affected builds if needed, rotate credentials if logs were exposed, inspect redacted telemetry, and run deletion workflow for affected records.

**Tests:**
- Analytics allowlist tests from U1.
- Provider-photo tests from U6.
- Storage hygiene tests from U5.

**Verification:**
- Runbook contains no instructions to inspect raw photos, descriptors, names, prompts, or generated images.
- Release checklist can be followed by a developer without guessing flags, paths, or commands.

---

## Rollout Sequence

1. Land U1 first so consent and analytics boundaries exist before photo work.
2. Land U2 with extraction disabled in production and the model-evaluation doc reviewed.
3. Land U3 policy/extractor tests using synthetic fixtures only.
4. Land U4 and U5 together or back-to-back so the UI cannot save raw photos without the storage migration.
5. Land U6 backend regression tests before enabling any mobile extraction flag.
6. Land U7 runbook and release checklist.
7. Enable extraction for internal development builds only.
8. Approve a specific local model in `docs/security/local-photo-extraction-model-evaluation.md`.
9. Enable for a small production cohort only after storage, analytics, and provider-boundary tests pass in CI.
10. Keep a config rollback that returns all users to generic/manual fallback without app data loss.

---

## Verification Plan

Focused tests:
- `pnpm --filter @workspace/mobile exec tsx --test artifacts/mobile/services/onboardingConsent.test.ts artifacts/mobile/services/analytics.test.ts`
- `pnpm --filter @workspace/mobile exec tsx --test artifacts/mobile/services/photoExtractionGate.test.ts artifacts/mobile/services/photoTraitPolicy.test.ts artifacts/mobile/services/photoTraitExtractor.test.ts artifacts/mobile/services/photoDescriptors.test.ts`
- `pnpm --filter @workspace/api-server exec tsx --test artifacts/api-server/src/services/safety/providerPayloadPolicy.test.ts artifacts/api-server/src/services/story-sheet/generator.photoPrivacy.test.ts`

Static checks:
- `pnpm --filter @workspace/mobile run typecheck`
- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm run typecheck`

Manual checks:
- With no consent, app does not show character creation or generation.
- With extraction disabled, production Add Character has no photo picker.
- With internal extraction enabled and a synthetic usable image fixture, save skips manual characteristics and stores no raw photo.
- With synthetic unreadable/non-human image fixture, retry appears once, then minimal manual fallback appears.
- Generate a story with a photo-derived descriptor and inspect outbound provider payload construction in tests/log-safe debug mode; no raw photo, URI, image attachment, embedding, hash, name, or extracted-trait telemetry is present.
- Delete the character and inspect local storage; descriptor/source metadata is gone.

Final gate:
- `pnpm run build`

---

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A model emits sensitive or identity-level traits | High | Typed adapter output plus strict allowlist; reject the whole descriptor on any disallowed key/value. |
| Raw photos remain in AsyncStorage from old flows | High | Storage migration and `rg` checks for `photoUri`, data URLs, blob URLs, and file URLs. |
| Analytics accidentally captures descriptors or names | High | Central allowlist, forbidden-key tests, and runbook language forbidding content debugging. |
| Production UI implies photo personalization before model approval | Medium | Gate defaults off; hide photo picker until U2 approval criteria are satisfied. |
| Provider-photo stripping regresses | High | Keep backend tests independent of mobile correctness. |
| Local extraction is slow or unavailable on Android/web | Medium | v1 can be iOS/internal-only; unsupported platforms go to generic/manual fallback. |

---

## Open Questions For Implementation

- Which exact on-device model or OS capability will pass the audit criteria in `docs/security/local-photo-extraction-model-evaluation.md`?
- Should `appearanceSource` live only in mobile local storage for v1, or should the API schema accept the source as metadata for future account sync?
- What is the exact consent version string for the first production release that includes local photo processing language?
- Which remote/config mechanism will own extraction rollback for production builds?
