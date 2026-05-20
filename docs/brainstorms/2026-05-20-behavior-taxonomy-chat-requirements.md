---
date: 2026-05-20
topic: behavior-taxonomy-chat
---

# Behavior Taxonomy Chat

## Summary

Kahani will replace the single story prompt box with a hybrid guided chat that turns parent free text into a structured behavior classification before generation. The system will identify scene, visible behavior, underlying mechanism, strategy, child story skill, and short parent guidance, then generate one focused story for the most emotionally intense visible behavior.

---

## Problem Frame

Parents describe child behavior through messy real-life moments: "won't change clothes at bedtime," "keeps asking me to stay," "bedtime is awful," or "screams when I say no." These are often surface descriptions of broader behavior mechanisms such as transition resistance, separation anxiety, autonomy/control, fear, limit testing, frustration tolerance, sensory discomfort, jealousy, impulse control, or skill deficit.

If Kahani treats the surface phrase as the whole problem, it risks generating generic stories that miss the reason the child is struggling. The product needs a behavior engine that can map parent language into a curated taxonomy, choose the primary story focus, apply mainstream child-development strategy, and still feel like a simple story creation flow rather than a therapy or parenting-plan dashboard.

---

## Actors

- A1. Parent account holder: Describes the behavior problem in natural language and reads the generated story to the child.
- A2. Child listener: Practices the target behavior skill through story rather than direct instruction.
- A3. Kahani behavior classifier: Interprets the parent prompt into scene, surface behavior, mechanism, strategy, and target outcome.
- A4. Kahani story generator: Produces a focused story from the selected classification.
- A5. Kahani operator/editor: Maintains the curated taxonomy and mainstream child-development guidance.

---

## Key Flows

- F1. Clear behavior prompt
  - **Trigger:** Parent enters a specific behavior issue in the guided chat.
  - **Actors:** A1, A3, A4
  - **Steps:** Kahani screens for safety, extracts scene and visible behavior, maps the behavior to one or more mechanisms, selects the most emotionally intense visible behavior, attaches the likely mechanism and strategy, shows a short focus note, and generates one story.
  - **Outcome:** Parent gets a focused story based on the right behavior strategy without extra questions.
  - **Covered by:** R1, R2, R3, R4, R5, R9, R13

- F2. Vague or low-confidence prompt
  - **Trigger:** Parent says something broad such as "bedtime is awful" or "he never listens."
  - **Actors:** A1, A3
  - **Steps:** Kahani asks one clarifying question in the chat, uses the parent answer to map to the closest safe category, and proceeds if confidence is sufficient.
  - **Outcome:** Kahani avoids generating weak generic stories from vague prompts while keeping the flow short.
  - **Covered by:** R6, R7, R8, R11

- F3. Multiple mechanisms in one prompt
  - **Trigger:** Parent describes several behaviors or likely mechanisms in one message.
  - **Actors:** A1, A3, A4
  - **Steps:** Kahani detects secondary issues, auto-picks the most emotionally intense visible behavior as the primary story focus, uses the expert strategy for the likely underlying mechanism, and keeps secondary issues out of the story.
  - **Outcome:** The story is focused and useful instead of blending several behavior problems into one muddy narrative.
  - **Covered by:** R4, R5, R10, R12, R14

- F4. Safety or developmental red flag
  - **Trigger:** Parent describes high-risk safety behavior, medical/developmental red flags, or concerns outside normal common behavior support.
  - **Actors:** A1, A3
  - **Steps:** Kahani blocks high-risk story generation with urgent/professional guidance, or provides referral language for developmental/medical concerns without making a behavior-correction story.
  - **Outcome:** Kahani does not turn serious safety or developmental issues into a story substitute for care.
  - **Covered by:** R15, R16, R17

---

## Requirements

**Guided chat flow**
- R1. Story creation must use a hybrid guided chat rather than only a static prompt box.
- R2. Clear parent prompts must be able to proceed without a required clarifying question.
- R3. Before generation, Kahani must briefly state the story focus in parent-friendly language.
- R4. The chat must support at least one Kahani clarification and one parent answer before generation.
- R5. The chat must stay narrowly scoped to story creation, not open-ended parenting therapy or general advice.

**Behavior classification**
- R6. Kahani must classify parent prompts into scene or context, visible surface behavior, underlying mechanism, mainstream strategy, child story skill, parent guidance, and target outcome.
- R7. Vague or low-confidence prompts must trigger one clarifying question before generation.
- R8. After one clarification, Kahani must either map to the closest safe known category or decline if the prompt remains outside safe/common behavior support.
- R9. The taxonomy must support common scenes such as bedtime, meals, screens, bath, school dropoff, public places, car seat, sharing, sibling play, cleanup, hygiene, and transitions.
- R10. The taxonomy must support mechanisms such as transition resistance, separation anxiety, autonomy/control, fear, limit testing, frustration tolerance, impulse control, sensory discomfort, jealousy, attention seeking, and skill deficit.
- R11. Parent free text must normalize into curated taxonomy categories; the LLM must not invent unlimited behavior categories as source-of-truth.

**Primary issue selection**
- R12. When a prompt contains multiple behavior issues, Kahani must auto-pick the most emotionally intense visible behavior as the primary story focus.
- R13. If the intense visible behavior is likely a symptom of an underlying mechanism, the story must address the visible behavior using the strategy for the likely mechanism.
- R14. Secondary detected issues must not be blended into the generated story for v1.

