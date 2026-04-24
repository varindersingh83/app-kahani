import type { BookBrief, BookSetup, StoryPlan, StoryPlanPage, StoryRequest, StorySpine } from "./types";
import { getSheetPlacement } from "./sheet";

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

export function buildBehaviorContext(request: Pick<StoryRequest, "mode" | "prompt">) {
  if (request.mode === "behavior") {
    return `The parent wants a gentle behavior-support story about: ${request.prompt || "a common everyday challenge"}. Weave the lesson naturally. Never shame the child. Always show understanding and a positive path forward.`;
  }
  return `Create a warm, imaginative story. Parent's idea or theme: ${request.prompt || "surprise me with something magical and cozy"}.`;
}

export function buildSupportingCastContext(request: Pick<StoryRequest, "supportingCharacters">) {
  if (!request.supportingCharacters || request.supportingCharacters.length === 0) return "";
  return `The story may include these supporting characters when the narrative calls for it, but do not force them: ${request.supportingCharacters
    .map((character) => `${character.name} (${character.relationship})`)
    .join(", ")}.`;
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

export function buildBookSetup(request: StoryRequest, learningHints = ""): BookSetup {
  const normalized = runInputAgent(request);

  return {
    brief: buildBookBrief(normalized, learningHints),
    pageSlots: Array.from({ length: 12 }, (_, index) => getSheetPlacement(index + 1)),
    characterLock: runCharacterConsistencyAgent(request),
  };
}

export function buildStoryPlan(setup: BookSetup): StoryPlan {
  const pages = buildStoryPages(setup.brief.childName, setup.brief.prompt ?? "a gentle everyday challenge", setup.pageSlots);
  const title = buildStoryTitle(setup.brief);
  const reflectionQuestion = buildReflectionQuestion(setup.brief);
  const storySpine = buildStorySpine(setup.brief, pages);
  const masterSheetPrompt = buildMasterSheetPrompt(setup.brief, setup.characterLock.stylePrompt, pages);

  return {
    title,
    reflectionQuestion,
    storySpine,
    masterSheetPrompt,
    pages,
  };
}

function buildBookBrief(input: ReturnType<typeof runInputAgent>, learningHints: string): BookBrief {
  return {
    mode: input.mode,
    prompt: input.prompt,
    childName: input.character.name,
    behaviorContext: buildBehaviorContext(input),
    supportingCastContext: buildSupportingCastContext(input),
    learningHints: learningHints.trim(),
  };
}

function buildStoryTitle(brief: BookBrief) {
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || "a gentle day";
  return `${brief.childName} and the ${topic.slice(0, 38)}`;
}

function buildReflectionQuestion(brief: BookBrief) {
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || "this moment";
  return `What can ${brief.childName} try when ${topic.toLowerCase()} comes up again?`;
}

function buildStorySpine(brief: BookBrief, pages: StoryPlanPage[]): StorySpine {
  const first = pages[0]?.text ?? `${brief.childName} starts the story.`;
  const middle = pages[5]?.text ?? `${brief.childName} works through the middle of the story.`;
  const ending = pages[11]?.text ?? `${brief.childName} reaches a peaceful ending.`;
  return {
    beginning: first,
    middle,
    ending,
    emotionalArc: `${brief.childName} moves from a small challenge to calm confidence and warmth.`,
  };
}

function buildMasterSheetPrompt(brief: BookBrief, stylePrompt: string, pages: StoryPlanPage[]) {
  return [
    "Create a single 3x4 watercolor storyboard sheet for a children's picture book.",
    "The sheet will be printed once and sliced into 12 page images.",
    `Child: ${brief.childName}.`,
    brief.prompt ? `Story theme: ${brief.prompt}.` : "",
    `Visual style: ${stylePrompt}`,
    brief.behaviorContext,
    brief.supportingCastContext,
    brief.learningHints ? `Learning hints: ${brief.learningHints}` : "",
    "Use the following page plan as the canonical narrative order and visual direction:",
    "Canonical page text to keep aligned with the sheet:",
    ...pages.map(
      (page) =>
        `Page ${page.pageNumber}: ${page.text} | Illustration prompt: ${page.illustrationPrompt} | Sheet slot: ${page.sheetPlacement.panelLabel}`,
    ),
    "No text, captions, speech bubbles, page numbers, watermarks, or logos inside the art.",
    "Keep the child character visually consistent across all panels.",
    "The image must be readable as one storyboard sheet before slicing.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStoryPages(childName: string, topic: string, pageSlots: BookSetup["pageSlots"]) {
  const cleanedTopic = topic.trim().replace(/[.!?]+$/, "");
  const beats = [
    "starts with a small feeling and a familiar moment",
    "notices the tricky part and pauses",
    "feels the first wave of frustration or worry",
    "tries a small, gentle first step",
    "keeps going and looks for help",
    "listens, breathes, and stays close to the moment",
    "makes a careful new choice",
    "finds the key turn that helps the story move forward",
    "feels relief as the problem softens",
    "sees the new choice working well",
    "settles into a calmer, happier rhythm",
    "ends with pride, peace, and connection",
  ];

  return pageSlots
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((slot, index): StoryPlanPage => {
      const beat = `Page ${slot.pageNumber}: ${childName} ${beats[index]}.`;
      const visualFocus = `Page ${slot.pageNumber}: watercolor scene of ${childName}, ${cleanedTopic}, ${slot.panelLabel}, consistent outfit, warm emotional storytelling`;
      const emotion = [
        "curious",
        "uncertain",
        "frustrated",
        "hopeful",
        "searching",
        "listening",
        "careful",
        "discovering",
        "relieved",
        "joyful",
        "calm",
        "proud",
      ][index];
      return {
        pageNumber: slot.pageNumber,
        text: buildPageText(childName, cleanedTopic, slot.pageNumber),
        illustrationPrompt: visualFocus,
        sheetPlacement: slot,
        beat,
        visualFocus,
        emotion,
      };
    });
}

function buildPageText(childName: string, topic: string, pageNumber: number) {
  const lines = [
    `${childName} begins with ${topic} and notices a small feeling in their chest.`,
    `${childName} sees the tricky part and pauses before acting.`,
    `${childName} feels the moment get a little bigger and takes a breath.`,
    `${childName} tries a gentle first step and stays kind.`,
    `${childName} keeps going and looks for help or a better idea.`,
    `${childName} listens closely and notices a helpful clue.`,
    `${childName} chooses a calmer path and tries again.`,
    `${childName} finds the missing piece that makes things easier.`,
    `${childName} feels the worry soften and the scene turn warm.`,
    `${childName} sees the new choice working well for everyone.`,
    `${childName} settles into a peaceful rhythm and feels proud.`,
    `${childName} ends the story feeling safe, connected, and happy.`,
  ];
  return lines[pageNumber - 1] ?? `${childName} moves through ${topic}.`;
}
