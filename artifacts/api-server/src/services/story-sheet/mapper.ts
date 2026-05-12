import path from "node:path";
import type {
  SheetSliceManifestEntry,
  StorySheetGeneratedStory,
  StorySheetInput,
} from "./types";

export function buildGeneratedStory(input: {
  bookId: string;
  story: StorySheetInput;
  slices: SheetSliceManifestEntry[];
  includeArtifactLinks: boolean;
  sheetFileName?: string;
}): StorySheetGeneratedStory {
  const { bookId, story, slices, includeArtifactLinks } = input;
  const sliceByName = new Map(
    slices.map((slice) => [path.basename(slice.output), slice]),
  );

  const pageImageUrl = (fileName: string) =>
    sliceByName.has(fileName)
      ? `/api/story-runs/${bookId}/pages/${fileName}`
      : undefined;

  return {
    title: story.title,
    reflectionQuestion: `What helped ${story.child_name} feel safe enough to try again?`,
    coverImageUrl: pageImageUrl("01_cover.png"),
    endImageUrl: pageImageUrl("03_the_end.png"),
    sheetImageUrl: `/api/story-runs/${bookId}/${input.sheetFileName ?? "sheet.jpg"}`,
    pages: story.pages.map((page, index) => ({
      pageNumber: page.page,
      text: page.text,
      illustrationPrompt: page.scene,
      imageUrl: pageImageUrl(
        `story_page_${String(index + 1).padStart(2, "0")}.png`,
      ),
      scene: page.scene,
      composition: page.composition,
      emotion: page.emotion,
    })),
    artifactLinks: includeArtifactLinks
      ? {
          bookHtmlUrl: `/api/story-runs/${bookId}/book.html`,
          storyJsonUrl: `/api/story-runs/${bookId}/story.json`,
          usageJsonUrl: `/api/story-runs/${bookId}/usage.json`,
        }
      : undefined,
  };
}

export function buildReaderCards(input: {
  story: StorySheetInput;
  slices: SheetSliceManifestEntry[];
}) {
  const { story, slices } = input;
  const imageForSlice = (sliceIndex: number) => {
    const output = slices[sliceIndex]?.output;
    return output ? `pages/${path.basename(output)}` : "";
  };

  return [
    {
      kind: "cover",
      label: "Cover",
      title: story.title,
      body: "Book cover",
      image: imageForSlice(0),
    },
    ...story.pages.map((page, index) => ({
      kind: "story",
      label: `Page ${page.page}`,
      title: `Page ${page.page}`,
      body: page.text,
      scene: page.scene,
      meta: [page.composition, page.emotion].filter(Boolean),
      image: imageForSlice(index + 4),
    })),
    {
      kind: "end",
      label: "End",
      title: "The End",
      body: "Closing page",
      image: imageForSlice(2),
    },
  ];
}