**Expert strategy and story output**
- R15. Strategies must come from mainstream child-development consensus, not clinical diagnosis or named therapy claims.
- R16. Each taxonomy entry must include a child story skill that defines what the child practices inside the story.
- R17. Each taxonomy entry must include one short parent guidance note that aligns with the same strategy.
- R18. The story should show practice and progress, not guarantee permanent behavior correction.
- R19. The parent-facing note must be brief, practical, and non-clinical.
- R20. Generated stories must remain story-first: the behavior skill should emerge through action, ritual, co-regulation, choice, repair, or practice rather than direct instruction.

**Safety and red flags**
- R21. High-risk safety prompts must be blocked with urgent or professional guidance instead of story generation.
- R22. Medical or developmental red flags must not become behavior-correction stories; Kahani should use referral language such as talking to a pediatrician or qualified professional.
- R23. Normal common behavior prompts should proceed through the taxonomy and story flow.

**Persistence and privacy**
- R24. Kahani may save the classification privately with the generated story for future continuity, quality review, or later library improvements.
- R25. V1 Library must not show behavior taxonomy labels by default.
- R26. Saved classification must not include raw parent prompt text if a normalized category, scene, and strategy are sufficient.

---

## Acceptance Examples

- AE1. **Covers R6, R9, R10, R13.** Given the parent says "my child won't sleep alone," when Kahani classifies the prompt, it may use bedtime as the scene and separation anxiety as the likely mechanism.
- AE2. **Covers R6, R9, R10, R13.** Given the parent says "my child won't stop playing to get ready for bed," when Kahani classifies the prompt, it may use bedtime as the scene and transition resistance as the mechanism.
- AE3. **Covers R7, R8.** Given the parent says "bedtime is awful," when Kahani cannot confidently classify the issue, it asks one clarifying question before generation.
- AE4. **Covers R12, R13, R14.** Given the parent says "my child won't change clothes, asks me to stay, and screams when bedtime starts," when Kahani detects multiple issues, it selects the screaming/meltdown as the primary visible behavior and uses the likely mechanism strategy rather than blending all issues into one story.
- AE5. **Covers R15, R16, R17, R20.** Given the selected issue is bedtime transition resistance, when Kahani generates a story, the parent note and story both align around a predictable transition or bridge ritual.
- AE6. **Covers R18.** Given a behavior story is generated, when the story ends, it shows the child practicing a better response with support, not being permanently "fixed."
- AE7. **Covers R21, R22.** Given the prompt includes self-harm, serious violence, loss of speech, weight loss, or other red flags, when Kahani screens the prompt, it refuses a normal behavior-correction story and shows appropriate guidance.
- AE8. **Covers R24, R25, R26.** Given a story is saved to Library, when the parent views Library in v1, no behavior label is shown, but the normalized private classification may be retained for future continuity.

---

## Success Criteria

- Parents can type natural behavior descriptions without learning Kahani's taxonomy.
- Clear prompts generate quickly, while vague prompts get one useful clarification instead of a generic story.
- Stories are based on the likely underlying behavior mechanism, not only surface wording.
- Multi-issue prompts produce one focused story for the most emotionally intense visible behavior.
- Parent notes are short, practical, and aligned with the same strategy as the story.
- The requirements give planning enough product behavior to design classification, chat, safety, persistence, and story-generation changes without inventing the core flow.

---

## Scope Boundaries

- No full therapy, diagnosis, or clinical treatment positioning.
- No full parenting plan dashboard in v1.
- No visible behavior labels in Library in v1.
- No blended story that tries to correct several mechanisms at once.
- No unlimited LLM-invented taxonomy categories as source-of-truth.
- No promise that the child will be permanently corrected after reading.
- No generation for high-risk safety or medical/developmental red-flag prompts.
- No requirement to expose the full classification details to parents.

---

## Key Decisions

- Two-layer interpretation: parent-facing scene matters, but expert mechanism drives strategy.
- Auto-pick primary issue: v1 does not ask parents to choose among detected mechanisms.
- Emotional intensity first: the primary story focus is the most emotionally intense visible behavior.
- Mechanism-aware story: the story addresses the visible behavior through the likely underlying strategy.
- Hybrid chat: clear prompts stay fast; vague prompts get one clarifying question.
- Mainstream consensus: Kahani uses common child-development guidance, not clinical claims.
- Story plus short note: the parent gets one brief practice note, not a coaching dashboard.
- Private classification: save normalized category data for future continuity, but do not expose labels in Library v1.

---

## Dependencies / Assumptions

- Existing story-generation quality requirements in `docs/story-generation-spec.md` remain in force.
- Existing input guardrails remain the safety boundary for high-risk prompts.
- Planning must define the curated taxonomy content and how categories are reviewed.
- Planning must decide how to represent chat history and classification confidence without turning the product into an open-ended advice chatbot.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R6-R11][Technical] What taxonomy artifact should hold scenes, surface behaviors, mechanisms, strategies, parent notes, child story skills, and target outcomes?
- [Affects R7, R8][Technical] What confidence threshold should trigger the one clarifying question?
- [Affects R21, R22][Technical] How should existing guardrails integrate with taxonomy classification so safety screening happens before normal behavior mapping?
- [Affects R24-R26][Technical] Where should private classification be stored so it helps future continuity without retaining unnecessary raw prompt text?
