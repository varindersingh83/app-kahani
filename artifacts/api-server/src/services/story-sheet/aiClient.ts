import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AiConfig, ApiUsage } from "./types";

export function getAiConfig(): AiConfig | null {
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
    throw new Error("Model did not return valid JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function jsonSlice(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }
  return text.slice(start, end + 1);
}

function headers(config: AiConfig) {
  const result: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openRouterSiteUrl)
    result["HTTP-Referer"] = config.openRouterSiteUrl;
  if (config.openRouterAppTitle)
    result["X-OpenRouter-Title"] = config.openRouterAppTitle;
  return result;
}

export async function callJsonChat(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const data = await requestJsonChat(config, systemPrompt, userPrompt);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story JSON request returned empty content.");

  try {
    return {
      data: extractJson(content),
      usage: data.usage,
    };
  } catch (error) {
    const repaired = await repairJsonChat(config, content, String(error));
    return {
      data: extractJson(repaired),
      usage: data.usage,
    };
  }
}

async function requestJsonChat(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        model: config.textModel,
        max_completion_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Story JSON request failed with ${response.status}: ${await response.text()}`,
    );
  }

  return (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: ApiUsage;
  };
}

async function repairJsonChat(
  config: AiConfig,
  invalidJsonText: string,
  parseError: string,
) {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        model: config.textModel,
        max_completion_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You repair JSON only. Return valid JSON with no markdown, no explanation, and no extra text.",
          },
          {
            role: "user",
            content: [
              `The JSON below failed to parse with this error: ${parseError}`,
              "Repair syntax only. Preserve the exact schema, keys, story text, and values as much as possible.",
              jsonSlice(invalidJsonText),
            ].join("\n\n"),
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Story JSON repair failed with ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story JSON repair returned empty content.");
  return content;
}

export async function callMultimodalImageModel(
  config: AiConfig,
  prompt: string,
  imageConfig: { aspectRatio: string; imageSize: string },
  referenceImageUris: string[] = [],
) {
  const contentParts = [
    { type: "text", text: prompt },
    ...(await Promise.all(
      referenceImageUris.map(async (uri) => {
        const url = await toImageDataUrl(uri).catch((error) => {
          throw new Error(
            `Reference image could not be attached: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
        return {
          type: "image_url",
          image_url: { url, detail: "high" as const },
        };
      }),
    )),
  ];

  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
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
    },
  );

  if (!response.ok) {
    throw new Error(
      `Image request failed with ${response.status}: ${await response.text()}`,
    );
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
    usage?: ApiUsage;
  };
}

export function extractImageUrl(imageData: {
  choices?: Array<{
    message?: {
      images?: Array<{
        image_url?: { url?: string };
        imageUrl?: { url?: string };
      }>;
    };
  }>;
}) {
  const image = imageData.choices?.[0]?.message?.images?.[0];
  return image?.image_url?.url ?? image?.imageUrl?.url;
}

async function toImageDataUrl(source: string) {
  if (source.startsWith("data:")) return source;
  const bytes = await readImageBytes(source);
  return `data:${detectMimeType(source)};base64,${bytes.toString("base64")}`;
}

async function readImageBytes(source: string) {
  if (source.startsWith("file://")) return readFile(fileURLToPath(source));
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);
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
