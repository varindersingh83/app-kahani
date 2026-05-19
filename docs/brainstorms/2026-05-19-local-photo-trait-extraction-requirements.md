---
date: 2026-05-19
topic: local-photo-trait-extraction
---

# Local Photo Trait Extraction

## Summary

Kahani will support privacy-first, on-device extraction of coarse visual traits from child and parent/adult photos, without sending photos, face embeddings, or extracted traits to AI providers or analytics. Until the iOS-only local model is production-ready, the production character flow stays generic and hides the photo picker.

---

## Problem Frame

Kahani’s current production-hardening work removes image attachments from AI-provider calls. That protects sensitive family photos, but it also removes the prior source of visual personalization. The current code path stores selected photos locally for preview in `artifacts/mobile/app/(tabs)/characters.tsx`, while generation sends only descriptor text from `artifacts/mobile/app/(tabs)/index.tsx` and backend prompts use redacted descriptors in `artifacts/api-server/src/services/story-sheet/generator.ts`.

The missing product behavior is a trustworthy bridge between family photos and storybook consistency: the app needs a local-only way to derive non-sensitive illustration hints from a photo, then discard the photo immediately. The feature must not become biometric identity matching, hidden sensitive inference, or another route for family photos to leave the device.

---

## Actors

- A1. Parent account holder: Gives required onboarding consent, creates child and adult characters, and may optionally use photo extraction once available.
- A2. Child subject: Appears as the main story character and requires the strongest privacy protection.
- A3. Parent/adult character subject: May appear as a supporting character and follows the same local-only extraction rules.
- A4. Kahani operator: Needs metadata-only product behavior analytics to improve the app without seeing family content.
- A5. Local extraction model: Bundled, auditable, offline model that can produce only approved coarse traits on supported iOS devices.
- A6. AI story/image provider: Receives prompts and redacted descriptors, never photos, extracted traits telemetry, face embeddings, or image attachments.

---

## Key Flows

- F1. Required onboarding consent
  - **Trigger:** Parent opens Kahani for the first time.
  - **Actors:** A1, A4
  - **Steps:** App presents one required consent gate covering external text AI processing, local-only photo extraction, local descriptor storage, metadata-only analytics, no sale of data, no photo upload, and no content/trait analytics. Parent either consents or cannot continue into the app.
  - **Outcome:** App has a clear consent basis before any product use; decline means no app access.
  - **Covered by:** R1, R2, R14, R15

- F2. Generic character creation before extraction is ready
  - **Trigger:** Parent adds a character while the extraction model is not production-ready.
  - **Actors:** A1, A2, A3
  - **Steps:** App hides the photo picker, collects only name, child/adult role, and presentation choice, then saves the character locally.
  - **Outcome:** Character can be used for story generation without photo handling or manual appearance notes.
  - **Covered by:** R3, R4, R5

- F3. Optional iOS photo extraction after production gate
  - **Trigger:** Parent chooses optional photo extraction for a character on supported iOS after the model is approved.
  - **Actors:** A1, A2 or A3, A5
  - **Steps:** App runs the bundled model fully offline, extracts only allowed coarse traits, discards the raw photo immediately, saves the descriptor locally, and shows a local-only indicator that the character uses local photo traits.
  - **Outcome:** Future generation can use a local descriptor for approximate visual consistency without retaining or uploading the photo.
  - **Covered by:** R6, R7, R8, R9, R10, R11, R12

- F4. Extraction failure or unsafe output
  - **Trigger:** Model is unavailable, too slow, low-confidence, or emits a disallowed sensitive category.
  - **Actors:** A1, A5
  - **Steps:** App discards the photo, does not save a descriptor, and falls back to generic character generation from name/role/presentation.
  - **Outcome:** Failure never blocks story generation and never partially trusts unsafe model output.
  - **Covered by:** R8, R12, R13

---

## Requirements

**Consent and analytics**
- R1. Kahani must have one required onboarding consent gate before app use; if the parent does not consent, the app does not continue.
- R2. The consent must explicitly cover external text AI processing, local-only photo trait extraction, local-only descriptor storage, metadata-only product behavior analytics, no sale of data, no photo upload, and no analytics collection of traits, names, prompts, photos, or generated images.
- R3. Product analytics must use an anonymous install ID only for v1, not a child ID, character ID, raw account ID, or photo-derived identifier.
- R4. Required analytics may include product behavior metadata such as flow usage, drop-off, extraction attempted/succeeded/failed, failure category, model version, duration bucket, platform/app version, and whether generation happened after extraction.
- R5. Analytics must never include photos, extracted traits, face embeddings, names, prompts, generated images, or per-child identifiers.

**Character creation and fallback**
- R6. Until an acceptable local extraction model is production-ready, production character creation must hide the photo picker.
- R7. The generic production character flow must collect only name, child/adult role, and presentation choice; it must not collect manual appearance notes in v1.
- R8. Photo extraction, when enabled, must remain optional; generic character creation stays the default path.
- R9. If extraction is unsupported, unavailable, low-confidence, too slow, or unsafe, the app must discard the photo and continue with a generic character.

