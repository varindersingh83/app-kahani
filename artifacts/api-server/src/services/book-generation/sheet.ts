import type { BookBrief, CharacterLock, SheetPlacement, SheetPlan, StoryPlan } from "./types";

export const SHEET_ROWS = 4;
export const SHEET_COLS = 3;
export const SHEET_INSET = 12;

export function getSheetPlacement(pageNumber: number): SheetPlacement {
  const zeroBasedIndex = pageNumber - 1;
  const row = Math.floor(zeroBasedIndex / SHEET_COLS) + 1;
  const col = (zeroBasedIndex % SHEET_COLS) + 1;

  return {
    pageNumber,
    row,
    col,
    panelLabel: `Panel ${pageNumber} (${row}x${col})`,
  };
}

export function buildSheetPlan(input: {
  brief: BookBrief;
  characterLock: CharacterLock;
  pageSlots: SheetPlacement[];
  storyPlan?: StoryPlan;
}): SheetPlan {
  const storyPages = input.storyPlan?.pages;
  const tiles = [...input.pageSlots]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((slot) => {
      const storyPage = storyPages?.find((page) => page.pageNumber === slot.pageNumber);
      return {
        pageNumber: slot.pageNumber,
        row: slot.row,
        col: slot.col,
        panelLabel: slot.panelLabel,
        beat: storyPage?.beat ?? buildPanelBeat(input.brief, slot.pageNumber),
        visualFocus: storyPage?.visualFocus ?? buildPanelVisualFocus(input.brief, slot.pageNumber),
        emotion: storyPage?.emotion ?? "warm, playful, and emotionally grounded",
      };
    });

  const panelLines = tiles.map(
    (tile) =>
      `${tile.panelLabel}: ${tile.beat} | Visual focus: ${tile.visualFocus} | Emotion: ${tile.emotion}`,
  );

  const sheetPrompt = [
    "watercolor children's storybook illustration, hand-painted, soft pastel palette, warm tones, visible brush strokes, textured paper grain, imperfect edges, matte finish, gentle lighting, minimal contrast, whimsical and emotional tone, consistent character design across all panels",
    "3x4 storyboard grid layout, 3 columns and 4 rows, 12 panels total, each panel perfectly square, thin white borders separating each panel, clean evenly spaced grid, no overlap, no distortion, all panels aligned",
    `same young child character across all panels: ${input.characterLock.stylePrompt}`,
    `Character details: ${input.characterLock.appearance}`,
    `Child name: ${input.brief.childName}`,
    input.brief.prompt ? `Story premise: ${input.brief.prompt}` : undefined,
    `Behavior context: ${input.brief.behaviorContext}`,
    `Supporting cast: ${input.brief.supportingCastContext}`,
    input.brief.learningHints ? `Learning hints: ${input.brief.learningHints}` : undefined,
    "story progression across panels from top left to bottom right:",
    ...panelLines,
    storyPages?.length
      ? "Canonical page text to keep aligned with the sheet:"
      : undefined,
    ...(storyPages?.map(
      (page) =>
        `Page ${page.pageNumber}: ${page.text} | Illustration prompt: ${page.illustrationPrompt} | Sheet slot: ${page.sheetPlacement.panelLabel}`,
    ) ?? []),
    "each panel should use a simple background, soft environment, no clutter, consistent lighting style, emotional continuity across frames, cinematic composition but flat storybook perspective",
    "do not include narrative text, page numbers, speech bubbles, captions, watermarks, logos, or extra borders inside the art",
    "the image must be a single 3x4 storyboard sheet that can be sliced into 12 page images",
    "also return the canonical 12-page story text in structured JSON alongside the image",
    `Negative prompt: ${input.characterLock.negativePrompt}`,
  ].filter(Boolean).join("\n");

  return {
    rows: SHEET_ROWS,
    cols: SHEET_COLS,
    inset: SHEET_INSET,
    sheetPrompt,
    tiles,
  };
}

function buildPanelBeat(brief: BookBrief, pageNumber: number) {
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || "the story";
  const child = brief.childName;
  return [
    `${child} is introduced in a calm everyday setting connected to ${topic}.`,
    `${child} notices the central problem or emotional tension.`,
    `A closer view shows the challenge, worry, or lonely moment that starts the story.`,
    `${child} tries the first small response, asking, pausing, or reaching out.`,
    `${child} keeps going and searches for a better answer.`,
    `${child} calls out, listens, or looks for helpful clues.`,
    `${child} explores gently and stays emotionally engaged with the problem.`,
    `${child} finds the key moment of connection or the missing piece.`,
    `Warm relief and joy begin as the story turns toward resolution.`,
    `The problem is clearly resolved and the new choice is visible.`,
    `${child} heads home or settles into a calm, proud ending.`,
    `${child} and the solution of the story rest together in a peaceful closing scene.`,
  ][pageNumber - 1];
}

function buildPanelVisualFocus(brief: BookBrief, pageNumber: number) {
  const child = brief.childName;
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || "the story";
  const sharedStyle = `${child}, ${topic}, consistent outfit and facial features, watercolor storybook illustration`;
  const focus = [
    `${sharedStyle}, establishing shot and setting`,
    `${sharedStyle}, child notices the problem`,
    `${sharedStyle}, close-up of the challenge`,
    `${sharedStyle}, first action or attempt`,
    `${sharedStyle}, searching or moving through the world`,
    `${sharedStyle}, calling, listening, or asking for help`,
    `${sharedStyle}, gentle exploration in a simple background`,
    `${sharedStyle}, discovery or reunion moment`,
    `${sharedStyle}, hug or emotional release`,
    `${sharedStyle}, resolution and visible happy ending`,
    `${sharedStyle}, calm walk home or transition to rest`,
    `${sharedStyle}, final peaceful closing image`,
  ];

  return `Panel ${pageNumber}: ${focus[pageNumber - 1]}`;
}
