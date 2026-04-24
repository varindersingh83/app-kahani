import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { GenerateStoryResponse } from "@workspace/api-zod";
import type { AiConfig, BookBrief, CharacterLock, PipelineStory, SheetPlacement, StoryPlan } from "./types";

const execFile = promisify(execFileCallback);

export function getAiConfig(): AiConfig | null {
  const baseUrl =
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ??
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ??
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    textModel:
      process.env.AI_INTEGRATIONS_OPENROUTER_MODEL ??
      process.env.AI_INTEGRATIONS_OPENAI_MODEL ??
      "openai/gpt-5.4-nano",
    imageModel:
      process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL ??
      process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL ??
      "google/gemini-3.1-flash-image-preview",
    openRouterSiteUrl: process.env.OPENROUTER_SITE_URL,
    openRouterAppTitle: process.env.OPENROUTER_APP_TITLE,
  };
}

export function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Story model did not return JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

type MultimodalImageResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
      images?: Array<{
        image_url?: { url?: string };
        imageUrl?: { url?: string };
      }>;
    };
  }>;
};

function headers(config: AiConfig) {
  const aiHeaders: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openRouterSiteUrl) {
    aiHeaders["HTTP-Referer"] = config.openRouterSiteUrl;
  }
  if (config.openRouterAppTitle) {
    aiHeaders["X-OpenRouter-Title"] = config.openRouterAppTitle;
  }
  return aiHeaders;
}

export async function callJsonChat(config: AiConfig, systemPrompt: string, userPrompt: string) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      model: config.textModel,
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI chat request failed with ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI chat request returned empty content.");
  }

  return extractJson(content);
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
        if (!imageUrl) return null;
        return {
          type: "image_url",
          image_url: { url: imageUrl, detail: "high" as const },
        };
      }),
    )).filter(Boolean),
  ];

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: headers(config),
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
    const text = await response.text();
    throw new Error(`AI image request failed with ${response.status}: ${text}`);
  }

  return (await response.json()) as MultimodalImageResponse;
}

function extractMessageText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === "object" && "text" in part ? String((part as { text?: string }).text ?? "") : ""))
      .join("")
      .trim();
  }
  return "";
}

function extractImageUrl(imageResponse: MultimodalImageResponse) {
  const image = imageResponse.choices?.[0]?.message?.images?.[0];
  return image?.image_url?.url ?? image?.imageUrl?.url;
}

export async function generateCoverImage(
  config: AiConfig,
  prompt: string,
  referenceImageUri?: string,
): Promise<string | undefined> {
  try {
    const imageData = await callMultimodalImageModel(config, prompt, {
      aspectRatio: "1:1",
      imageSize: "1K",
    }, referenceImageUri ? [referenceImageUri] : []);
    const imageUrl = extractImageUrl(imageData);
    if (imageUrl) {
      return imageUrl;
    }
    if (shouldUseOfflineFallback()) {
      return generateOfflineCoverImage(prompt);
    }
    return undefined;
  } catch (error) {
    if (shouldUseOfflineFallback()) {
      console.warn(`Falling back to offline cover generation: ${String(error)}`);
      return generateOfflineCoverImage(prompt);
    }
    throw error;
  }
}

export async function generateStoryboardSheet(
  config: AiConfig,
  input: {
    prompt: string;
    brief: BookBrief;
    characterLock: CharacterLock;
    pageSlots: SheetPlacement[];
    storyPlan?: StoryPlan;
    referenceImageUri?: string;
  },
): Promise<PipelineStory> {
  try {
    const imageData = await callMultimodalImageModel(config, input.prompt, {
      aspectRatio: "3:4",
      imageSize: "2K",
    }, input.referenceImageUri ? [input.referenceImageUri] : []);

    const content = extractMessageText(imageData.choices?.[0]?.message?.content);
    const sheetImageUrl = extractImageUrl(imageData);
    if (!sheetImageUrl) {
      throw new Error("Storyboard sheet request returned no image.");
    }

    if (!content) {
      console.warn("Storyboard sheet request returned an image without story JSON; using deterministic fallback text with the live sheet image.");
      return buildDeterministicStoryboardSheet(input, sheetImageUrl);
    }

    const parsed = extractJson(content);
    const story = GenerateStoryResponse.parse(parsed);
    return {
      ...story,
      sheetImageUrl,
    };
  } catch (error) {
    if (!shouldUseOfflineFallback()) {
      throw error;
    }
    console.warn(`Falling back to offline storyboard generation: ${String(error)}`);
    return generateOfflineStoryboardSheet(input);
  }
}

