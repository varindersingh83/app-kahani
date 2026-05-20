---
title: "feat: Local cartoon character replacement"
type: feat
status: completed
date: 2026-05-20
origin:
  - docs/brainstorms/2026-05-20-local-cartoon-character-replacement-requirements.md
  - docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md
---

# feat: Local cartoon character replacement

## Summary

Extend the existing privacy-first photo extraction flow so selected photos appear immediately as temporary local previews, then swap into a durable cartoon character reference generated from safe descriptors. Character storage and story generation must continue to reject original photo references while allowing the safe cartoon reference to guide future story imagery.

---

## Problem Frame

The current Add Character flow can process a selected photo locally, but it gives weak visual feedback and saves only descriptor text. That makes the upload step feel broken even though the privacy boundary is intentional.

---

## Requirements

- R1. Show the selected photo immediately as a local-only temporary preview.
- R2. Never save or send the original selected photo as the character avatar or story reference.
- R3. Generate or mock a replacement cartoon image from safe descriptor data only.
- R4. Save the cartoon reference as the character visual source when available.
- R5. Use the cartoon reference, not the original photo, for future story image consistency.
- R6. Fall back to generic/manual avatar creation if extraction or replacement fails.
- R7. Keep analytics, logs, and storage free of photos, raw trait values, prompts, image bytes, and child identifiers.

**Origin actors:** Parent account holder, child or family member subject, Kahani mobile app, cartoon generation provider, story image generation provider
**Origin flows:** Temporary local photo preview, traits-only cartoon replacement, future story image consistency, unavailable/unreadable/rejected photo
**Origin acceptance examples:** local preview with no upload, cartoon swap with no saved original, story generation with cartoon reference only, fallback without raw-photo retention, metadata-only observability

---

## Scope Boundaries

- No original photo upload, provider-side photo analysis, or raw-photo persistence.
- No exact likeness claim, face matching, biometric artifact, embedding, perceptual hash, or similarity scoring.
- No full avatar editor.
- No cross-device cartoon sync in this iteration.
- No production claim that a development placeholder is AI-generated.

---

## Context & Research

### Relevant Code and Patterns

- `artifacts/mobile/app/(tabs)/characters.tsx` already owns photo selection, local extraction, retry/fallback state, and character save.
- `artifacts/mobile/services/photoExtractionGate.ts` gates local extraction behind runtime configuration and blocks production dev-mock extraction.
- `artifacts/mobile/services/photoTraitExtractor.ts` and `artifacts/mobile/services/photoTraitPolicy.ts` produce safe descriptor text from local-only traits.
- `artifacts/mobile/services/characterPrivacy.ts` strips stale `photoUri` values before storage.
- `artifacts/mobile/context/StoryContext.tsx` sanitizes characters on load and save.
- `artifacts/mobile/app/(tabs)/index.tsx` currently sends appearance descriptors to generation and explicitly leaves `characterPhotoUri` undefined.
- `artifacts/mobile/components/KahaniDesign.tsx` supports `CharacterAvatar.imageUri`, so the UI can display safe cartoon references without new component primitives.

### Institutional Learnings

- The local-photo trait extraction requirements keep original family photos local, descriptor-only, and fail-closed.
- Existing provider payload policy on the API side strips family-photo references, so mobile should add safe references without weakening backend defense in depth.

---

## Key Technical Decisions

- Add a distinct safe character image field rather than reusing `photoUri`: keeps original-photo sanitization simple and prevents old clients or storage from treating raw photos as durable references.
- Use deterministic local cartoon generation for the current implementation: it proves UX, storage, and story-handoff behavior without sending originals or blocking on a provider integration.
- Mark safe references by source: story generation can use generated-cartoon references while continuing to drop local-photo originals.
- Preserve the current fail-closed extraction gate: if safe descriptor extraction is unavailable, the flow falls back instead of creating a fake photo-derived avatar.

---

## Open Questions

### Resolved During Planning

