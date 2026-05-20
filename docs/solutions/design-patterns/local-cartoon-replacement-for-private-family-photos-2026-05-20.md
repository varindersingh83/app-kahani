---
title: Local cartoon replacement for private family photos
date: 2026-05-20
category: docs/solutions/design-patterns
module: artifacts/mobile character creation
problem_type: design_pattern
component: service_object
severity: high
applies_when:
  - "A user-selected family photo should affect UX without becoming durable app data"
  - "A generated visual reference is allowed but the original photo must never reach a server or provider"
  - "Async local processing can race with form state changes"
tags: [mobile, privacy, photos, character-creation, svg, async-state]
---

# Local cartoon replacement for private family photos

## Context

Kahani needs photo-based character creation to feel responsive: after a parent selects a photo, the UI should visibly react. The privacy baseline is stricter than a normal avatar upload, though. The original family photo must stay local, be short-lived, and never become a server payload, provider reference, analytics field, crash-log value, or durable character avatar.

The useful pattern is not "save the uploaded image." It is "show the uploaded image temporarily, derive a safe replacement, then persist only the replacement."

## Guidance

Use three separate concepts in the model and UI:

- Temporary original preview: component-local state only. It may use the picker URI so the parent sees immediate feedback, but it must be cleared on success, retry/fallback, save, relationship changes, and stale async completions.
- Safe descriptor: non-sensitive local extraction output. This can influence the replacement but should not include raw image URIs, identity claims, biometric artifacts, or sensitive trait labels.
- Generated cartoon reference: the only durable visual source. Store it under an explicit safe field such as `characterImageUri` plus `characterImageSource: "generated-cartoon"` rather than reusing a raw-photo field like `photoUri`.

Keep sanitizer rules asymmetric:

- Strip `photoUri` unconditionally from character storage.
- Preserve generated cartoon references only when the source is explicit and the URI matches the exact safe format produced by the app.
- Reject active or externally linked SVG content, including embedded `data:image`, `base64,`, event-handler attributes, `foreignObject`, `style`, `href`, `src`, `url(...)`, and network/file/blob references.

Render generated SVG cartoons through a shared image abstraction. React Native `Image` is not a reliable cross-platform SVG renderer, so the abstraction should route SVG XML data URIs through `react-native-svg` and leave normal image URLs to `Image`.

Guard async extraction with current form state. If a parent starts photo extraction, then switches from Child to Mom/Dad or picks another photo before the first extraction finishes, the stale completion must not repopulate child-only image state.

## Why This Matters

Mixing temporary originals and safe generated references creates privacy regressions. A field named like a durable avatar will eventually be displayed, synced, logged, or sent unless the model makes its trust level explicit.

The async guard matters because local extraction can complete after the UI has moved on. Without a relationship/current-attempt check, a child photo replacement can be saved onto a non-child character or overwrite a newer selection.

## When to Apply

- Photo upload is used as input, but raw upload storage is forbidden.
- The product needs visual continuity in later screens or generated stories.
- A local or provider-backed replacement can be produced from safe descriptors.
- The UI allows users to change form mode while async photo processing is pending.

## Examples

Bad storage shape:

```ts
{
  photoUri: selectedPickerUri,
  appearanceSource: "local-photo",
}
```

Better storage shape:

```ts
{
  appearance: safeDescriptor,
  appearanceSource: "local-photo",
  characterImageUri: generatedCartoonDataUri,
  characterImageSource: "generated-cartoon",
}
```

Bad async shape:

```ts
const extraction = await extractPhotoTraits(asset);
setCharacterImageUri(createReplacement(extraction).imageUri);
```

Better async shape:

```ts
const attemptId = nextPhotoAttempt();
const extraction = await extractPhotoTraits(asset);

if (currentRelationship() !== "child" || currentAttempt() !== attemptId) {
  clearTemporaryPhotoState();
  return;
}

setCharacterImageUri(createReplacement(extraction).imageUri);
```

## Related

- `docs/brainstorms/2026-05-20-local-cartoon-character-replacement-requirements.md`
- `docs/plans/2026-05-20-003-feat-local-cartoon-character-replacement-plan.md`
- `docs/brainstorms/2026-05-19-local-photo-trait-extraction-requirements.md`
