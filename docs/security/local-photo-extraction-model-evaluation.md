---
title: Local photo extraction model evaluation
date: 2026-05-20
status: draft
---

# Local Photo Extraction Model Evaluation

## Production Decision

Production local photo extraction is disabled until a specific on-device model is approved in this document. The app may use the development mock only for local flow testing. The mock is not a vision model and must never be enabled in production.

## Non-Negotiable Requirements

- Runs fully on device with no network calls.
- Bundled with the app or provided by the operating system locally.
- Auditable license, source, model card, and dependency chain.
- No face recognition, identity matching, face embeddings, perceptual hashes, biometric templates, or likeness scoring.
- Emits only typed coarse fields that pass `artifacts/mobile/services/photoTraitPolicy.ts`.
- Must not emit race, ethnicity, health, disability, body size, attractiveness, emotion, exact age, identity, or sensitive inference.
- Bounded latency target: under one second on supported iOS devices for a square mobile photo.
- Fails closed on low confidence, multiple subjects, non-human images, dark/blurry/cropped photos, unsupported platform, timeout, or adapter error.
- Works without retaining the original photo after processing.

## Current Candidate

No production model is approved.

| Field | Value |
| --- | --- |
| Candidate name | TBD |
| Version | TBD |
| License | TBD |
| Platforms | iOS v1 only unless separately approved |
| Network behavior | Must be offline |
| Approval status | Rejected until filled and reviewed |

## Test Fixtures

Use synthetic, licensed, or generated non-family images only. Do not add real child or family photos to the repo. Fixture names may encode expected categories, but fixture contents must not be sensitive.

Required fixture classes:
- Clear single-person child-like illustration/photo substitute.
- Clear adult caregiver substitute.
- Non-human image.
- Multiple-person ambiguous image.
- Blurry, dark, or heavily cropped image.
- Low-resolution image under the minimum size.

## Approval Checklist

- [ ] License permits bundling in the app.
- [ ] Model/dependency source can be reviewed.
- [ ] Offline behavior verified with network disabled.
- [ ] Sensitive outputs cannot be produced by the adapter type.
- [ ] Policy tests reject disallowed fields and values.
- [ ] Latency measured on target iOS device.
- [ ] Failure categories are deterministic enough for metadata-only analytics.
- [ ] Production config has `EXPO_PUBLIC_LOCAL_PHOTO_MODEL_APPROVED=true` only after review.
- [ ] Development mock is disabled in production.

## Rollback

Disable `EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION` or remove model approval config. The app must return to generic/manual character creation without losing saved characters.
