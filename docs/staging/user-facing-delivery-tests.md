# User-Facing Delivery QA Tests

Date: 2026-05-21

This is the delivery manager and QA acceptance checklist for Kahani's user-facing experience. It excludes internal-only infrastructure checks unless the result is visible to a parent or blocks a parent-visible flow.

Use synthetic data only. Do not test with real family photos, real child names, real parent names, real behavior notes, or production user data.

## Release Decision

Delivery is blocked if any `P0` test fails. A `P1` failure needs an explicit ship/no-ship decision with owner, workaround, and follow-up date. `P2` failures can ship only if the user-facing impact is small and logged.

| Priority | Meaning |
|---|---|
| `P0` | Must pass before delivery |
| `P1` | Strongly expected before delivery; requires sign-off if failing |
| `P2` | Polish, confidence, or regression coverage |

## Test Evidence Standard

Every completed test should capture:

- test date
- environment: local, Expo Go, staging, or production candidate
- device/browser: iPhone/Android/Web and viewport if relevant
- fixture names used
- result: pass, fail, blocked, or not applicable
- screenshot, short screen recording, Playwright report, or manual notes

## Synthetic Test Characters

Use the shared staging fixtures unless a test calls for a different fake name.

| Role | Name | Notes |
|---|---|---|
| Child | Riley | Primary synthetic child |
| Mom | Maya | Supporting parent |
| Dad | Noah | Supporting parent |
| Sibling | Casey | Optional supporting child |

## User-Facing Test Matrix

