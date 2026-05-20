import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  callJsonChat,
  callMultimodalImageModel,
  extractImageUrl,
} from "./aiClient";
import { buildImageQaChecklist } from "./imageQa";
import { buildGeneratedStory } from "./mapper";
import { planStoryIssues } from "./planner";
import { promptPath } from "./paths";
import { renderBookHtml } from "./html";
import { sanitizeProviderReferenceImageUris } from "../safety/providerPayloadPolicy";
import type {
  AiConfig,
  ApiUsage,
  BehaviorClassificationSummary,
  SheetSliceManifestEntry,
  StorySheetInput,
  StorySheetRunResult,
} from "./types";

const MIN_STORY_PAGES = 8;
const MAX_STORY_PAGES = 20;
const STORYBOARD_GRID_SIZE = 5;

export async function runStorySheetGeneration(input: {
  bookId: string;
  request: GenerateStoryRequest;
  behaviorFocus?: BehaviorClassificationSummary;
  parentNote?: string;
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
  const behavior = buildBehaviorPrompt(request, input.behaviorFocus);
  const storyPrompt = buildStoryPrompt(
    storyPromptTemplate,
    behavior,
    request.character.name,
    parentNameForRequest(request),
    buildChildIdentityForStory(request),
  );
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
    buildReferenceImageUris(request),
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
    referenceImages: buildReferenceImageQa(request),
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
    behaviorFocus: input.behaviorFocus,
    parentNote: input.parentNote,
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

function buildBehaviorPrompt(
  request: GenerateStoryRequest,
  behaviorFocus?: BehaviorClassificationSummary,
) {
  if (behaviorFocus && request.mode === "behavior") {
    return [
      `Visible behavior: ${behaviorFocus.visibleBehavior}.`,
      `Scene/context: ${behaviorFocus.scene}.`,
      `Likely mechanism: ${behaviorFocus.mechanism}.`,
      `Story strategy: ${behaviorFocus.strategy}.`,
      `Child story skill: ${behaviorFocus.childStorySkill}.`,
      `Target outcome: ${behaviorFocus.targetOutcome}.`,
      "Write one focused behavior-support story around this primary issue only. Show practice and small progress, not permanent correction.",
    ].join(" ");
  }

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
  childName: string,
  parentName: string,
  childIdentity: string,
) {
  return template
    .replaceAll("{{BEHAVIOR}}", behavior)
    .replaceAll("{{CHILD_NAME}}", childName.trim())
    .replaceAll("{{PARENT_NAME}}", parentName)
    .replaceAll("{{CHILD_IDENTITY}}", childIdentity);
}

export function buildSheetPrompt(
  template: string,
  story: StorySheetInput,
  request: GenerateStoryRequest,
) {
  return template
    .replace(
      "{{JSON_INPUT}}",
      JSON.stringify(redactStoryForImagePrompt(story, request), null, 2),
    )
    .replace("{{IMAGE_SPEC}}", buildImageSpec(request));
}

export function buildImageSpec(request: GenerateStoryRequest) {
  const appearance = request.character.appearance?.trim();
  const supportingCharacters = request.supportingCharacters ?? [];
  const parentReference = supportingCharacters.find((character) =>
    isParentRelationship(character.relationship),
  );
  const lines = [
    "Main child: the child.",
    "No child face photo is available to the provider. Use only the non-photo appearance descriptor below and keep an invented, consistent storybook face in every panel.",
    appearance
      ? `Appearance descriptor: ${appearance}. Keep these traits consistent in every panel.`
      : "If clothing is not specified, choose one simple outfit and keep it identical in every panel.",
    supportingCharacters.length > 0
      ? `Supporting cast, only when the story calls for them: ${supportingCharacters
          .map(
            (character: {
              name: string;
              relationship: string;
              appearance?: string;
              photoUri?: string;
            }) =>
              isParentRelationship(character.relationship)
                ? "adult caregiver (parent)"
                : `supporting child or family member (${character.relationship})`,
          )
          .join(
            ", ",
          )}. Keep each supporting character visually consistent across panels.`
      : "Do not add recurring supporting characters unless the story scene clearly requires them.",
    "No parent or caregiver face photo is available to the provider. Use only non-photo adult descriptors and do not make adult figures the main child.",
    parentReference?.appearance
      ? `Adult appearance descriptor: ${parentReference.appearance}. Keep these adult traits consistent in every panel.`
      : undefined,
    "Never change the main child's outfit, hair, age, body proportions, or facial structure between panels.",
    "Never switch the main child's gender presentation between the story text, cover, and page illustrations.",
    "Keep parent/adult figures visually consistent when present, including clothing color and hairstyle.",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildChildIdentityForStory(request: GenerateStoryRequest) {
  const appearance = request.character.appearance?.trim();
  if (appearance) {
    return `Child identity lock: ${appearance} Keep the main child consistent. Do not infer gender from the child's name if it conflicts with this identity lock.`;
  }
  return "Child identity lock: do not infer gender from the child's name. Use neutral wording unless a gender is explicitly provided.";
}

export function buildReferenceImageUris(request: GenerateStoryRequest) {
  return sanitizeProviderReferenceImageUris([
    request.character.photoUri,
    ...(request.supportingCharacters ?? [])
      .filter((character) => isParentRelationship(character.relationship))
      .map((character) => character.photoUri),
  ].filter((uri): uri is string => Boolean(uri)));
}

function buildReferenceImageQa(
  request: GenerateStoryRequest,
): StorySheetRunResult["imageQa"]["referenceImages"] {
  return [
    request.character.photoUri
      ? {
          role: "main_child" as const,
          uriKind: referenceUriKind(request.character.photoUri),
          attached: isAttachableReferenceUri(request.character.photoUri),
        }
      : undefined,
    ...(request.supportingCharacters ?? [])
      .filter((character) => isParentRelationship(character.relationship))
      .map((character) =>
        character.photoUri
          ? {
              role: "parent" as const,
              uriKind: referenceUriKind(character.photoUri),
              attached: isAttachableReferenceUri(character.photoUri),
            }
          : undefined,
      ),
  ].filter(
    (
      reference,
    ): reference is StorySheetRunResult["imageQa"]["referenceImages"][number] =>
      Boolean(reference),
  );
}

function isAttachableReferenceUri(uri: string) {
  return (
    uri.startsWith("data:image/") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://")
  );
}

function referenceUriKind(uri: string) {
  if (uri.startsWith("data:")) return "data" as const;
  if (uri.startsWith("http://") || uri.startsWith("https://"))
    return "http" as const;
  if (uri.startsWith("file://")) return "file" as const;
  return "other" as const;
}

function parentNameForRequest(request: GenerateStoryRequest) {
  return (
    request.supportingCharacters?.find((character) =>
      isParentRelationship(character.relationship),
    )?.name ?? "Mom"
  );
}

function redactStoryForImagePrompt(
  story: StorySheetInput,
  request: GenerateStoryRequest,
): StorySheetInput {
  const childName = request.character.name.trim() || story.child_name;
  const parentName = parentNameForRequest(request);
  const redactText = (value: string) =>
    replaceName(replaceName(value, childName, "the child"), parentName, "the caregiver");

  return {
    ...story,
    title: redactText(story.title),
    child_name: "the child",
    parent_name: "the caregiver",
    parent_role: story.parent_role || "caregiver",
    pages: story.pages.map((page) => ({
      ...page,
      text: redactText(page.text),
      scene: redactText(page.scene),
    })),
  };
}

function replaceName(value: string, name: string, replacement: string) {
  const trimmed = name.trim();
  if (!trimmed) return value;
  return value.replace(
    new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "g"),
    replacement,
  );
}

function isParentRelationship(relationship: string) {
  return /parent|mom|mum|mama|mother|dad|dada|papa|father/i.test(relationship);
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
    pages: normalizeStoryPages(story.pages).map((page, index) => ({
      page: index + 1,
      text: normalizeChildName(page.text),
      scene: normalizeChildName(page.scene),
      composition: page.composition,
      emotion: page.emotion,
    })),
  };
}

function normalizeStoryPages(storyPages: StorySheetInput["pages"]) {
  if (storyPages.length < MIN_STORY_PAGES) {
    throw new Error(
      `Generated story must include at least ${MIN_STORY_PAGES} pages. Got ${storyPages.length}.`,
    );
  }
  if (storyPages.length > MAX_STORY_PAGES) {
    throw new Error(
      `Generated story must include no more than ${MAX_STORY_PAGES} pages. Got ${storyPages.length}.`,
    );
  }
  return storyPages;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  await mkdir(outputDir, { recursive: true });

  const metadata = await sharp(sheetImagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height) {
    throw new Error("Storyboard sheet dimensions could not be read.");
  }
  if (width !== height) {
    throw new Error(`Storyboard sheet must be square. Got ${width}x${height}.`);
  }
  if (width % STORYBOARD_GRID_SIZE !== 0 || height % STORYBOARD_GRID_SIZE !== 0) {
    throw new Error(
      `Storyboard sheet size must divide cleanly by ${STORYBOARD_GRID_SIZE}. Got ${width}x${height}.`,
    );
  }

  const panelWidth = width / STORYBOARD_GRID_SIZE;
  const panelHeight = height / STORYBOARD_GRID_SIZE;
  const manifest: SheetSliceManifestEntry[] = [];

  for (let row = 0; row < STORYBOARD_GRID_SIZE; row += 1) {
    for (let col = 0; col < STORYBOARD_GRID_SIZE; col += 1) {
      const left = col * panelWidth;
      const top = row * panelHeight;
      const outputPath = path.join(outputDir, sliceFileName(row, col));

      await sharp(sheetImagePath)
        .extract({ left, top, width: panelWidth, height: panelHeight })
        .png({ quality: 95 })
        .toFile(outputPath);

      manifest.push({
        pageNumber: manifest.length + 1,
        row: row + 1,
        col: col + 1,
        output: pathToFileURL(outputPath).href,
        crop: {
          left,
          top,
          right: left + panelWidth,
          bottom: top + panelHeight,
        },
      });
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function sliceFileName(row: number, col: number) {
  if (row === 0 && col === 0) return "01_cover.png";
  if (row === 0 && col === 1) return "02_belongs_to.png";
  if (row === 0 && col === 2) return "03_the_end.png";
  if (row === 0 && col === 3) return "04_blank.png";
  if (row === 0 && col === 4) return "05_blank.png";

  const storyPage = (row - 1) * STORYBOARD_GRID_SIZE + col + 1;
  return `story_page_${storyPage.toString().padStart(2, "0")}.png`;
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
