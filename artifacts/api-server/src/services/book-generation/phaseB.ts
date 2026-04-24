import { buildSheetPlan } from "./sheet";
import type { BookSetup, CharacterLock, SheetPlan, StoryPlan } from "./types";

export function buildCoverPrompt(input: {
  brief: BookSetup["brief"];
  characterLock: CharacterLock;
}) {
  return [
    "Create a watercolor children's picture-book cover illustration.",
    "Soft pastel palette, hand-painted watercolor style, gentle and warm.",
    "No text on the image.",
    `Child: ${input.brief.childName}.`,
    `Mode: ${input.brief.mode}.`,
    input.brief.prompt ? `Story idea: ${input.brief.prompt}.` : "",
    input.brief.behaviorContext,
    input.brief.supportingCastContext,
    input.brief.learningHints ? `Learning hints: ${input.brief.learningHints}` : "",
    `Character lock: ${input.characterLock.stylePrompt}`,
    `Negative prompt: ${input.characterLock.negativePrompt}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStoryboardSheetPrompt(input: {
  brief: BookSetup["brief"];
  characterLock: CharacterLock;
  pageSlots: BookSetup["pageSlots"];
  storyPlan?: StoryPlan;
}) {
  if (input.storyPlan) {
    return input.storyPlan.masterSheetPrompt;
  }
  return buildSheetPlan({
    brief: input.brief,
    characterLock: input.characterLock,
    pageSlots: input.pageSlots,
    storyPlan: input.storyPlan,
  }).sheetPrompt;
}

export function buildStoryboardSheetPlan(input: {
  brief: BookSetup["brief"];
  characterLock: CharacterLock;
  pageSlots: BookSetup["pageSlots"];
  storyPlan?: StoryPlan;
}): SheetPlan {
  return buildSheetPlan(input);
}