export async function generateStoryboardSheetImage(
  config: AiConfig,
  input: {
    prompt: string;
    referenceImageUri?: string;
  },
): Promise<string | undefined> {
  try {
    const imageData = await callMultimodalImageModel(config, input.prompt, {
      aspectRatio: "3:4",
      imageSize: "2K",
    }, input.referenceImageUri ? [input.referenceImageUri] : []);

    const sheetImageUrl = extractImageUrl(imageData);
    if (sheetImageUrl) {
      return sheetImageUrl;
    }
    if (shouldUseOfflineFallback()) {
      return generateOfflineStoryboardSheetImage(input.prompt);
    }
    return undefined;
  } catch (error) {
    if (shouldUseOfflineFallback()) {
      console.warn(`Falling back to offline storyboard sheet image generation: ${String(error)}`);
      return generateOfflineStoryboardSheetImage(input.prompt);
    }
    throw error;
  }
}

function shouldUseOfflineFallback() {
  return process.env.NODE_ENV !== "production" && process.env.AI_INTEGRATIONS_DISABLE_OFFLINE_FALLBACK !== "1";
}

async function generateOfflineCoverImage(prompt: string) {
  return generateGeneratedPngUrl({
    kind: "cover",
    width: 1536,
    height: 1536,
    title: "Offline cover",
    subtitle: prompt,
  });
}

async function generateOfflineStoryboardSheet(input: {
  prompt: string;
  brief: BookBrief;
  characterLock: CharacterLock;
  pageSlots: SheetPlacement[];
}): Promise<PipelineStory> {
  const title = buildOfflineTitle(input.brief);
  const reflectionQuestion = buildReflectionQuestion(input.brief);
  const pages = buildOfflinePages(input.brief, input.pageSlots);
  const sheetImageUrl = await generateGeneratedPngUrl({
    kind: "sheet",
    width: 1800,
    height: 2400,
    title,
    subtitle: input.brief.prompt ?? input.prompt,
    pages,
  });

  return GenerateStoryResponse.parse({
    title,
    reflectionQuestion,
    pages,
    sheetImageUrl,
  });
}

function buildOfflineTitle(brief: BookBrief) {
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || `${brief.childName}'s story`;
  return `${brief.childName} and the ${topic.slice(0, 38)}`;
}

function buildReflectionQuestion(brief: BookBrief) {
  const topic = brief.prompt?.trim().replace(/[.!?]+$/, "") || "big feelings";
  return `What can ${brief.childName} do when ${topic.toLowerCase()} comes up again?`;
}

function buildOfflinePages(brief: BookBrief, pageSlots: SheetPlacement[]) {
  const theme = brief.prompt?.trim().replace(/[.!?]+$/, "") || "a tricky moment";
  return pageSlots
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((slot) => {
      const text = buildPageText(brief.childName, theme, slot.pageNumber);
      return {
        pageNumber: slot.pageNumber,
        text,
        illustrationPrompt: `Watercolor children's book illustration, page ${slot.pageNumber}, ${brief.childName}, ${theme}, ${slot.panelLabel}, warm gentle expressions, consistent characters.`,
      };
  });
}

function buildDeterministicStoryboardSheet(
  input: {
    prompt: string;
    brief: BookBrief;
    characterLock: CharacterLock;
    pageSlots: SheetPlacement[];
  },
  sheetImageUrl: string,
): PipelineStory {
  return GenerateStoryResponse.parse({
    title: buildOfflineTitle(input.brief),
    reflectionQuestion: buildReflectionQuestion(input.brief),
    pages: buildOfflinePages(input.brief, input.pageSlots),
    sheetImageUrl,
  });
}

async function generateOfflineStoryboardSheetImage(prompt: string) {
  return generateGeneratedPngUrl({
    kind: "sheet",
    width: 1800,
    height: 2400,
    title: "Offline storyboard sheet",
    subtitle: prompt,
  });
}

