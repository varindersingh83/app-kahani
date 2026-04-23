import { GenerateStoryResponse } from "@workspace/api-zod";
import type { AiConfig, PipelineStory } from "./types";

export function getAiConfig(): AiConfig | null {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    textModel: process.env.AI_INTEGRATIONS_OPENAI_MODEL ?? "gpt-4o",
    imageModel: process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL ?? "dall-e-3",
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

export async function generateInitialStory(
  config: AiConfig,
  childName: string,
  behaviorContext: string,
  supportingCast: string,
  learningHints: string,
): Promise<PipelineStory> {
  const systemPrompt = `You are a children's picture book author writing Montessori-inspired, emotionally warm stories.
Return ONLY valid JSON with this exact structure:
{
  "title": "string - evocative picture book title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "1-3 short sentences, simple vocabulary, age 2-5, warm and vivid",
      "illustrationPrompt": "Concise watercolor illustration description for this page - mention the main character by name, their appearance, action, setting, and mood. Keep it under 40 words."
    }
  ],
  "reflectionQuestion": "A single warm question for parent and child to discuss after the story."
}
Rules:
- Write exactly 12 pages (pageNumber 1 through 12).
- Each page's text is 1-3 SHORT sentences. Simple words. Gentle rhythm.
- The main character's name is ${childName}. Use it often so the child feels seen.
- Illustration prompts must describe a watercolor children's book scene. Always describe ${childName} consistently with the same hair and clothing palette.
- Calm, hopeful ending. No scary content.
- Return only the JSON object, no markdown fences.`;

  const userPrompt = `Child's name: ${childName}.
${behaviorContext}
${supportingCast}
${learningHints}
Write the 12-page watercolor picture book now.`;

  const parsed = await callJsonChat(config, systemPrompt, userPrompt);
  return GenerateStoryResponse.parse(parsed);
}

export async function rewritePage(
  config: AiConfig,
  story: PipelineStory,
  pageNumber: number,
  childName: string,
  characterLock: string,
  failures: string[],
): Promise<PipelineStory["pages"][number]> {
  const page = story.pages.find((candidate) => candidate.pageNumber === pageNumber);
  const parsed = await callJsonChat(
    config,
    `You repair one page of a children's picture book. Return ONLY JSON shaped as {"pageNumber": number, "text": string, "illustrationPrompt": string}.`,
    `Book title: ${story.title}
Child: ${childName}
Character lock: ${characterLock}
Page number to repair: ${pageNumber}
Current page text: ${page?.text ?? ""}
Current illustration prompt: ${page?.illustrationPrompt ?? ""}
Failures to fix: ${failures.join("; ")}
Keep the page simple for ages 2-5 and keep the illustration prompt under 40 words.`,
  );

  const repaired = GenerateStoryResponse.shape.pages.element.parse(parsed);
  return { ...repaired, pageNumber };
}

export async function generateCoverImage(
  config: AiConfig,
  childName: string,
  story: PipelineStory,
): Promise<string | undefined> {
  const coverPrompt = `Watercolor children's picture book cover illustration. A child named ${childName} - ${story.pages[0]?.illustrationPrompt ?? "a happy child in a magical garden"}. Soft pastel palette, hand-painted watercolor style, gentle and warm, no text on the image.`;

  if (config.baseUrl.includes("openrouter.ai")) {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        model: config.imageModel,
        messages: [{ role: "user", content: coverPrompt }],
        modalities: ["image", "text"],
        image_config: {
          aspect_ratio: "1:1",
          image_size: "1K",
        },
      }),
    });
    if (!response.ok) return undefined;
    const imageData = (await response.json()) as {
      choices?: Array<{
        message?: {
          images?: Array<{ image_url?: { url?: string }; imageUrl?: { url?: string } }>;
        };
      }>;
    };
    const image = imageData.choices?.[0]?.message?.images?.[0];
    return image?.image_url?.url ?? image?.imageUrl?.url;
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      model: config.imageModel,
      prompt: coverPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    }),
  });
  if (!response.ok) return undefined;

  const imageData = (await response.json()) as {
    data?: Array<{ url?: string }>;
  };
  return imageData.data?.[0]?.url;
}
