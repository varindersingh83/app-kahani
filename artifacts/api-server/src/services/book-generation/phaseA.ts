import type { PipelineStory, StoryRequest, StorySetup } from "./types";
import { getSheetPlacement } from "./sheet";
import { validateStory } from "./validation";

const PAGE_COUNT = 12;

export function runInputAgent(request: StoryRequest) {
  return {
    mode: request.mode,
    prompt: request.prompt?.trim() || undefined,
    character: {
      ...request.character,
      name: request.character.name.trim(),
    },
    supportingCharacters: request.supportingCharacters ?? [],
  };
}

export function buildBehaviorContext(request: StoryRequest) {
  if (request.mode === "behavior") {
    return `The parent wants a gentle behavior-support story about: ${request.prompt || "a common everyday challenge"}. Weave the lesson naturally. Never shame the child. Always show understanding and a positive path forward.`;
  }
  return `Create a warm, imaginative story. Parent's idea or theme: ${request.prompt || "surprise me with something magical and cozy"}.`;
}

export function buildSupportingCastContext(request: StoryRequest) {
  if (!request.supportingCharacters || request.supportingCharacters.length === 0) return "";
  return `The story may include these supporting characters when the narrative calls for it, but do not force them: ${request.supportingCharacters
    .map((character) => `${character.name} (${character.relationship})`)
    .join(", ")}.`;
}

export function runStorySpineAgent(story: PipelineStory) {
  const firstPage = story.pages[0];
  const middlePage = story.pages[Math.floor(story.pages.length / 2)];
  const lastPage = story.pages[story.pages.length - 1];

  return {
    beginning: firstPage?.text ?? "The child begins in a familiar, gentle moment.",
    middle: middlePage?.text ?? "The child practices a small brave step.",
    ending: lastPage?.text ?? "The child ends calm, connected, and proud.",
    emotionalArc: "curious to challenged to confident",
  };
}

export function runStoryWriterValidation(story: PipelineStory) {
  return validateStory(story);
}

export function runStoryboardAgent(story: PipelineStory) {
  return Array.from({ length: PAGE_COUNT }, (_, index) => {
    const page = story.pages.find((candidate) => candidate.pageNumber === index + 1);
    const sheetPlacement = getSheetPlacement(index + 1);
    return {
      pageNumber: index + 1,
      beat: page?.text ?? "Repair missing story beat.",
      visualFocus: page?.illustrationPrompt ?? "Warm watercolor scene with the main character.",
      emotion: inferEmotion(page?.text ?? ""),
      sheetPlacement,
    };
  });
}

export function runCharacterConsistencyAgent(request: StoryRequest) {
  const name = request.character.name.trim();
  const appearance =
    request.character.appearance ||
    (request.character.photoUri
      ? "consistent child appearance based on the uploaded reference photo"
      : "consistent child appearance based on parent-provided details");

  return {
    name,
    appearance,
    stylePrompt: `${name} appears consistently throughout: ${appearance}. Warm watercolor children's book style, soft pastel palette.`,
    negativePrompt: "No scary imagery, no harsh lighting, no inconsistent character traits, no text in image.",
  };
}

export function buildBookSetup(request: StoryRequest, story: PipelineStory): StorySetup {
  return {
    spine: runStorySpineAgent(story),
    storyboard: runStoryboardAgent(story),
    characterLock: runCharacterConsistencyAgent(request),
  };
}

function inferEmotion(text: string) {
  if (/proud|happy|smile|glad/i.test(text)) return "proud";
  if (/sad|mad|upset|worried/i.test(text)) return "supported";
  if (/sleep|quiet|calm/i.test(text)) return "calm";
  return "curious";
}