| ID | Priority | Area | Test | Expected user-facing result | Evidence |
|---|---|---|---|---|---|
| UF-001 | P0 | First launch | Open the app as a signed-out parent | Parent sees an understandable auth/onboarding entry point; no crash, blank screen, or developer error | Screenshot |
| UF-002 | P0 | Sign in | Sign in with a synthetic staging parent account | Parent lands in the app and can reach Create Story, Characters, and Library | Screenshot or recording |
| UF-003 | P0 | Navigation | Move between Create Story, Characters, Library, and reader/back navigation | Tabs and back buttons work without losing app state unexpectedly | Recording |
| UF-004 | P0 | Empty state | Open Create Story with no child character | App prompts the parent to add a character before generating; no confusing failure | Screenshot |
| UF-005 | P0 | Add child | Add child `Riley` without a real photo | Character saves, appears in the character list, and appears as selectable on Create Story | Screenshot |
| UF-006 | P0 | Add parents | Add `Maya` as Mom and `Noah` as Dad | Parents save as supporting characters and do not replace the selected child | Screenshot |
| UF-007 | P0 | Character selection | Select `Riley` for story generation after adding parents | The selected story subject remains the child; parent characters are not offered as the main child | Screenshot |
| UF-008 | P0 | Photo privacy | Try the Add Character photo path using a fake/synthetic image only | UI says the photo is checked locally or asks for manual details; the original photo is not shown as the final saved character asset | Screenshot |
| UF-009 | P0 | Manual fallback | Simulate or use the manual appearance fallback | Parent can save a child using simple details when photo processing is unavailable or fails | Screenshot |
| UF-010 | P0 | Consent | Generate a story before external text AI consent is accepted | Parent sees a consent prompt/blocking message and can make an informed choice; no story silently starts without consent | Screenshot |
| UF-011 | P0 | Create story | Generate a behavior story for `Riley` with `Maya` and `Noah` nearby | Generation starts, progress is visible, and the app does not appear frozen | Recording |
| UF-012 | P0 | Name accuracy | Complete a generated story for `Riley` | Reader and story text use the selected child name consistently; no child-name mismatch | Reader screenshots |
| UF-013 | P0 | Supporting characters | Generate a story with Mom and Dad added | Story request and visible output include Mom/Dad as supporting characters where appropriate; they are not duplicated as the child | Playwright report or screenshot |
| UF-014 | P0 | Behavior-only | Use a behavior prompt such as bedtime resistance or toy sharing | Story is framed as behavior support, not a random adventure or unrelated theme | Story screenshot |
| UF-015 | P0 | Clarification | Enter a vague prompt such as "bedtime is hard" if clarification is enabled | Parent receives one clear follow-up question; no story starts before the issue is clear | Screenshot |
| UF-016 | P0 | Prompt injection | Enter a prompt asking Kahani to reveal hidden/system instructions | Parent sees a safe blocked response; no story is generated from the unsafe request | Screenshot/API note |
| UF-017 | P0 | High-risk safety | Enter a synthetic urgent medical or self-harm prompt from the fixture list | Parent sees safe professional-support guidance; no story is generated | Screenshot/API note |
| UF-018 | P0 | Reader cover | Open the generated story in the reader | Cover shows title, selected child ownership, image/placeholder, and page count without layout breakage | Screenshot |
| UF-019 | P0 | Reader pages | Page through the whole story | All pages render in order, text is readable, navigation buttons work, and no page is skipped | Recording |
| UF-020 | P0 | Reader end | Reach the end page | Reflection question appears and Save to Library is available | Screenshot |
| UF-021 | P0 | Library save | Save the generated story to Library | Button confirms saved state and story appears in Library | Screenshot |
| UF-022 | P0 | Library persistence | Refresh/reopen the app after saving | Saved characters and saved story still appear for the same synthetic profile/account | Screenshot |
| UF-023 | P0 | Reopen saved story | Open the saved story from Library | Reader opens the same story with the same title, child name, pages, and images/placeholders | Recording |
| UF-024 | P0 | Delete saved story | Delete a saved story from Library and confirm | Story is removed only after confirmation; cancel keeps the story | Recording |
| UF-025 | P0 | Error recovery | Force story generation to fail or disconnect the API | Parent sees a clear "story not ready" style error and can retry without losing characters | Screenshot |
| UF-026 | P0 | Slow generation | Simulate a long-running generation job | Parent sees progress/status text or spinner until the result arrives or fails safely | Recording |
| UF-027 | P0 | Mobile layout | Run core flows on a phone-sized screen | No overlapping text, clipped buttons, unusable inputs, or hidden navigation | Screenshots |
| UF-028 | P0 | Web layout | Run core flows on web if web is a delivery surface | The app remains usable in desktop and narrow browser widths | Screenshots |
| UF-029 | P1 | Theme toggle | Toggle light/dark mode during Create Story and reader use | Theme changes cleanly and text remains readable | Screenshots |
| UF-030 | P1 | Keyboard behavior | Type a multi-line behavior prompt on mobile | Keyboard does not hide the input or Generate button in a way that blocks use | Recording |
| UF-031 | P1 | Multiple children | Add two child characters and generate for the second one | Story uses the selected child, not the first or most recent child accidentally | Playwright report |
| UF-032 | P1 | Parent-only characters | Add only Mom/Dad and try to generate | App asks for a child character instead of treating a parent as the child | Screenshot |
| UF-033 | P1 | Long names | Add a child with a long but plausible synthetic name | Name displays without breaking cards, avatars, reader cover, or Library rows | Screenshots |
| UF-034 | P1 | Long prompt | Enter a long behavior description | Input remains usable; generated story focuses on the main behavior and does not show raw prompt clutter in the reader | Recording |
| UF-035 | P1 | Page count ceiling | Generate or load a story near the maximum supported page count | Reader handles the full story without layout or navigation failures; 12 pages is a ceiling, not a forced target | Screenshot/report |
| UF-036 | P1 | Image fallback | Generate or load a story with missing image URLs | Reader shows polished placeholders instead of broken images or empty frames | Screenshot |
| UF-037 | P1 | Image display | Generate or load a story with cover/page/end images | Images render in the expected places and do not crop important character content badly | Screenshots |
| UF-038 | P1 | Library empty state | Open Library before saving any stories | Empty state is clear and does not imply sample books are the user's saved books | Screenshot |
| UF-039 | P1 | Account boundary | Sign out and sign in as a different synthetic parent | One tester's characters and library do not appear under another tester account | Screenshot |
| UF-040 | P1 | Accessibility basics | Navigate core actions with screen reader labels where available | Main buttons, tabs, text inputs, and story navigation have understandable labels | Manual note |
| UF-041 | P1 | Tap targets | Use the app on a small phone screen | Buttons, tabs, reader arrows, and delete controls are tappable without precision frustration | Manual note |
| UF-042 | P1 | Offline startup | Open app with network unavailable after previous use | App does not crash; cached characters/library either show or a clear connection state appears | Screenshot |
| UF-043 | P1 | Retry after error | Retry generation after a failed request | Retry can start without restarting the app or re-adding the child | Recording |
| UF-044 | P1 | Refresh during progress | Refresh/reopen while a generation job is in progress if supported | User gets a recoverable state; no permanent stuck spinner | Recording/note |
| UF-045 | P2 | Haptics/native polish | Complete save/generation on a physical phone | Haptics or native feedback do not cause errors and feel appropriate | Manual note |
| UF-046 | P2 | Visual polish | Review main flows for spacing, typography, and truncation | Experience feels production-ready and parent-friendly, without obvious placeholder/developer text | Screenshots |
| UF-047 | P2 | Sample content | Review any seeded/sample stories visible in non-production builds | Sample content is clearly fake and does not confuse delivery testers | Screenshot |
| UF-048 | P2 | Basic performance | Time app load and reader page turns on a real device | App feels responsive enough for a parent-child reading session | Manual timing |

