import { execFile as execFileCallback } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  callJsonChat,
  callMultimodalImageModel,
  extractImageUrl,
} from "./aiClient";
import { buildImageQaChecklist } from "./imageQa";
import { buildGeneratedStory } from "./mapper";
import { planStoryIssues } from "./planner";
import { promptPath, slicerScriptPath } from "./paths";
import { renderBookHtml } from "./html";
import type {
  AiConfig,
  ApiUsage,
  SheetSliceManifestEntry,
  StorySheetInput,
  StorySheetRunResult,
} from "./types";

const execFile = promisify(execFileCallback);

export async function runStorySheetGeneration(input: {
  bookId: string;
  request: GenerateStoryRequest;
  outputDir: string;
  config: AiConfig;
  onStep?: (
    step:
      | "writing_story"
      | "painting_sheet"
      | "slicing_pages"
      | "preparing_reader",
    message: string,
  ) => Promise<void> | void;
}): Promise<StorySheetRunResult> {
  const { bookId, request, outputDir, config, onStep } = input;
  await mkdir(outputDir, { recursive: true });

  await onStep?.("writing_story", "Writing the story text");
  const storyPromptTemplate = await readFile(
    promptPath("story-json-master-prompt.txt"),
    "utf8",
  );
  const behavior = buildBehaviorPrompt(request);
  const storyPrompt = buildStoryPrompt(storyPromptTemplate, behavior, "Mom");
  const storyResult = await callJsonChat(
    config,
    "You write exact JSON only. Follow the user's schema and return valid JSON with no markdown or explanation.",
    storyPrompt,
  );
  const storyJson = normalizeStoryJson(
    storyResult.data as StorySheetInput,
    request,
    behavior,
  );

  await writeFile(path.join(outputDir, "story-prompt.txt"), `${storyPrompt}\n`);
  await writeFile(
    path.join(outputDir, "story.json"),
    `${JSON.stringify(storyJson, null, 2)}\n`,
  );

  await onStep?.("painting_sheet", "Painting the storyboard sheet");
  const sheetPromptTemplate = await readFile(
    promptPath("sheet-master-prompt.txt"),
    "utf8",
  );
  const sheetPrompt = buildSheetPrompt(sheetPromptTemplate, storyJson, request);
  await writeFile(path.join(outputDir, "sheet-prompt.txt"), `${sheetPrompt}\n`);

  const imageData = await callMultimodalImageModel(
    config,
    sheetPrompt,
    { aspectRatio: "1:1", imageSize: "4K" },
    request.character.photoUri ? [request.character.photoUri] : [],
  );
  await writeFile(
    path.join(outputDir, "sheet-response.json"),
    `${JSON.stringify(imageData, null, 2)}\n`,
  );
  const sheetImageUrl = extractImageUrl(imageData);
  if (!sheetImageUrl)
    throw new Error("Storyboard sheet request returned no image.");

  const sheetPath = await saveImageAsset(
    sheetImageUrl,
    path.join(outputDir, "sheet"),
  );
  await writeFile(path.join(outputDir, "sheet-url.txt"), `${sheetImageUrl}\n`);
  await writeFile(path.join(outputDir, "sheet-path.txt"), `${sheetPath}\n`);

  await onStep?.(
    "slicing_pages",
    "Slicing the painted sheet into reader pages",
  );
  const pagesDir = path.join(outputDir, "pages");
  const slices = await sliceStoryboardSheet(sheetPath, pagesDir);
  await writeFile(
    path.join(outputDir, "slices.json"),
    `${JSON.stringify(slices, null, 2)}\n`,
  );
  const imageQa = buildImageQaChecklist({
    bookId,
    sheetImagePath: sheetPath,
    slices,
  });
  await writeFile(
    path.join(outputDir, "image-qa.json"),
    `${JSON.stringify(imageQa, null, 2)}\n`,
  );

  const usage = {
    textModel: config.textModel,
    imageModel: config.imageModel,
    story: storyResult.usage ?? null,
    sheet: imageData.usage ?? null,
    total: sumUsage([storyResult.usage, imageData.usage]),
  };
  await writeFile(
    path.join(outputDir, "usage.json"),
    `${JSON.stringify(usage, null, 2)}\n`,
  );

  await onStep?.("preparing_reader", "Preparing the book reader");
  const story = buildGeneratedStory({
    bookId,
    story: storyJson,
    slices,
    includeArtifactLinks: process.env.NODE_ENV !== "production",
    sheetFileName: path.basename(sheetPath),
  });
  await writeFile(
    path.join(outputDir, "book.html"),
    renderBookHtml({
      story: storyJson,
      slices,
      behavior,
      sheetImageFileName: path.basename(sheetPath),
    }),
  );
  await writeFile(
    path.join(outputDir, "book.json"),
    `${JSON.stringify(story, null, 2)}\n`,
  );

  return { story, storyJson, slices, imageQa, usage };
}

function buildBehaviorPrompt(request: GenerateStoryRequest) {
  const plannedIssue = planStoryIssues(request)[0]?.issue;
  const prompt = plannedIssue ?? request.prompt?.trim();
  if (request.mode === "random") {
    return prompt
      ? `A warm imaginative story idea: ${prompt}`
      : "A warm imaginative story about a small everyday adventure";
  }
  return (
    prompt || "learning to share, pause, and repair after a difficult moment"
  );
}

