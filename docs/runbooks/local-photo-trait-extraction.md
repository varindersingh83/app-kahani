---
title: Local photo trait extraction runbook
date: 2026-05-20
---

# Local Photo Trait Extraction Runbook

## What Operators Can See

Operators may use metadata only:
- App version.
- Platform.
- Model version.
- Extraction attempted/succeeded/failed.
- Failure category.
- Retry count.
- Duration bucket.
- Manual fallback used.

Operators must not inspect or collect:
- Photos.
- Photo URIs, data URLs, blob URLs, or file paths.
- Names.
- Prompts.
- Extracted descriptors or manual characteristics.
- Generated images or story text.
- Child IDs or character IDs.

## Local Testing

Production defaults are fail closed. To test the happy path locally without a real model, run the mobile app with:

```bash
EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION=true \
EXPO_PUBLIC_LOCAL_PHOTO_EXTRACTION_DEV_MOCK=true \
pnpm run dev:mobile
```

The development mock returns a synthetic safe descriptor for any sufficiently large photo. It does not analyze image content and exists only to test consent, retry, storage, and UI behavior.

To test the fallback path, leave extraction disabled:

```bash
pnpm run dev:mobile
```

## Debugging Failures

Use metadata categories only:
- `model_unavailable`: extraction gate is closed, unsupported, or no approved model exists.
- `unsupported_platform`: the platform is not allowed for the configured model.
- `photo_too_small`: the local input is below the minimum supported dimensions.
- `low_confidence`: model output did not meet confidence policy.
- `policy_rejected`: model output included disallowed fields or values.
- `manual_fallback_required`: adapter could not produce trusted traits.

Do not ask the parent to send the photo. Ask for platform, app version, and the visible failure category only.

## Incident Response

If there is any suspicion that photos or descriptors reached logs, analytics, storage, or a provider:

1. Disable `EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION`.
2. Stop promotion of the affected build.
3. Review analytics schema and server logs for forbidden keys only, not content.
4. Rotate provider credentials if provider payload exposure is suspected.
5. Run deletion workflows for affected user-linked data when available.
6. Add a regression test before re-enabling extraction.

## Release Gate

- Consent gate blocks app use until accepted.
- Production photo picker is hidden when extraction is disabled.
- Development mock cannot run in production.
- Approved model is documented in `docs/security/local-photo-extraction-model-evaluation.md`.
- `artifacts/mobile/services/analytics.test.ts` rejects content-bearing payloads.
- `artifacts/mobile/services/photoTraitPolicy.test.ts` rejects sensitive traits.
- Provider-photo tests pass for story-sheet generation.
- Older `book-generation` pipeline does not pass `photoUri` as an image reference.
- Local storage contains no saved character `photoUri`, data URL, blob URL, or file path after save/delete.
