import assert from "node:assert/strict";
import test from "node:test";
import type { ProducedPage } from "./phaseC";
import { runEditorAgent, runHumanQaGate, runLayoutAgent, runPackagingAgent } from "./phaseC";
import type { SheetPlan } from "./types";

const pages: ProducedPage[] = Array.from({ length: 12 }, (_, index) => ({
  pageNumber: 12 - index,
  text: ` Ava page ${12 - index}. `,
  illustrationPrompt: ` Warm watercolor scene with Ava on page ${12 - index}. `,
  retryCount: index === 2 ? 1 : 0,
  flagForHuman: false,
  alignmentScore: 0.9,
  imageUrl: `file:///tmp/page-${12 - index}.png`,
  sheetPlacement: {
    pageNumber: 12 - index,
    row: Math.floor((12 - index - 1) / 3) + 1,
    col: ((12 - index - 1) % 3) + 1,
    panelLabel: `Panel ${12 - index} (${Math.floor((12 - index - 1) / 3) + 1}x${((12 - index - 1) % 3) + 1})`,
  },
}));

const sheetPlan: SheetPlan = {
  rows: 4,
  cols: 3,
  inset: 12,
  sheetPrompt: "One watercolor sheet to be sliced into 12 pages.",
  tiles: Array.from({ length: 12 }, (_, index) => {
    const pageNumber = index + 1;
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    return {
      pageNumber,
      row,
      col,
      panelLabel: `Panel ${pageNumber} (${row}x${col})`,
      beat: `Beat ${pageNumber}`,
      visualFocus: `Focus ${pageNumber}`,
      emotion: pageNumber === 12 ? "proud" : "curious",
    };
  }),
};

test("Phase C Step 10 LayoutAgent orders pages and records mobile picture-book format", () => {
  const layout = runLayoutAgent(pages, sheetPlan);

  assert.equal(layout.format, "mobile_picture_book");
  assert.equal(layout.pageCount, 12);
  assert.deepEqual(
    layout.pages.map((page) => page.pageNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.equal(layout.sheetPlan?.rows, 4);
  assert.equal(layout.sheetPlan?.tiles.length, 12);
});

test("Phase C Step 11 EditorAgent trims final page text and prompts without rewriting content", () => {
  const edited = runEditorAgent({
    title: " Ava's Gentle Turn ",
    reflectionQuestion: " What helped Ava ask? ",
    pages: [
      {
        pageNumber: 1,
        text: " Ava asks softly. ",
        illustrationPrompt: " Warm watercolor scene with Ava. ",
      },
    ],
  });

  assert.equal(edited.title, " Ava's Gentle Turn ");
  assert.equal(edited.reflectionQuestion, " What helped Ava ask? ");
  assert.equal(edited.pages[0]?.text, "Ava asks softly.");
  assert.equal(edited.pages[0]?.illustrationPrompt, "Warm watercolor scene with Ava.");
});

test("Phase C Step 12 PackagingAgent returns the mobile-compatible GeneratedStory shape", () => {
  const packaged = runPackagingAgent({
    title: " Ava's Gentle Turn ",
    reflectionQuestion: " What helped Ava ask? ",
    pages,
    coverImageUrl: "https://example.test/cover.png",
    sheetImageUrl: "file:///tmp/sheet.png",
    sheetPlan,
  });

  assert.equal(packaged.title, "Ava's Gentle Turn");
  assert.equal(packaged.pages.length, 12);
  assert.equal(packaged.pages[0]?.pageNumber, 1);
  assert.equal(packaged.pages[0]?.text, "Ava page 1.");
  assert.equal(packaged.coverImageUrl, "https://example.test/cover.png");
  assert.equal(packaged.sheetImageUrl, "file:///tmp/sheet.png");
  assert.equal(packaged.pages[0]?.imageUrl, "file:///tmp/page-1.png");
});

test("Phase C Human QA gate completes when no pages are flagged", () => {
  const qa = runHumanQaGate(pages);

  assert.equal(qa.status, "completed");
  assert.equal(qa.flaggedForHuman, false);
  assert.deepEqual(qa.flaggedPages, []);
  assert.equal(qa.retryTotal, 1);
});

test("Phase C Human QA gate requires review when any page is flagged", () => {
  const qa = runHumanQaGate([
    ...pages.slice(0, 2),
    {
      ...pages[2]!,
      pageNumber: 3,
      flagForHuman: true,
      retryCount: 3,
    },
    ...pages.slice(3),
  ]);

  assert.equal(qa.status, "qa_required");
  assert.equal(qa.flaggedForHuman, true);
  assert.deepEqual(qa.flaggedPages, [3]);
  assert.equal(qa.retryTotal, 3);
});

test("Phase C integration turns produced pages into final packaged story and QA status", () => {
  const producedPages: ProducedPage[] = pages.map((page) =>
    page.pageNumber === 5
      ? {
          ...page,
          flagForHuman: true,
          retryCount: 3,
          failureReason: "max retries reached",
        }
      : page,
  );

  const packaged = runPackagingAgent({
    title: "Ava's Gentle Turn",
    reflectionQuestion: "What can Ava say when she wants a turn?",
    pages: producedPages,
    sheetPlan,
  });
  const qa = runHumanQaGate(producedPages);

  assert.equal(packaged.title, "Ava's Gentle Turn");
  assert.equal(packaged.pages.length, 12);
  assert.deepEqual(
    packaged.pages.map((page) => page.pageNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.equal(packaged.pages[0]?.imageUrl, "file:///tmp/page-1.png");
  assert.equal(qa.status, "qa_required");
  assert.deepEqual(qa.flaggedPages, [5]);
});