- Smallest replacement path: use a deterministic local cartoon data URI in development/product code, clearly sourced from safe descriptor text, with provider-backed traits-only generation left as a follow-up.
- Story handoff boundary: add a safe `characterReferenceImageUri` field for generated cartoon references; keep `photoUri` forbidden and stripped.

### Deferred to Implementation

- Exact visual style of the placeholder cartoon: implementation can tune colors and initials while preserving no-original-photo input.
- Whether to send the safe cartoon reference to the API in this branch: implementation should wire mobile state first and only send it if the current API contract can accept it without weakening provider privacy tests.

---

## Implementation Units

### U1. Character Privacy Model For Safe Cartoon References

**Goal:** Make storage distinguish forbidden original photos from allowed generated cartoon references.

**Requirements:** R2, R4, R5, R7

**Dependencies:** None

**Files:**

- Modify: `artifacts/mobile/context/StoryContext.tsx`
- Modify: `artifacts/mobile/services/characterPrivacy.ts`
- Test: `artifacts/mobile/services/characterPrivacy.test.ts`

**Approach:**

- Add fields for a safe generated character image and its source.
- Keep `photoUri` stripped from stored character records.
- Allow only generated-cartoon references through storage sanitization.
- Ensure deletion removes the saved cartoon reference with the character.

**Patterns to follow:**

- Existing `sanitizeCharacterForStorage` and `sanitizeCharactersForStorage` storage boundary.

**Test scenarios:**

- Happy path: generated cartoon reference survives sanitization.
- Error path: raw `photoUri`, `file://`, `blob:`, `http://`, and `https://` original-style values are stripped.
- Edge case: unknown image source is discarded.

**Verification:**

- Stored characters can include safe cartoon image references but never raw photo fields.

### U2. Deterministic Traits-Only Cartoon Replacement Service

**Goal:** Produce a safe cartoon image reference from descriptor text without using the original photo.

**Requirements:** R3, R6, R7

**Dependencies:** U1

**Files:**

- Create: `artifacts/mobile/services/cartoonCharacter.ts`
- Create: `artifacts/mobile/services/cartoonCharacter.test.ts`

**Approach:**

- Generate an SVG data URI using non-sensitive descriptor text and the character name/relationship.
- Do not include original image URI, trait text, prompt text, or child identifiers in analytics/loggable payloads.
- Return explicit success/failure state so UI can fall back without keeping the original photo.

**Patterns to follow:**

- Existing service-level pure functions and `node:test` tests under `artifacts/mobile/services`.

**Test scenarios:**

- Happy path: descriptor-based replacement returns a data URI and generated-cartoon source.
- Edge case: empty descriptor still returns a generic cartoon for manual/generic fallback.
- Error path: raw photo-like input is rejected if accidentally passed as the descriptor.

**Verification:**

- Replacement output is based only on safe strings and contains no original photo URI.

### U3. Add Character Temporary Preview And Swap UX

**Goal:** Show the selected photo immediately, then swap it for the generated cartoon when local extraction succeeds.

**Requirements:** R1, R2, R3, R4, R6

**Dependencies:** U1, U2

**Files:**

- Modify: `artifacts/mobile/app/(tabs)/characters.tsx`

**Approach:**

- Keep selected photo URI only in component state for immediate display.
- On successful extraction, generate the cartoon replacement, clear the temporary original preview, and show the replacement image.
- On retry/fallback, clear any temporary original before manual fallback is shown.
- Save the character with the cartoon reference only when one exists.
- Show saved character avatars using the cartoon reference.

**Patterns to follow:**

- Existing photo retry/fallback state in `characters.tsx`.
- Existing `CharacterAvatar.imageUri` display support.

**Test scenarios:**

- Happy path: selecting a valid photo shows local preview, then cartoon replacement, and save stores only the cartoon reference.
- Error path: failed extraction clears temporary original and opens retry/fallback without saving original.
- Edge case: parent saves without photo and gets generic/manual avatar behavior.

**Verification:**