function buildPageText(childName: string, theme: string, pageNumber: number) {
  const pageText = [
    `${childName} noticed ${theme} and paused to think.`,
    `${childName} tried a kinder choice and watched what happened next.`,
    `${childName} felt proud after making a helpful decision.`,
  ];
  return pageText[(pageNumber - 1) % pageText.length];
}

async function toImageDataUrl(source: string) {
  if (source.startsWith("data:")) return source;

  const bytes = await loadImageBytes(source);
  const mimeType = detectMimeType(source);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function loadImageBytes(source: string) {
  if (source.startsWith("file://")) {
    return readFile(fileURLToPath(source));
  }
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch reference image: ${response.status}`);
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

async function generateGeneratedPngUrl(input: {
  kind: "cover" | "sheet";
  width: number;
  height: number;
  title: string;
  subtitle: string;
  pages?: Array<{
    pageNumber: number;
    text: string;
    illustrationPrompt: string;
  }>;
}) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-offline-"));
  const outPath = path.join(tempRoot, `${input.kind}.png`);
  const script = `
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

kind = sys.argv[1]
width = int(sys.argv[2])
height = int(sys.argv[3])
title = sys.argv[4]
subtitle = sys.argv[5]
out_path = Path(sys.argv[6])

def fit_text(draw, text, max_width, font):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def font(size):
    for name in ["/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Georgia.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size=size)
        except Exception:
            pass
    return ImageFont.load_default()

img = Image.new("RGB", (width, height), "#f6f1e8")
draw = ImageDraw.Draw(img)
title_font = font(54 if kind == "cover" else 42)
body_font = font(30 if kind == "cover" else 26)

if kind == "cover":
    draw.rounded_rectangle((48, 48, width - 48, height - 48), radius=40, fill="#fff8ef", outline="#d9c5ab", width=4)
    lines = fit_text(draw, title, width - 160, title_font)
    y = height // 3
    for line in lines[:4]:
        bbox = draw.textbbox((0, 0), line, font=title_font)
        line_w = bbox[2] - bbox[0]
        draw.text(((width - line_w) / 2, y), line, fill="#2a2018", font=title_font)
        y += (bbox[3] - bbox[1]) + 18
    sub_lines = fit_text(draw, subtitle, width - 220, body_font)
    y += 24
    for line in sub_lines[:5]:
        bbox = draw.textbbox((0, 0), line, font=body_font)
        line_w = bbox[2] - bbox[0]
        draw.text(((width - line_w) / 2, y), line, fill="#6e5845", font=body_font)
        y += (bbox[3] - bbox[1]) + 12
else:
    cols = 3
    rows = 4
    cell_w = width // cols
    cell_h = height // rows
    palette = ["#f7ede2", "#f2e8cf", "#e6efe9", "#e8eef9", "#f9e8ea", "#ede7f6"]
    page_lines = (sys.argv[7:] if len(sys.argv) > 7 else [])
    draw.rounded_rectangle((24, 24, width - 24, height - 24), radius=36, fill="#fffaf2", outline="#d9c5ab", width=4)
    for index in range(rows * cols):
        row = index // cols
        col = index % cols
        left = col * cell_w + 32
        top = row * cell_h + 32
        right = (col + 1) * cell_w - 32
        bottom = (row + 1) * cell_h - 32
        fill = palette[index % len(palette)]
        draw.rounded_rectangle((left, top, right, bottom), radius=28, fill=fill, outline="#c8b59f", width=3)
        label = f"Page {index + 1}"
        bbox = draw.textbbox((0, 0), label, font=title_font)
        draw.text((left + 20, top + 18), label, fill="#2a2018", font=title_font)
        if index < len(page_lines):
            text = page_lines[index]
            snippet = text.split("|")[0][:120]
            lines = fit_text(draw, snippet, right - left - 60, body_font)
            yy = top + 92
            for line in lines[:4]:
                draw.text((left + 20, yy), line, fill="#5c4a39", font=body_font)
                yy += 32

img.save(out_path)
print(out_path)
`;
  const args = [input.kind, String(input.width), String(input.height), input.title, input.subtitle, outPath];
  if (input.pages?.length) {
    args.push(...input.pages.map((page) => `${page.pageNumber}. ${page.text}`));
  }
  await execFile("python3", ["-c", script, ...args]);
  return pathToFileURL(outPath).href;
}
