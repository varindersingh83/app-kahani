# User-Facing Delivery E2E Suite

This suite turns the delivery checklist into deterministic Playwright coverage
for the local Expo web surface.

Source checklist:

- `docs/staging/user-facing-delivery-tests.md`

Plan:

- `docs/plans/2026-05-21-001-feat-user-facing-delivery-e2e-plan.md`

## Run

```bash
npm run test:e2e -- tests/e2e/delivery
```

The Playwright config writes screenshots, traces, and reports under
`output/playwright`. Each delivery test title includes the UF IDs it covers,
and each implemented test attaches at least one screenshot named after those
UF IDs.

## Automated Coverage

| Spec | Checklist IDs | Notes |
| --- | --- | --- |
| `01-onboarding-navigation.spec.ts` | UF-001, UF-003, UF-004 | First launch consent, app navigation, no-child generation block. |
| `02-characters.spec.ts` | UF-005, UF-006, UF-007, UF-008, UF-009, UF-031, UF-032, UF-033 | Synthetic child and parent characters, selection, privacy copy, long-name smoke. |
| `03-story-generation.spec.ts` | UF-010, UF-011, UF-012, UF-013, UF-014, UF-015, UF-026, UF-034 | Mocked generation, text-AI consent retry, progress, clarification, long prompt. |
| `04-reader-library.spec.ts` | UF-018, UF-019, UF-020, UF-021, UF-022, UF-023, UF-024, UF-035, UF-036, UF-037, UF-038, UF-039 | Reader navigation, save, reopen, delete, profile storage boundary. |
| `05-error-safety.spec.ts` | UF-016, UF-017, UF-025, UF-042, UF-043 | Guardrail and failed-generation states surfaced in the UI. |
| `06-layout-accessibility.spec.ts` | UF-027, UF-028, UF-029, UF-040, UF-046, UF-047, UF-048 | Mobile/desktop viewport smoke, theme toggle, basic labels and sample Library state. |

The existing `tests/e2e/character-story-library.spec.ts` remains the core
release guard for the full child + mom + dad -> generate -> reader -> Library
journey and now uses the same helper infrastructure.

## Manual Or Native Evidence

These checklist rows still require manual delivery evidence because local web
Playwright cannot prove the native behavior:

- UF-030: physical phone keyboard behavior.
- UF-041: real tap comfort on device.
- UF-045: native haptics.
- Provider-auth-only social sign-in paths that require real Clerk/social login.

Web tests may cover the nearest visible state for these areas, but they should
not be marked fully automated until real-device or staging-provider evidence is
attached to the release run.

## Data Policy

All fixtures are synthetic and live in `fixtures.ts`. Do not add real family
names, real photos, production behavior notes, or provider-backed generation to
this suite.
