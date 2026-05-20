---
date: 2026-05-20
topic: local-cartoon-character-replacement
---

# Local Cartoon Character Replacement

## Summary

Kahani will make photo-based character creation feel immediate without keeping or uploading the original photo. The app shows the selected photo locally while it extracts only safe coarse traits, then replaces that preview with a generated cartoon character image that becomes the persistent visual reference for future stories.

---

## Problem Frame

Parents expect an uploaded character photo to visibly affect the character they are creating. The current privacy-safe direction avoids uploading family photos, but that can make the photo step feel broken when the image disappears or never appears in the UI.

The product needs a clearer trust-preserving flow: the parent sees the selected photo immediately, the original remains phone-local and short-lived, and the durable character image becomes a generated cartoon based only on non-sensitive traits. The feature should improve confidence and story visual consistency without turning the raw family photo into storage, analytics, provider input, or a likeness-matching system.

---

## Actors

- A1. Parent account holder: Selects a photo, reviews the replacement, and expects a private flow.
- A2. Child or family member subject: May be represented by a character image and needs strong privacy protection.
- A3. Kahani mobile app: Handles local preview, extraction, replacement, persistence, and deletion.
- A4. Cartoon generation provider: May receive safe trait descriptors and/or a generated cartoon reference, never the original family photo.
- A5. Story image generation provider: May receive the generated cartoon reference for future image consistency, never the original family photo.

---

## Key Flows

- F1. Temporary local photo preview
  - **Trigger:** Parent selects a photo for a character.
  - **Actors:** A1, A3
  - **Steps:** The app displays the selected photo immediately from local device state, marks it as temporary, extracts only approved traits locally, and does not send the original photo to the API, AI provider, analytics, logs, or durable backend storage.
  - **Outcome:** The parent gets immediate visual feedback while the privacy boundary remains intact.
  - **Covered by:** R1, R2, R3, R4

- F2. Traits-only cartoon replacement
  - **Trigger:** Local extraction produces an approved coarse descriptor.
  - **Actors:** A1, A3, A4
  - **Steps:** The app requests or produces a cartoon character image using only approved traits and generic storybook styling, replaces the temporary photo preview with that cartoon, and deletes the original from app persistence.
  - **Outcome:** The saved character has a durable cartoon visual reference, not the original photo.
  - **Covered by:** R5, R6, R7, R8, R9

- F3. Future story image consistency
  - **Trigger:** Parent generates a story using a character with a cartoon replacement.
  - **Actors:** A3, A5
  - **Steps:** Story generation may use the generated cartoon reference and safe descriptors for visual consistency. It must not send or reconstruct the original family photo.
  - **Outcome:** Future story images are guided by the safe cartoon character, not raw family media.
  - **Covered by:** R10, R11, R12

- F4. Unavailable, unreadable, or rejected photo
  - **Trigger:** Extraction fails, output is unsafe, cartoon generation is unavailable, or the parent skips the generated replacement.
  - **Actors:** A1, A3
  - **Steps:** The app removes the temporary original from app persistence and falls back to a generic or manually chosen cartoon avatar.
  - **Outcome:** Character creation still completes without retaining or uploading the original photo.
  - **Covered by:** R13, R14, R15

---

## Requirements

**Temporary original photo handling**

- R1. When a parent selects a photo, the character creation UI must show that photo immediately from local device state so the upload does not feel broken.
- R2. The original selected photo must remain phone-local and must never be sent to Kahani API servers, AI providers, analytics, crash logs, or remote storage.
- R3. The original photo must be treated as temporary app state only; it must not become the saved character avatar or story-generation reference.
- R4. Once a cartoon replacement exists or the parent chooses fallback, the app must remove the original photo from app-controlled persistence.

**Traits-only cartoon replacement**

- R5. Cartoon replacement generation may use only approved coarse traits, such as broad hair color, skin tone range, clothing color, glasses, and parent-selected role/presentation.
- R6. Cartoon replacement generation must not use the original photo, face embeddings, similarity scores, perceptual hashes, identity-level likeness claims, ethnicity/race labels, health, disability, body size, emotion, attractiveness, or other sensitive categories.
- R7. The generated cartoon must replace the temporary photo preview in the UI once available.
- R8. The saved character visual source must be the cartoon replacement or a generic/manual fallback, never the original family photo.
- R9. The UI must avoid promising exact likeness; it should communicate the result as a storybook character inspired by safe visual hints.

