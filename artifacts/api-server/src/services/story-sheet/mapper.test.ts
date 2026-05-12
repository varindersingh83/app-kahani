import assert from "node:assert/strict";
import test from "node:test";
import { buildGeneratedStory } from "./mapper";
import type { SheetSliceManifestEntry, StorySheetInput } from "./types";

test("maps a 16-panel story sheet into cover plus 12 reader pages, excluding the blank panel", () => {
  const story: StorySheetInput = {
    title: "When the Towers Fall",
    child_name: "Leo",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "Hitting when upset",
    pages: Array.from({ length: 12 }, (_, index) => ({
      page: index + 1,
      text: `Story text ${index + 1}`,
      scene: `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "Hopeful",
    })),
  };
  const names = [
    "01_cover.png",
    "02_belongs_to.png",
    "03_the_end.png",
    "04_blank.png",
    ...Array.from(
      { length: 12 },
      (_, index) => `story_page_${String(index + 1).padStart(2, "0")}.png`,
    ),
  ];
  const slices: SheetSliceManifestEntry[] = names.map((name, index) => ({
    pageNumber: index + 1,
    row: Math.floor(index / 4) + 1,
    col: (index % 4) + 1,
    output: `file:///tmp/pages/${name}`,
  }));

  const result = buildGeneratedStory({
    bookId: "book-123",
    story,
    slices,
    includeArtifactLinks: true,
  });

  assert.equal(
    result.coverImageUrl,
    "/api/story-runs/book-123/pages/01_cover.png",
  );
  assert.equal(
    result.endImageUrl,
    "/api/story-runs/book-123/pages/03_the_end.png",
  );
  assert.equal(result.pages.length, 12);
  assert.equal(result.pages[0]?.text, "Story text 1");
  assert.equal(
    result.pages[0]?.imageUrl,
    "/api/story-runs/book-123/pages/story_page_01.png",
  );
  assert.equal(
    result.pages[11]?.imageUrl,
    "/api/story-runs/book-123/pages/story_page_12.png",
  );
  assert.ok(!result.pages.some((page) => page.imageUrl?.includes("04_blank")));
  assert.equal(
    result.artifactLinks?.bookHtmlUrl,
    "/api/story-runs/book-123/book.html",
  );
});