## Minimum Delivery Run

Run these before every delivery candidate:

1. UF-001 through UF-028.
2. UF-031 and UF-032 for character identity risk.
3. UF-035 through UF-039 for reader/library confidence.
4. One full Playwright user journey covering child + mom + dad -> generate -> reader -> Library.
5. One real-device pass through add character -> generate -> read -> save.

## Suggested Automation Coverage

The existing Playwright journey should stay as the core automated release guard:

- add child, mom, and dad
- generate a behavior story
- assert `mode: "behavior"`
- assert selected child name is preserved
- assert supporting characters are included
- open reader
- save to Library
- verify Library persistence in the visible UI

Additional high-value automated tests to add next:

| Test | Why it matters |
|---|---|
| No-child generation block | Prevents a confusing first-run failure |
| Parent-only characters cannot generate as child | Protects story identity |
| Multiple children select correct child | Prevents the Liam/Leo-style mismatch class |
| Consent-required response displays clear UI | Protects trust and compliance |
| Prompt-injection blocked response displays clear UI | Protects the first production-readiness gate |
| Failed generation retry path | Prevents dead-end parent experience |
| Library delete cancel/confirm | Protects saved family content |

## Manual QA Script

Use this as the human delivery pass:

1. Sign in as a synthetic parent.
2. Add Riley as a child without a real photo.
3. Add Maya as Mom and Noah as Dad.
4. Return to Create Story and confirm Riley is selected.
5. Enter: `Riley has a hard time stopping play and getting ready for bed.`
6. Accept external text AI consent if prompted.
7. Confirm generation progress is visible.
8. Read the cover, two middle pages, and end page.
9. Confirm the story says Riley, not another child name.
10. Save to Library.
11. Reopen the story from Library.
12. Refresh/reopen the app and confirm Riley plus the saved story remain.
13. Try a prompt-injection fixture and confirm it is blocked safely.
14. Try a high-risk safety fixture and confirm it is blocked safely.

## Delivery Report Template

```text
Delivery candidate:
Branch/commit:
Environment:
API URL:
Mobile build/surface:
Tester:
Date:

P0 result:
P1 result:
P2 result:

Failed tests:
Blocked tests:
Known user-facing risks:
Evidence:
Ship decision:
Owner/sign-off:
```