**Future story image use**

- R10. Future story image generation may use the generated cartoon reference for visual consistency if it is available.
- R11. Future story image generation must never receive the original family photo, local file URI, blob URI, data URL, or any raw-photo-derived biometric artifact.
- R12. If the cartoon reference is unavailable, story generation must fall back to safe descriptors or generic character presentation rather than blocking the story flow.

**Fallback and failure behavior**

- R13. If local trait extraction fails, returns unsafe output, or is unavailable, the app must discard the temporary original and offer a generic or manual cartoon fallback.
- R14. If cartoon generation fails or times out, the app must not keep the original photo as a substitute avatar.
- R15. A parent must be able to finish character creation without using a photo.

**Auditability and data minimization**

- R16. Analytics may record metadata such as extraction attempted, replacement generated, fallback used, failure category, duration bucket, and platform, but must not include photos, trait values, character names, prompts, cartoon image bytes, or child identifiers.
- R17. Logs and errors must not include original image URIs, generated image payloads, extracted trait text, or provider prompts containing family-specific details.
- R18. Deleting a character must delete the saved cartoon reference and safe descriptor from local app state.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given a parent selects a child photo, when the picker returns, the UI shows the selected photo locally while no API request or provider payload contains the original photo, file URI, blob URI, or data URL.
- AE2. **Covers R5, R6, R7, R8.** Given safe coarse traits are available, when cartoon replacement completes, the UI swaps the temporary photo for the cartoon and the saved character record contains no original photo reference.
- AE3. **Covers R10, R11, R12.** Given a story is generated for a character with a cartoon replacement, when image prompts are built, the provider may receive the cartoon reference but never the original photo or biometric artifact.
- AE4. **Covers R13, R14, R15.** Given extraction or cartoon generation fails, when the parent continues, the app discards the original photo and saves a generic/manual cartoon fallback.
- AE5. **Covers R16, R17.** Given the flow succeeds or fails, analytics and logs include only allowed metadata, not photo content, trait text, names, prompts, image bytes, or child identifiers.

---

## Success Criteria

- Parents see immediate feedback after selecting a photo.
- The durable character image is a cartoon replacement, not the uploaded family photo.
- Story images can stay visually consistent using safe cartoon references.
- Original family photos never leave the device and do not remain in saved app character state.
- A downstream planner can implement the flow without inventing privacy boundaries, fallback behavior, or story-generation use rules.

---

## Scope Boundaries

- No original photo upload to Kahani servers, AI providers, remote storage, analytics, or logs.
- No exact likeness, face matching, biometric template, embedding, perceptual hash, or similarity scoring.
- No provider-side analysis of the original family photo.
- No durable raw-photo avatar.
- No raw-photo analytics, trait-value analytics, prompt analytics, or generated-image analytics.
- No requirement to build a full avatar editor in this iteration.
- No requirement for cross-device cartoon sync unless a later storage design preserves the same privacy baseline.

---

## Key Decisions

- Temporary local preview over saved photo avatar: this fixes the broken-feeling upload step without weakening the privacy promise.
- Traits-only cartoon generation: the AI provider may get safe descriptors, not the original photo.
- Cartoon as future reference: the generated cartoon becomes the visual source for later story imagery.
- Generic/manual fallback: failures never justify retaining the original family photo.
- Local-first persistence for this iteration: durable remote storage can be revisited only if it preserves no-original-photo exposure.

---

## Dependencies / Assumptions

- Local trait extraction remains constrained by the existing safe-trait allowlist from `docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md`.
- Existing provider payload policy continues to strip raw family-photo references before backend provider calls.
- The implementation may use a deterministic local placeholder for development if provider-backed cartoon generation is unavailable, but production behavior must not present that as AI replacement unless a real traits-only provider path exists.
- Future remote persistence of cartoon images is a separate decision because it changes storage and deletion obligations.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R5-R9][Technical] What is the smallest implementation path that can generate or mock the cartoon replacement while preserving the traits-only provider boundary?
- [Affects R10-R12][Technical] Where should the story-generation handoff distinguish generated cartoon references from forbidden original photo references?
- [Affects R18][Technical] Which local storage fields need migration so old `photoUri` values cannot survive as character avatars?
