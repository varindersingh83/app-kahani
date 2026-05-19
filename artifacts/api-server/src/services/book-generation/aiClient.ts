import type { AiConfig } from "../story-sheet/types";
import {
  callMultimodalImageModel,
  extractImageUrl,
  getAiConfig,
} from "../story-sheet/aiClient";

export { getAiConfig };

export async function generateCoverImage(config: AiConfig, prompt: string) {
  const imageData = await callMultimodalImageModel(config, prompt, {
    aspectRatio: "1:1",
    imageSize: "4K",
  });
  return extractImageUrl(imageData);
}

export async function generateStoryboardSheetImage(
  config: AiConfig,
  input: { prompt: string; referenceImageUri?: string },
) {
  const imageData = await callMultimodalImageModel(config, input.prompt, {
    aspectRatio: "1:1",
    imageSize: "4K",
  });
  return extractImageUrl(imageData);
}