**Photo extraction and descriptor handling**
- R10. V1 extraction must target iOS only; Android and web fall back to generic character creation.
- R11. The extraction model must be open-source or otherwise auditable, bundled in the app binary, and able to run fully offline.
- R12. Extraction must complete under one second for the production-enabled path; if no acceptable model meets this bar, v1 ships generic-only.
- R13. Extraction may produce only non-sensitive visible traits: broad hair color, skin tone range, clothing colors, glasses, and approximate age band.
- R14. Extraction must not produce or store identity-level likeness, face embeddings, perceptual hashes, ethnicity/race labels, health, disability, body size, emotion, attractiveness, or other sensitive categories.
- R15. If the model emits any disallowed sensitive category, the app must discard the whole descriptor and use the generic character.
- R16. Raw photos must be discarded immediately after extraction and must not be retained locally, uploaded, logged, or used as an avatar.
- R17. Extracted descriptors must be stored only on the local device for v1 and deleted when the character is deleted.
- R18. Extracted descriptor text must not be visible in production UI; dev builds may expose model output for engineering QA.
- R19. A character profile may show a small local-only indicator such as “Uses local photo traits,” without exposing trait text.

**Provider and story generation boundary**
- R20. Backend generation must continue to reject or strip any `photoUri`, data URL, file path, blob URL, or provider-fetchable image URL before provider calls.
- R21. AI providers must receive only redacted prompts and descriptors; they must never receive photos, face embeddings, extracted-trait telemetry, child identifiers, or parent/adult identifiers.
- R22. Generated story and image prompts must continue using redacted labels rather than child or parent names in image-provider prompt construction.

**Validation and release gating**
- R23. The photo picker must stay hidden until the bundled extraction model passes internal validation.
- R24. Model validation must include a curated internal test set across lighting, ages, skin tones, hair types, glasses, hats, and clothing, plus founder dogfood with strict no-upload and no-retention rules.
- R25. Extraction must run only at character creation in v1; there is no re-run or replace-descriptor flow.

---

## Acceptance Examples

- AE1. **Covers R1, R2.** Given a new install, when the parent declines required onboarding consent, the app does not enter the character creation or story generation experience.
- AE2. **Covers R6, R7, R23.** Given the extraction model is not production-ready, when the parent opens Add Character, the photo picker is hidden and the form only asks for name, role, and presentation.
- AE3. **Covers R10, R11, R12, R16.** Given a supported iOS device and an approved bundled model, when the parent chooses optional photo extraction, the app processes the photo offline in under one second and discards the raw photo immediately after descriptor creation.
- AE4. **Covers R13, R14, R15.** Given the model output contains a disallowed category like ethnicity, health, disability, body size, or emotion, when extraction completes, Kahani discards the entire descriptor and uses the generic character.
- AE5. **Covers R3, R4, R5.** Given extraction succeeds and the parent later generates a story, analytics may record anonymous install ID, model version, duration bucket, success status, and generation-after-extraction, but not the photo, descriptor, name, prompt, or generated image.
- AE6. **Covers R17, R19.** Given a character uses local photo traits, when the parent views the character profile, the app may show a local-only indicator; when the parent deletes the character, the descriptor is deleted too.
- AE7. **Covers R20, R21, R22.** Given a stale client sends `photoUri` in a generation request, when the backend builds provider payloads, the provider receives no image attachment or fetchable photo URL and image prompts use redacted labels.

---

## Success Criteria

- Parents can understand and consent to the privacy model before using the app.
- Production never uploads, retains, logs, or forwards family photos for generation.
- Before extraction is ready, the app remains usable through generic character creation without implying photo personalization.
- After extraction is ready, iOS users can get approximate visual consistency from coarse local traits without identity-level likeness.
- Kahani can learn product flow usage through metadata-only analytics without collecting family content.
- A downstream planner can turn this into a scoped implementation plan without inventing consent behavior, fallback behavior, release gates, or analytics boundaries.

---

## Scope Boundaries

- No external/cloud image analysis for family photos.
- No provider-side photo filtering as a substitute for local extraction.
- No face embeddings, face matching, identity-level likeness, perceptual hashes, or biometric templates.
- No production trait text UI beyond a local-only indicator.
- No Android or web extraction in v1.
- No manual appearance notes in the generic fallback flow for v1.
- No re-run, replace descriptor, or per-character photo update flow in v1.
- No local photo avatar after extraction; avatars stay generic.
- No analytics based on child IDs, character IDs, names, photos, descriptors, prompts, or generated images.
- No downloadable runtime model in v1.

---

## Key Decisions

- Privacy-first over strong likeness: the app optimizes for coarse storybook consistency, not child face reproduction.
- Required single consent: app access depends on consent because generation and analytics are core to the product.
- Generic-first character creation: default path remains low-risk even after optional extraction ships.
- iOS-only v1 extraction: narrower platform support keeps the first production gate auditable.
- Open-source/auditable bundled model: no opaque commercial SDK or runtime model download for v1.
- Generic-only fallback: if a safe model cannot meet the privacy and sub-second bar, production ships without photo extraction.

---

## Dependencies / Assumptions

- The existing backend photo-provider boundary from `artifacts/api-server/src/services/safety/providerPayloadPolicy.ts` remains in force.
- The current Add Character UI in `artifacts/mobile/app/(tabs)/characters.tsx` must be changed before production because it still stores selected photos for local preview.
- Planning needs to identify an acceptable auditable iOS model or decide to ship generic-only.
- The broader production-readiness work still owns encrypted backend profiles, deletion workflows, private storage, and Render deployment.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R10-R15][Needs research] Which auditable iOS-compatible model can extract only the approved trait categories under one second?
- [Affects R24][Technical] What validation artifact should prove the model passed internal test-set and founder dogfood gates?
- [Affects R1-R5][Technical] Where should the required onboarding consent and anonymous install analytics state live in the current app flow?