function buildStoryPrompt(
  template: string,
  behavior: string,
  parentName: string,
) {
  return template
    .replaceAll("{{BEHAVIOR}}", behavior)
    .replaceAll("{{PARENT_NAME}}", parentName);
}

export function buildSheetPrompt(
  template: string,
  story: StorySheetInput,
  request: GenerateStoryRequest,
) {
  return template
    .replace("{{JSON_INPUT}}", JSON.stringify(story, null, 2))
    .replace("{{IMAGE_SPEC}}", buildImageSpec(request));
}

export function buildImageSpec(request: GenerateStoryRequest) {
  const childName = request.character.name.trim();
  const appearance = request.character.appearance?.trim();
  const supportingCharacters = request.supportingCharacters ?? [];
  const lines = [
    `Main child: ${childName}.`,
    request.character.photoUri
      ? "Use the uploaded child reference image as the canonical face, hair, skin tone, proportions, and overall likeness. Translate it into the watercolor storybook style without changing identity."
      : "No child reference image was provided, so keep the same invented face, hair, clothing, and proportions in every panel.",
    appearance
      ? `Appearance lock: ${appearance}. Keep these traits consistent in every panel.`
      : "If clothing is not specified, choose one simple outfit and keep it identical in every panel.",
    supportingCharacters.length > 0
      ? `Supporting cast, only when the story calls for them: ${supportingCharacters
          .map(
            (character: { name: string; relationship: string }) =>
              `${character.name} (${character.relationship})`,
          )
          .join(", ")}. Keep each supporting character visually consistent across panels.`
      : "Do not add recurring supporting characters unless the story scene clearly requires them.",
    "Never change the main child's outfit, hair, age, body proportions, or facial structure between panels.",
    "Keep parent/adult figures visually consistent when present, including clothing color and hairstyle.",
  ];

  return lines.join("\n");
}

export function normalizeStoryJson(
  story: StorySheetInput,
  request: GenerateStoryRequest,
  behavior: string,
): StorySheetInput {
  const requestedChildName = request.character.name.trim();
  const generatedChildName = story.child_name.trim();
  const normalizeChildName = (value: string) =>
    requestedChildName && generatedChildName
      ? replaceName(value, generatedChildName, requestedChildName)
      : value;

  return {
    ...story,
    title: normalizeChildName(story.title),
    child_name: requestedChildName || story.child_name,
    parent_name: story.parent_name || "Mom",
    parent_role: story.parent_role || "parent",
    behavior,
    pages: story.pages.slice(0, 12).map((page, index) => ({
      page: index + 1,
      text: normalizeChildName(page.text),
      scene: normalizeChildName(page.scene),
      composition: page.composition,
      emotion: page.emotion,
    })),
  };
}

function replaceName(value: string, fromName: string, toName: string) {
  if (fromName === toName) return value;
  const escaped = fromName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value.replace(new RegExp(`\\b${escaped}\\b`, "g"), toName);
}

async function saveImageAsset(source: string, destinationBasePath: string) {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL image.");
    const metadata = source.slice(5, comma);
    const payload = source.slice(comma + 1);
    const bytes = metadata.includes(";base64")
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload));
    const destinationPath = `${destinationBasePath}.${detectExtension(source)}`;
    await writeFile(destinationPath, bytes);
    return destinationPath;
  }

  if (source.startsWith("file://")) {
    const destinationPath = `${destinationBasePath}${path.extname(fileURLToPath(source)) || ".png"}`;
    await copyFile(fileURLToPath(source), destinationPath);
    return destinationPath;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("jpeg")
      ? "jpg"
      : contentType.includes("webp")
        ? "webp"
        : "png";
    const bytes = Buffer.from(await response.arrayBuffer());
    const destinationPath = `${destinationBasePath}.${ext}`;
    await writeFile(destinationPath, bytes);
    return destinationPath;
  }

  throw new Error(`Unsupported image source: ${source}`);
}

function detectExtension(source: string) {
  const lower = source.toLowerCase();
  if (
    lower.startsWith("data:image/jpeg") ||
    lower.startsWith("data:image/jpg") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  )
    return "jpg";
  if (lower.startsWith("data:image/webp") || lower.endsWith(".webp"))
    return "webp";
  return "png";
}

async function sliceStoryboardSheet(sheetImagePath: string, outputDir: string) {
  const pythonExecutable = process.env.CODEX_PYTHON_BIN ?? "python3";
  await execFile(pythonExecutable, [
    slicerScriptPath(),
    sheetImagePath,
    outputDir,
    "--rows",
    "4",
    "--cols",
    "4",
    "--inset",
    "12",
    "--prefix",
    "page",
    "--format",
    "png",
  ]);

  const manifestPath = path.join(outputDir, "manifest.json");
  return JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as SheetSliceManifestEntry[];
}

function sumUsage(usages: Array<ApiUsage | undefined>): ApiUsage {
  const totals: ApiUsage = {};
  for (const usage of usages) {
    if (!usage) continue;
    for (const key of [
      "prompt_tokens",
      "completion_tokens",
      "total_tokens",
      "cost",
      "total_cost",
    ] as const) {
      const value = usage[key];
      if (typeof value === "number") {
        totals[key] =
          (typeof totals[key] === "number" ? totals[key] : 0) + value;
      }
    }
  }
  return totals;
}
