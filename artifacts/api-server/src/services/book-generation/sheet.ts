import type { CharacterLock, PipelineStory, SheetPlan, StorySetup } from "./types";

export const SHEET_ROWS = 4;
export const SHEET_COLS = 3;
export const SHEET_INSET = 12;

export function getSheetPlacement(pageNumber: number) {
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
  story: PipelineStory;
  setup: StorySetup;
  characterLock: CharacterLock;
}): SheetPlan {
  const tiles = [...input.setup.storyboard]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((beat) => ({
      pageNumber: beat.pageNumber,
      row: beat.sheetPlacement.row,
      col: beat.sheetPlacement.col,
      panelLabel: beat.sheetPlacement.panelLabel,
      beat: beat.beat,
      visualFocus: beat.visualFocus,
      emotion: beat.emotion,
    }));

  const panelLines = tiles.map(
    (tile) =>
      `${tile.panelLabel}: ${tile.beat} | Visual focus: ${tile.visualFocus} | Emotion: ${tile.emotion}`,
  );

  const sheetPrompt = [
    `Book title: ${input.story.title}`,
    `Reflection question: ${input.story.reflectionQuestion}`,
    "Create one watercolor children's picture-book sheet laid out as a 3-column by 4-row grid.",
    "This single sheet will later be sliced into 12 individual page images.",
    `Character lock: ${input.characterLock.stylePrompt}`,
    `Negative prompt: ${input.characterLock.negativePrompt}`,
    "Keep the child and supporting characters visually consistent across the entire sheet.",
    "Do not include text, page numbers, or speech bubbles inside the art.",
    ...panelLines,
  ].join("\n");

  return {
    rows: SHEET_ROWS,
    cols: SHEET_COLS,
    inset: SHEET_INSET,
    sheetPrompt,
    tiles,
  };
}
