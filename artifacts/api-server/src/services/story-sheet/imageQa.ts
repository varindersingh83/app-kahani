import path from "node:path";
import type { SheetSliceManifestEntry, StorySheetImageQa } from "./types";

type PanelRole = StorySheetImageQa["panelChecks"][number]["role"];

const noTextCriteria = [
  "no readable text",
  "no pseudo-readable text",
  "no book title",
  "no page numbers",
  "no captions",
  "no signs or labels",
  "no speech bubbles",
  "no handwriting",
];

export function buildImageQaChecklist(input: {
  bookId: string;
  sheetImagePath: string;
  slices: SheetSliceManifestEntry[];
  referenceImages: StorySheetImageQa["referenceImages"];
}): StorySheetImageQa {
  const childIdentityCriteria = [
    "main child resembles uploaded reference photo",
    "main child keeps same gender presentation as reference photo",
    "main child keeps same hair color and hairstyle as reference photo",
    "main child keeps same face shape, skin tone, and proportions as reference photo",
    "main child does not drift into a different child across panels",
  ];
  const panelChecks = input.slices.map((slice) => {
    const fileName = path.basename(slice.output);
    return {
      panel: slice.pageNumber,
      row: slice.row,
      col: slice.col,
      fileName,
      role: panelRole(fileName),
      criteria:
        fileName === "04_blank.png"
          ? [...noTextCriteria, "empty soft background", "no objects"]
          : [...childIdentityCriteria, ...noTextCriteria],
    };
  });

  return {
    bookId: input.bookId,
    sheetImageFileName: path.basename(input.sheetImagePath),
    status: "needs_human_review",
    summary:
      "Inspect generated sheet and slices for child likeness, gender presentation, cross-panel character consistency, and any readable or pseudo-readable text before considering the illustration run polished.",
    referenceImages: input.referenceImages,
    panelChecks,
  };
}

function panelRole(fileName: string): PanelRole {
  if (fileName === "01_cover.png") return "cover_illustration";
  if (fileName === "02_belongs_to.png") return "opening_illustration";
  if (fileName === "03_the_end.png") return "closing_illustration";
  if (fileName === "04_blank.png") return "blank_panel";
  return "story_illustration";
}
