---
date: 2026-05-25
topic: behavior-story-library
---

# Behavior Story Library

## Summary

Build a user-facing library of prewritten behavior story concepts for the 100 common age 2-6 behavior issues. Each issue should have five real published children's books as references in JSON and up to three approved story concepts saved for parents to browse later.

---

## Problem Frame

The current story-generation work improves prompts and QA, but generated stories can still feel generic or behaviorally weak. Parents need stories that feel like real children's books while still reflecting practical, expert-aligned behavior guidance.

The user has a 100-row behavior issue source and wants to scale a manual experiment: choose one behavior issue, identify five popular children's books related to that issue, then generate three short story concepts inspired by those reference books. The goal is to create a reusable story library rather than depending only on live generation quality.

---

## Actors

- A1. Parent reader: Browses the app for a behavior issue and reads one of the prewritten story concepts with their child.
- A2. Library generator: Automatically processes the 100 behavior issues into story-library artifacts.
- A3. Story judge: Separately evaluates generated story concepts and rejects weak concepts before they enter the library.
- A4. Human reviewer: Reviews Markdown files and decides what needs later refinement.

---

## Key Flows

- F1. Automatic issue processing
  - **Trigger:** The library generation job is run against the 100 behavior issues.
  - **Actors:** A2, A3
  - **Steps:** For each issue, find five real published children's books, generate batches of candidate story concepts, judge each concept, keep passing concepts, and stop when three concepts pass or the max attempt limit is reached.
  - **Outcome:** Each behavior issue has JSON data plus a Markdown review file, with approved concepts saved and incomplete issues marked for manual review.
  - **Covered by:** R1, R2, R3, R4, R5, R8

- F2. Parent library browsing
  - **Trigger:** A parent wants a story for a specific behavior issue.
  - **Actors:** A1
  - **Steps:** The parent browses or searches behavior issues, opens an issue, and chooses from the approved story concepts available for that issue.
  - **Outcome:** The parent can read a story concept without waiting for live AI generation.
  - **Covered by:** R1, R6, R7, R9

- F3. Human review
  - **Trigger:** A reviewer wants to inspect generated concepts.
  - **Actors:** A4
  - **Steps:** The reviewer opens the Markdown file for one behavior issue, reads the three concepts together, and flags any concept or issue that needs editing.
  - **Outcome:** Review focuses on story quality without exposing reference-book metadata in the Markdown surface.
  - **Covered by:** R6, R7, R8, R10

---

## Requirements

**Library scope**
- R1. The first library version must cover the 100 behavior issues from the behavior source data.
- R2. Each behavior issue should target three approved story concepts.
- R3. If fewer than three concepts pass automatic QA after max attempts, save the approved partial set and mark the issue as needing manual review.

**Reference books**
- R4. Each behavior issue must store five real published children's books in JSON as reference books.
- R5. The same reference book may be reused across multiple behavior issues when it is genuinely relevant.
- R6. Reference books must not appear in the Markdown review files for v1.

**Story concepts**
- R7. Each story concept must use the short narrative concept format: title, core theme, story summary, optional repeated tools or rituals, ending message, and placeholders.
- R8. Story concepts should use placeholders such as `{child_name}` and `{parent_name}` rather than fixed child names.
- R9. Story concepts are not required to be 12-page manuscripts in v1; they are reusable concepts that can later be expanded into page-by-page books.

**Automatic QA**
- R10. A separate judge prompt must evaluate story concepts, not the same prompt that generated them.
- R11. Failed concepts must not be stored in the user-facing library output.
- R12. If a batch produces fewer than three approved concepts, the system should generate more candidate concepts until the issue has three approved concepts or reaches the max attempt limit.
- R13. The story judge must evaluate whether the parent action makes expert sense, the story reads like a real child-facing scene, the child progresses through believable action, the ending is earned, and the story avoids unsafe or strange details.

**Artifacts**
- R14. The generated library must produce a JSON artifact that contains each behavior issue, its five reference books, approved story concepts, QA metadata, generation status, and the corresponding Markdown filename.
- R15. The generated library must produce one Markdown file per behavior issue containing only the issue title and the approved story concepts for that issue.
- R16. The Markdown file should group the three concepts together so a human can review one behavior issue at a time.

---

## Acceptance Examples

- AE1. **Covers R2, R3, R12.** Given a behavior issue has only two concepts pass QA after the max attempt limit, when the library is written, the JSON contains those two approved concepts and marks the issue as needing manual review with one missing concept.
- AE2. **Covers R4, R5.** Given a published book is relevant to both transition meltdowns and separation anxiety, when both issues are processed, the same book may appear in both JSON records.
- AE3. **Covers R6, R14, R15.** Given a behavior issue has five reference books and three approved concepts, when artifacts are written, the JSON includes the reference books and Markdown filename, while the Markdown file includes only the behavior issue and story concepts.
- AE4. **Covers R10, R11, R13.** Given a candidate story uses an unsafe parent action or resolves the behavior without a believable child action, when the judge evaluates it, the concept fails and is excluded from the final library output.

---

## Success Criteria

- The library produces a browsable set of behavior-specific story concepts that feel closer to real children's books than generic AI advice.
- Each stored story concept has passed a separate QA judgment for parenting logic, story flow, safety, and child-facing quality.
- Human review can happen from clean Markdown files without needing to read JSON or prompt logs.
- The JSON artifact is structured enough for later app integration without redoing the content-generation work.

---

## Scope Boundaries

- V1 stores story concepts, not fully illustrated books.
- V1 does not require 12-page manuscripts for every concept.
- V1 does not expose reference-book metadata in Markdown.
- V1 does not require deep analysis of why each reference book influenced each concept.
- V1 does not require manual review before saving approved automatic results.
- V1 does not require a production database table; a durable generated JSON artifact is enough for the first pass.
- V1 should not copy text, scenes, or distinctive expression from reference books; references are for broad inspiration and patterning only.

---

## Key Decisions

- Prewritten library over prompt-only training: The first product target is a user-facing library of finished story concepts, not only better live generation.
- Three variants per issue: Each behavior issue targets three approved concepts so parents have choice.
- Reference-derived variants: The three variants should emerge from the five reference books instead of being forced into fixed categories.
- Real books only: Reference books must be real published children's books; invented titles are not allowed.
- Automatic QA loop: The generator should keep producing more candidates until three concepts pass or the issue needs manual review.
- Partial save: Good approved concepts should not be discarded just because an issue fails to reach all three concepts automatically.
- Markdown is for story review: Markdown files should omit reference books and focus only on the story concepts.

---

## Dependencies / Assumptions

- The 100 behavior issues are available from the existing age 2-6 behavior source data.
- A book-finding step can produce five real published children's books per behavior issue, with enough metadata to avoid obvious hallucinations.
- A separate judge prompt can reject weak stories reliably enough for a first automatic pass.
- Later planning will decide exact artifact paths, retry limits, score thresholds, and app integration details.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Needs research] What verification source should be used to reduce hallucinated or misattributed children's books?
- [Affects R12][Technical] What max attempt limit and batch size should the automatic loop use?
- [Affects R13][Technical] What exact JSON response should the story judge return for pass/fail decisions?
- [Affects R14, R15][Technical] What repo-relative output path should hold the generated JSON and Markdown artifacts?
