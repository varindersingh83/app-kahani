import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoryInput = {
  title: string;
  child_name: string;
  behavior: string;
  pages: Array<{
    page: number;
    text: string;
    scene: string;
    composition: string;
    emotion: string;
  }>;
};

const repoRoot = path.resolve(import.meta.dirname, "../..");
const inputPath = process.env.SHEET_TEST_INPUT_PATH ?? path.join(repoRoot, "scripts", "data", "sheet-test-input.json");
const promptPath = process.env.SHEET_TEST_PROMPT_PATH ?? path.join(repoRoot, "scripts", "data", "sheet-master-prompt.txt");
const outputDir =
  process.env.SHEET_TEST_OUTPUT_DIR ??
  path.join(repoRoot, "artifacts", "sheet-json-runs", new Date().toISOString().replace(/[:.]/g, "-"));
const referenceImage =
  process.env.SHEET_TEST_REFERENCE_IMAGE ??
  path.join(repoRoot, "artifacts", "face-test-data", "ChatGPT-Image-Apr-23--2026--10_18_36-PM", "kids", "kids-01.png");

type AiConfig = {
  baseUrl: string;
  apiKey: string;
  imageModel: string;
  openRouterSiteUrl?: string;
  openRouterAppTitle?: string;
};

async function loadStoryInput() {
  const raw = await readFile(inputPath, "utf8");
  return JSON.parse(raw) as StoryInput;
}

async function loadPromptTemplate() {
  return readFile(promptPath, "utf8");
}

function getAiConfig(): AiConfig | null {
  const baseUrl =
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ??
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ??
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;

  return {
    baseUrl,
    apiKey,
    imageModel:
      process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL ??
      process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL ??
      "google/gemini-3.1-flash-image-preview",
    openRouterSiteUrl: process.env.OPENROUTER_SITE_URL,
    openRouterAppTitle: process.env.OPENROUTER_APP_TITLE,
  };
}

function buildPrompt(template: string, story: StoryInput) {
  return template.replace("{{JSON_INPUT}}", JSON.stringify(story, null, 2));
}

async function saveImageAsset(source: string, destinationBasePath: string) {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma === -1) {
      throw new Error("Invalid data URL image.");
    }
    const metadata = source.slice(5, comma);
    const payload = source.slice(comma + 1);
    const bytes = metadata.includes(";base64") ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload));
    const ext = detectExtension(source);
    const destinationPath = `${destinationBasePath}.${ext}`;
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
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const bytes = Buffer.from(await response.arrayBuffer());
    const destinationPath = `${destinationBasePath}.${ext}`;
    await writeFile(destinationPath, bytes);
    return destinationPath;
  }

  throw new Error(`Unsupported image source: ${source}`);
}

function detectExtension(source: string) {
  const lower = source.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "jpg";
  }
  if (lower.startsWith("data:image/webp") || lower.endsWith(".webp")) {
    return "webp";
  }
  return "png";
}

async function callMultimodalImageModel(
  config: AiConfig,
  prompt: string,
  imageConfig: { aspectRatio: string; imageSize: string },
  referenceImageUris: string[] = [],
) {
  const contentParts = [
    { type: "text", text: prompt },
    ...(await Promise.all(
      referenceImageUris.map(async (uri) => {
        const imageUrl = await toImageDataUrl(uri);
        return {
          type: "image_url",
          image_url: { url: imageUrl, detail: "high" as const },
        };
      }),
    )),
  ];

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openRouterSiteUrl) headers["HTTP-Referer"] = config.openRouterSiteUrl;
  if (config.openRouterAppTitle) headers["X-OpenRouter-Title"] = config.openRouterAppTitle;

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.imageModel,
      max_completion_tokens: 4000,
      messages: [{ role: "user", content: contentParts }],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: imageConfig.aspectRatio,
        image_size: imageConfig.imageSize,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Image request failed with ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as {
    choices?: Array<{
      message?: {
        images?: Array<{
          image_url?: { url?: string };
          imageUrl?: { url?: string };
        }>;
      };
    }>;
  };
}

async function toImageDataUrl(source: string) {
  if (source.startsWith("data:")) return source;
  const bytes = await readImageBytes(source);
  const mimeType = detectMimeType(source);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function readImageBytes(source: string) {
  if (source.startsWith("file://")) {
    return readFile(fileURLToPath(source));
  }
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(source);
}

function detectMimeType(source: string) {
  const lower = source.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}

async function main() {
  const config = getAiConfig();
  if (!config) {
    throw new Error("AI credentials are missing. Set AI_INTEGRATIONS_OPENROUTER_BASE_URL and AI_INTEGRATIONS_OPENROUTER_API_KEY.");
  }

  const story = await loadStoryInput();
  const promptTemplate = await loadPromptTemplate();
  const prompt = buildPrompt(promptTemplate, story);

  await mkdir(outputDir, { recursive: true });
  const referenceCopy = path.join(outputDir, path.basename(referenceImage));
  await copyFile(referenceImage, referenceCopy);

  const request = {
    input: story,
    referenceImage: referenceCopy,
    model: config.imageModel,
  };

  await writeFile(path.join(outputDir, "request.json"), `${JSON.stringify(request, null, 2)}\n`);
  await writeFile(path.join(outputDir, "sheet-prompt.txt"), `${prompt}\n`);
  await writeFile(path.join(outputDir, "canonical-story.json"), `${JSON.stringify(story, null, 2)}\n`);

  const imageData = await callMultimodalImageModel(config, prompt, {
    aspectRatio: "1:1",
    imageSize: "4K",
  }, [referenceCopy]);
  const sheetImageUrl =
    imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
    imageData.choices?.[0]?.message?.images?.[0]?.imageUrl?.url;
  if (!sheetImageUrl) {
    throw new Error("Storyboard sheet request returned no image.");
  }

  const sheetPath = await saveImageAsset(sheetImageUrl, path.join(outputDir, "sheet"));
  await writeFile(path.join(outputDir, "sheet-url.txt"), `${sheetImageUrl}\n`);
  await writeFile(path.join(outputDir, "sheet-path.txt"), `${sheetPath}\n`);

  const pagesDir = path.join(outputDir, "pages");
  await mkdir(pagesDir, { recursive: true });
  await import("node:child_process").then(async ({ execFile }) => {
    const { promisify } = await import("node:util");
    const run = promisify(execFile);
    await run("python3", [path.join(repoRoot, "scripts", "src", "slice-sheet.py"), sheetPath, pagesDir]);
  });

  console.log(`Prompt: ${path.join(outputDir, "sheet-prompt.txt")}`);
  console.log(`Reference image: ${referenceCopy}`);
  console.log(`Sheet image: ${sheetPath}`);
  console.log(`Sliced pages: ${pagesDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
