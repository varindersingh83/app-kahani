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
  StoryQualityReview,
  StoryTextAttempt,
} from "./types";

const MIN_STORY_PAGES = 12;
const MAX_STORY_PAGES = 12;
const STORYBOARD_GRID_SIZE = 4;
const STORY_QA_PASS_SCORE = 8;
const MAX_STORY_TEXT_ATTEMPTS = 3;

type JsonChatClient = typeof callJsonChat;

export async function runStorySheetGeneration(input: {
  bookId: string;
  request: GenerateStoryRequest;
  behaviorFocus?: BehaviorClassificationSummary;
  parentNote?: string;
  outputDir: string;
  config: AiConfig;
  textClient?: JsonChatClient;
  onStep?: (
    step:
      | "writing_story"
      | "painting_sheet"
      | "slicing_pages"
      | "preparing_reader",
    message: string,
  ) => Promise<void> | void;
}): Promise<StorySheetRunResult> {
  const {
    bookId,
    request,
    outputDir,
    config,
    textClient = callJsonChat,
    onStep,
  } = input;
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
  await writeFile(path.join(outputDir, "story-prompt.txt"), `${storyPrompt}\n`);
  const storyTextResult = await generateStoryTextWithQa({
    config,
    request,
    behavior,
    storyPrompt,
    outputDir,
    textClient,
    onStep,
  });
  const storyJson = storyTextResult.story;

  await writeFile(
    path.join(outputDir, "story.json"),
    `${JSON.stringify(storyJson, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "story-qa.json"),
    `${JSON.stringify(storyTextResult.attempts, null, 2)}\n`,
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
    story: storyTextResult.storyUsage,
    storyQa: storyTextResult.qaUsage,
    sheet: imageData.usage ?? null,
    total: sumUsage([
      storyTextResult.storyUsage ?? undefined,
      storyTextResult.qaUsage ?? undefined,
      imageData.usage,
    ]),
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

export async function generateStoryTextWithQa(input: {
  config: AiConfig;
  request: GenerateStoryRequest;
  behavior: string;
  storyPrompt: string;
  outputDir: string;
  textClient: JsonChatClient;
  onStep?: (
    step:
      | "writing_story"
      | "painting_sheet"
      | "slicing_pages"
      | "preparing_reader",
    message: string,
  ) => Promise<void> | void;
}) {
  const attempts: StoryTextAttempt[] = [];
  const storyUsages: ApiUsage[] = [];
  const qaUsages: ApiUsage[] = [];
  let nextPrompt = input.storyPrompt;
  let bestAttempt: StoryTextAttempt | undefined;

  for (let attempt = 1; attempt <= MAX_STORY_TEXT_ATTEMPTS; attempt += 1) {
    await input.onStep?.(
      "writing_story",
      attempt === 1
        ? "Writing the story text"
        : `Rewriting the story text after QA (${attempt}/${MAX_STORY_TEXT_ATTEMPTS})`,
    );
    if (attempt > 1) {
      await writeFile(
        path.join(input.outputDir, `story-rewrite-prompt-${attempt}.txt`),
        `${nextPrompt}\n`,
      );
    }

    const storyResult = await input.textClient(
      input.config,
      "You write exact JSON only. Follow the user's schema and return valid JSON with no markdown or explanation.",
      nextPrompt,
    );
    if (storyResult.usage) storyUsages.push(storyResult.usage);
    const story = normalizeStoryJson(
      storyResult.data as StorySheetInput,
      input.request,
      input.behavior,
    );
    await writeFile(
      path.join(input.outputDir, `story-attempt-${attempt}.json`),
      `${JSON.stringify(story, null, 2)}\n`,
    );

    await input.onStep?.(
      "writing_story",
      `Checking story quality (${attempt}/${MAX_STORY_TEXT_ATTEMPTS})`,
    );
    const reviewResult = await input.textClient(
      input.config,
      "You are a strict story QA judge. Return exact JSON only with no markdown or explanation.",
      buildStoryQaPrompt(story, input.behavior),
    );
    if (reviewResult.usage) qaUsages.push(reviewResult.usage);
    const review = applyDeterministicStoryQualityRules(
      normalizeStoryQualityReview(reviewResult.data as Partial<StoryQualityReview>),
      story,
      input.behavior,
    );
    const accepted = review.pass && review.score >= STORY_QA_PASS_SCORE;
    const currentAttempt: StoryTextAttempt = {
      attempt,
      story,
      review,
      accepted,
    };
    attempts.push(currentAttempt);
    await writeFile(
      path.join(input.outputDir, `story-qa-${attempt}.json`),
      `${JSON.stringify(review, null, 2)}\n`,
    );

    if (!bestAttempt || review.score > bestAttempt.review.score) {
      bestAttempt = currentAttempt;
    }
    if (accepted) {
      return {
        story,
        attempts,
        storyUsage: sumUsage(storyUsages),
        qaUsage: sumUsage(qaUsages),
      };
    }

    nextPrompt = buildStoryRewritePrompt({
      originalPrompt: input.storyPrompt,
      story,
      review,
      attempt,
    });
  }

  const fallback = bestAttempt ?? attempts[attempts.length - 1];
  if (!fallback) throw new Error("Story generation produced no attempts.");
  throw new Error(
    [
      `Story quality QA did not pass after ${MAX_STORY_TEXT_ATTEMPTS} attempts.`,
      `Best score: ${fallback.review.score}/10.`,
      ...fallback.review.issues.map((issue) => `Issue: ${issue}`),
    ].join(" "),
  );
}

export function buildStoryQaPrompt(story: StorySheetInput, behavior: string) {
  return [
    "Rate this short picture-book story for Kahani. Return only valid JSON.",
    "",
    "Parent taste and product bar:",
    "- The story must have exactly 12 pages and follow the literary arc: Deep Immersion, Shift, Volcano, Safe Harbor, Bridge, Cozy Close.",
    "- Pages 7-8 must show the parent's coregulation through stillness, physical proximity, and safety with sparse text.",
    "- Pages 9-10 must offer the specific playful pivot, choice, positive direction, or replacement action from the behavior row.",
    "- Pages 11-12 must show the positive resolution: connection restored, child successful and safe.",
    "- The story must sound like a high-quality children's picture book, not a parenting textbook or behavior plan.",
    "- Require show-don't-tell: parent strategy must appear through action, posture, timing, and warm dialogue rather than explanation.",
    "- Require child-centric sensory language and page-turn pacing: short pages, clear sensory details, and cause/effect movement.",
    "- Require emotional co-regulation: the parent stays calmly present while holding the boundary and does not yell, shame, or give in.",
    "- The parent action must be practical, specific, and recognizable as something a real parent would do.",
    "- The parent action must clearly match a mainstream expert strategy for that behavior: CDC/AAP positive discipline, Montessori discipline, positive behavior support, or child-behavior expert practice.",
    "- The child must practice one visible next-step behavior that directly matches the parent prompt.",
    "- Choices must be logical. Both choices must lead to the desired action.",
    "- Do not reward the problem behavior. Rewards or incentives are okay only after the desired behavior.",
    "- Do not use unsafe, gross, or strange actions.",
    "- Do not solve refusal by chasing, vague symbolism, poetic labels, or cute lines that do not change behavior.",
    "- Reject stories that feel like fragments where nothing actually happened.",
    "- Reject vague parent lines like 'park feet to the gate' unless the action is otherwise concrete and useful.",
    "- Reject generic parent moves that do not match the exact behavior category.",
    "- Reject stories that read like a list of instructions or sample parenting scripts instead of a picture-book scene.",
    "- For rude or disrespectful tone: require a calm communication boundary, an adult-modeled replacement phrase, and the child visibly retrying with kinder or more respectful words. Reject if the plot turns into unrelated compliance like sipping, holding a cup, or moving an object.",
    "- For cleanup: require the object to end up where it belongs; choices may only be two acceptable ways to complete cleanup.",
    "- For screens: require the screen limit to hold; never return the screen because the child protests.",
    "- For aggression or safety: require the unsafe action to be blocked before choices, rewards, or negotiation.",
    "- For separation/dropoff: require a short predictable goodbye or check-in ritual; do not reward escalation with an endless goodbye.",
    "",
    "Return this JSON shape exactly:",
    JSON.stringify(
      {
        score: 0,
        pass: false,
        issues: [
          "specific issue that would make a parent dislike or distrust the story",
        ],
        strengths: ["specific thing that works, if any"],
        rewriteInstructions:
          "specific instructions for a rewrite that fixes the issues",
      },
      null,
      2,
    ),
    "",
    "Scoring:",
    "- 9-10: strong 12-page literary arc, practical, scene-like, parent action makes sense, child visibly practices the target behavior.",
    "- 8: acceptable, minor wording issues only.",
    "- 6-7: understandable but too vague, too poetic, or not practical enough.",
    "- 1-5: unsafe, nonsensical, rewards bad behavior, fake choices, no real activity flow, or no clear child practice.",
    "",
    `Parent behavior prompt: ${behavior}`,
    "",
    "Story JSON:",
    JSON.stringify(story, null, 2),
  ].join("\n");
}

function buildStoryRewritePrompt(input: {
  originalPrompt: string;
  story: StorySheetInput;
  review: StoryQualityReview;
  attempt: number;
}) {
  return [
    "Rewrite the story JSON below. Return only valid JSON. No markdown. No explanation.",
    "",
    "Keep the same JSON schema, child name, parent name, and behavior.",
    "Fix the QA issues exactly. Do not simply polish wording.",
    "Make the story exactly 12 pages and follow this arc: Deep Immersion, Shift, Volcano, Safe Harbor, Bridge, Cozy Close.",
    "Use a concrete expert-aligned parent strategy such as a CDC/AAP-style calm limit and specific direction, a Montessori-style limited choice inside a clear boundary, a positive-behavior replacement skill, a countdown, first/then, a small job, a clear boundary, or a reward after the target behavior.",
    "Make the child visibly practice the target behavior before the ending.",
    "Pages 7-8 must execute calm parent coregulation through stillness, physical proximity, and safety. Pages 9-10 must offer the specific choice, positive direction, playful pivot, or replacement action. Pages 11-12 must show the child softening and connection restored.",
    "For rude tone specifically, the child must retry the same request with kinder or more respectful words after the parent models the phrase.",
    "Avoid vague poetic parent scripts, fake choices, chasing, unsafe sensory actions, and rewards for the problem behavior.",
    "",
    `Previous attempt: ${input.attempt}`,
    "",
    "QA score:",
    String(input.review.score),
    "",
    "QA issues:",
    ...input.review.issues.map((issue) => `- ${issue}`),
    "",
    "Rewrite instructions:",
    input.review.rewriteInstructions,
    "",
    "Original generation prompt:",
    input.originalPrompt,
    "",
    "Story to rewrite:",
    JSON.stringify(input.story, null, 2),
  ].join("\n");
}

export function normalizeStoryQualityReview(
  review: Partial<StoryQualityReview>,
): StoryQualityReview {
  const score = clampScore(Number(review.score));
  const issues = normalizeStringArray(review.issues);
  const strengths = normalizeStringArray(review.strengths);
  const rewriteInstructions =
    typeof review.rewriteInstructions === "string" &&
    review.rewriteInstructions.trim()
      ? review.rewriteInstructions.trim()
      : issues.length > 0
        ? issues.join(" ")
        : "Rewrite with a concrete parent strategy and visible child practice.";
  return {
    score,
    pass: Boolean(review.pass) && score >= STORY_QA_PASS_SCORE,
    issues,
    strengths,
    rewriteInstructions,
  };
}

export function applyDeterministicStoryQualityRules(
  review: StoryQualityReview,
  story: StorySheetInput,
  behavior: string,
): StoryQualityReview {
  const issues = [...review.issues];
  let scoreCap = 10;
  const storyText = story.pages.map((page) => page.text).join("\n").toLowerCase();
  const normalizedBehavior = behavior.toLowerCase();

  if (isRudeToneBehavior(normalizedBehavior)) {
    const hasCommunicationBoundary =
      /\b(kind|respectful|gentle|polite)\s+(voice|words|tone)\b/.test(storyText) ||
      /\b(i'?ll|i will|we can)\s+(listen|hear|talk)\b/.test(storyText) ||
      /\btry again\b/.test(storyText) ||
      /\bask again\b/.test(storyText);
    const hasReplacementRequest =
      /\bplease\b/.test(storyText) ||
      /\bcan i\b/.test(storyText) ||
      /\bmay i\b/.test(storyText) ||
      /\btry:\s*["“]/.test(storyText) ||
      /\bsay,?\s*["“]/.test(storyText);

    if (!hasCommunicationBoundary || !hasReplacementRequest) {
      issues.push(
        "Rude-tone stories must show a calm communication boundary, an adult-modeled replacement phrase, and the child retrying with kinder or more respectful words.",
      );
      scoreCap = Math.min(scoreCap, 5);
    }

    if (
      /\b(sip|cup|spoon|cereal|table mat)\b/.test(storyText) &&
      !/\b(kind|respectful|polite|please|ask again|try again)\b/.test(storyText)
    ) {
      issues.push(
        "Rude-tone story drifted into object or meal compliance instead of respectful communication repair.",
      );
      scoreCap = Math.min(scoreCap, 5);
    }
  }

  if (issues.length === review.issues.length) return review;

  const score = Math.min(review.score, scoreCap);
  return {
    ...review,
    score,
    pass: false,
    issues,
    rewriteInstructions:
      issues[issues.length - 1] ??
      "Rewrite with an expert-aligned parent strategy and visible child practice.",
  };
}

function isRudeToneBehavior(value: string) {
  return /\b(rude|disrespect|talks?\s+back|sassy|sass|sharp tone|mean voice|bad tone|yell(?:s|ing)? at parents?)\b/.test(
    value,
  );
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(10, Math.round(score)));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildBehaviorPrompt(
  request: GenerateStoryRequest,
  behaviorFocus?: BehaviorClassificationSummary,
) {
  if (behaviorFocus && request.mode === "behavior") {
    return [
      behaviorFocus.sourceRow
        ? `Template row: ${behaviorFocus.sourceRow}.`
        : undefined,
      `Visible behavior: ${behaviorFocus.visibleBehavior}.`,
      `Scene/context: ${behaviorFocus.scene}.`,
      `Likely mechanism: ${behaviorFocus.mechanism}.`,
      `Story strategy: ${behaviorFocus.strategy}.`,
      `Child story skill: ${behaviorFocus.childStorySkill}.`,
      `Target outcome: ${behaviorFocus.targetOutcome}.`,
      behaviorFocus.avoidDoing ? `Avoid doing: ${behaviorFocus.avoidDoing}.` : undefined,
      behaviorFocus.expertSources
        ? `Expert source basis: ${behaviorFocus.expertSources}.`
        : undefined,
      "Write one focused behavior-support story around this primary issue only. Show practice and small progress, not permanent correction.",
    ]
      .filter(Boolean)
      .join(" ");
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
    return [
      `Child identity lock: ${appearance}`,
      "Keep the main child consistent. Do not infer gender from the child's name if it conflicts with this identity lock.",
      "If the parent-provided identity explicitly indicates a girl/feminine presentation, the story may use girl-coded familiar toys, pink accents, dolls, plush toys, art, or pretend-play objects when they fit the scene.",
      "If the parent-provided identity explicitly indicates a boy/masculine presentation, the story may use boy-coded familiar toys, blue accents, blocks, cars, trains, balls, or construction play when they fit the scene.",
      "If gender presentation is not explicit, choose neutral toys and colors.",
    ].join(" ");
  }
  return "Child identity lock: do not infer gender from the child's name. Use neutral wording, toys, and colors unless a gender presentation is explicitly provided.";
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

export async function sliceStoryboardSheet(
  sheetImagePath: string,
  outputDir: string,
) {
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
