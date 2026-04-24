import assert from "node:assert/strict";
import test from "node:test";
import { getAiConfig } from "./aiClient";

test("getAiConfig defaults the image model to the OpenRouter Gemini preview model", () => {
  const previous = {
    baseUrl: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    textModel: process.env.AI_INTEGRATIONS_OPENROUTER_MODEL,
    imageModel: process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL,
    legacyBaseUrl: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    legacyApiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    legacyTextModel: process.env.AI_INTEGRATIONS_OPENAI_MODEL,
    legacyImageModel: process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL,
  };

  try {
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY = "test-key";
    delete process.env.AI_INTEGRATIONS_OPENROUTER_MODEL;
    delete process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL;
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_MODEL;
    delete process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL;

    const config = getAiConfig();

    assert.ok(config);
    assert.equal(config?.textModel, "openai/gpt-5.4-nano");
    assert.equal(config?.imageModel, "google/gemini-3.1-flash-image-preview");
  } finally {
    if (previous.baseUrl === undefined) delete process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
    else process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL = previous.baseUrl;

    if (previous.apiKey === undefined) delete process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
    else process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY = previous.apiKey;

    if (previous.textModel === undefined) delete process.env.AI_INTEGRATIONS_OPENROUTER_MODEL;
    else process.env.AI_INTEGRATIONS_OPENROUTER_MODEL = previous.textModel;

    if (previous.imageModel === undefined) delete process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL;
    else process.env.AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL = previous.imageModel;

    if (previous.legacyBaseUrl === undefined) delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    else process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = previous.legacyBaseUrl;

    if (previous.legacyApiKey === undefined) delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    else process.env.AI_INTEGRATIONS_OPENAI_API_KEY = previous.legacyApiKey;

    if (previous.legacyTextModel === undefined) delete process.env.AI_INTEGRATIONS_OPENAI_MODEL;
    else process.env.AI_INTEGRATIONS_OPENAI_MODEL = previous.legacyTextModel;

    if (previous.legacyImageModel === undefined) delete process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL;
    else process.env.AI_INTEGRATIONS_OPENAI_IMAGE_MODEL = previous.legacyImageModel;
  }
});