- Visual upload step no longer appears blank after selection.
- Search confirms no saved character path persists the original selected photo.

### U4. Story Generation Handoff For Safe Cartoon References

**Goal:** Let future story surfaces use the generated cartoon reference while keeping original photos out of generation requests.

**Requirements:** R5, R7

**Dependencies:** U1

**Files:**

- Modify: `artifacts/mobile/app/(tabs)/index.tsx`
- Modify: `artifacts/mobile/context/StoryContext.tsx`
- Modify if contract supports it: `artifacts/api-client-react` request types or generated usage sites

**Approach:**

- Store the safe cartoon reference on generated story state for reader/library fallback images.
- Include the safe reference in mobile state only when it came from the generated-cartoon source.
- Avoid sending raw `photoUri` or temporary preview URI to the API.

**Patterns to follow:**

- Current `characterPhotoUri: undefined` privacy guard in `index.tsx`.

**Test scenarios:**

- Happy path: generated story gets the safe cartoon fallback image for local reader/library display.
- Error path: character without safe cartoon reference keeps `characterPhotoUri` undefined.
- Regression: original photo fields are never sent in generation request data.

**Verification:**

- Reader/library can use cartoon fallback locally without weakening API provider-photo tests.

### U5. Docs And Verification

**Goal:** Keep the implementation traceable to privacy requirements and prove focused behavior.

**Requirements:** R1-R7

**Dependencies:** U1-U4

**Files:**

- Modify: `docs/plans/2026-05-20-003-feat-local-cartoon-character-replacement-plan.md` if implementation reveals meaningful plan drift.
- Create: `docs/solutions/local-cartoon-character-replacement.md` during `ce-compound`.

**Approach:**

- Run focused service tests and mobile typecheck.
- Review provider-photo policy tests if story-generation request shape changes.
- Document the local-preview-to-cartoon pattern after implementation.

**Test scenarios:**

- Integration: local preview, cartoon swap, save, story fallback image, and no raw-photo persistence.
- Regression: existing local-photo trait extraction tests still pass.

**Verification:**

- Focused tests pass.
- Mobile typecheck passes or any blocker is reported precisely.

---

## System-Wide Impact

- **Interaction graph:** Character creation, character storage, selected-character display, and generated story fallback images.
- **Error propagation:** Extraction or replacement failures must downgrade to retry/fallback without preserving the original photo.
- **State lifecycle risks:** Temporary selected-photo state must be cleared on success, fallback, save, and reset.
- **API surface parity:** Backend provider-photo stripping remains unchanged; safe cartoon references are mobile-local unless the API contract is deliberately extended later.
- **Integration coverage:** Service tests prove sanitization and replacement; browser/mobile UI verification should confirm the visual swap when the dev mock gate is enabled.
- **Unchanged invariants:** Original family photos never leave the device, never become stored avatars, and never become provider references.

---

## Risks & Dependencies

| Risk                                                   | Mitigation                                                                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Placeholder cartoon is mistaken for real AI generation | Label implementation as generated cartoon replacement from safe traits and keep provider-backed AI replacement as a future production enhancement if needed. |
| Safe cartoon field becomes a backdoor for raw URLs     | Sanitizer allows only generated-cartoon source and rejects known raw-photo URI classes unless explicitly marked safe.                                        |
| UI keeps stale temporary original after failure        | Clear temporary preview on every retry/fallback/save path and cover state helpers with tests where possible.                                                 |

---

## Documentation / Operational Notes

- The existing local-photo extraction requirements remain the privacy baseline.
- Provider-backed cartoon generation should be added only through a traits-only API that never accepts original images.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-20-local-cartoon-character-replacement-requirements.md](../brainstorms/2026-05-20-local-cartoon-character-replacement-requirements.md)
- Related origin: [docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md](../brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md)
- Related code: `artifacts/mobile/app/(tabs)/characters.tsx`
- Related code: `artifacts/mobile/services/characterPrivacy.ts`
- Related code: `artifacts/mobile/context/StoryContext.tsx`
