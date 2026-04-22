import { Router, type IRouter } from "express";
import { GenerateStoryBody, GenerateStoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Story model did not return JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

router.post("/stories/generate", async (req, res) => {
  const body = GenerateStoryBody.parse(req.body);
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseUrl || !apiKey) {
    res.status(500).json({ message: "Story generation is not configured." });
    return;
  }

  const childName = body.character.name;
  const supportingCast =
    body.supportingCharacters && body.supportingCharacters.length > 0
      ? `The story may include these supporting characters when the narrative calls for it (not forced): ${body.supportingCharacters.map((c) => `${c.name} (${c.relationship})`).join(", ")}.`
      : "";

  const behaviorContext =
    body.mode === "behavior"
      ? `The parent wants a gentle behavior-support story about: ${body.prompt || "a common everyday challenge"}. Weave the lesson naturally — never shame the child, always show understanding and a positive path forward.`
      : `Create a warm, imaginative story. Parent's idea or theme: ${body.prompt || "surprise me with something magical and cozy"}.`;

  const systemPrompt = `You are a children's picture book author writing Montessori-inspired, emotionally warm stories.
Return ONLY valid JSON with this exact structure:
{
  "title": "string — evocative picture book title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "1-3 short sentences, simple vocabulary, age 3-7, warm and vivid",
      "illustrationPrompt": "Concise watercolor illustration description for this page — mention the main character by name, their appearance, action, setting, and mood. Keep it under 40 words."
    }
  ],
  "reflectionQuestion": "A single warm question for parent and child to discuss after the story."
}
Rules:
- Write exactly 12 pages (pageNumber 1 through 12).
- Each page's text is 1-3 SHORT sentences. Simple words. Gentle rhythm.
- The main character's name is ${childName} — use it often so the child feels seen.
- Illustration prompts must describe a WATERCOLOR children's book scene. Always describe ${childName} consistently (same hair, clothing palette). Keep scenes warm, pastel, cozy.
- Calm, hopeful ending. No scary content.
- Return only the JSON object, no markdown fences.`;

  const userPrompt = `Child's name: ${childName}.
${behaviorContext}
${supportingCast}
Write the 12-page watercolor picture book now.`;

  const storyResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!storyResponse.ok) {
    const text = await storyResponse.text();
    req.log.error({ status: storyResponse.status, text }, "Story generation failed");
    res.status(502).json({ message: "The story service could not generate a story." });
    return;
  }

  const storyData = (await storyResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const storyContent = storyData.choices?.[0]?.message?.content;

  if (!storyContent) {
    res.status(502).json({ message: "The story service returned an empty story." });
    return;
  }

  const parsed = extractJson(storyContent);
  const story = GenerateStoryResponse.parse(parsed);

  let coverImageUrl: string | undefined;
  try {
    const coverPrompt = `Watercolor children's picture book cover illustration. A child named ${childName} — ${story.pages[0]?.illustrationPrompt ?? "a happy child in a magical garden"}. Soft pastel palette, hand-painted watercolor style, gentle and warm, no text on the image.`;
    const imageResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: coverPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });
    if (imageResponse.ok) {
      const imageData = (await imageResponse.json()) as {
        data?: Array<{ url?: string }>;
      };
      coverImageUrl = imageData.data?.[0]?.url;
    } else {
      req.log.warn({ status: imageResponse.status }, "Cover image generation failed — continuing without cover");
    }
  } catch (err) {
    req.log.warn({ err }, "Cover image generation threw — continuing without cover");
  }

  res.json({ ...story, coverImageUrl });
});

export default router;
