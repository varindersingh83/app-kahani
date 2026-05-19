# Local Photo Extraction Model Evaluation

Status: no model approved for production.

Kahani must stay generic-only until a bundled, auditable iOS model passes this checklist. Family photos are sensitive; the production app must not expose a photo picker or local trait extraction unless every required item below is satisfied.

## Required Launch Criteria

- Runs fully offline on device. No image bytes, embeddings, crops, or descriptors leave the device during extraction.
- Ships as an auditable bundled model in the app binary or as an app-store-reviewed update. No runtime model downloads for v1.
- iOS-only for the first launch gate.
- Median extraction duration is under one second on the oldest supported device class.
- Produces only approved coarse traits: broad hair color, broad skin tone range, clothing colors, glasses presence, and approximate age band.
- Rejects the whole descriptor if output includes disallowed categories such as identity, ethnicity, race, religion, health, disability, attractiveness, emotion, location, exact age, or gender identity.
- Deletes or releases photo input immediately after character creation. Persistent app state may store only the approved local descriptor and a photo-derived indicator.
- Production UI may show only a generic local indicator, not raw trait text.
- Analytics records only attempted/succeeded/failed, failure category, model version, duration bucket, platform, app version, and whether generation followed extraction.

## Current Decision

No production model is selected. The production gate therefore remains closed and the app ships the generic character flow only.

## Future Validation Artifacts

Before enabling production extraction, add:

- Candidate model name, version, license, source repository, and checksum.
- Device benchmark table with p50/p95 extraction time.
- Offline/network inspection evidence.
- Red-team output samples showing disallowed categories are rejected.
- App-store privacy manifest updates and consent copy review.
