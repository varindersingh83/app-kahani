import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createGoogleBooksProvider,
  createOpenLibraryProvider,
  verifyReferenceBooks,
  type BookSearchProvider,
} from "./bookVerifier";
import { buildRecordForMarkdown, writeBehaviorStoryLibraryArtifacts } from "./markdownWriter";
import { generateApprovedStoryConcepts, type JsonChatClient } from "./storyConceptGenerator";
import {
  buildGenerationStatus,
  slugifyBehavior,
  type ApiUsage,
  type BehaviorStoryLibraryRecord,
  type BehaviorTemplate,
  type IssueAttemptLog,
} from "./types";

type AiConfig = {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  openRouterSiteUrl?: string;
  openRouterAppTitle?: string;
};

type RunnerOptions = {
  repoRoot: string;
  outputDir: string;
  behaviorTemplates: BehaviorTemplate[];
  providers: BookSearchProvider[];
  jsonClient: JsonChatClient;
  sourceRows?: number[];
  limit?: number;
  batchSize?: number;
  maxBatches?: number;
  targetConcepts?: number;
  generatedAt?: string;
};

export type RunnerSummary = {
  outputDir: string;
  issueCount: number;
  completeCount: number;
  manualReviewNeededCount: number;
  failedCount: number;
  approvedConceptCount: number;
  missingConceptCount: number;
  warnings: string[];
  usage: ApiUsage | null;
};

const repoRoot = path.resolve(import.meta.dirname, "../../..");

export async function loadBehaviorTemplates(root = repoRoot) {
  const modulePath = path.join(
    root,
    "artifacts",
    "api-server",
    "src",
    "services",
    "story-sheet",
    "behaviorIssueTemplate.ts",
  );
  const module = await import(pathToFileURL(modulePath).href);
  const templates = module.BEHAVIOR_ISSUE_TEMPLATE;
  if (!Array.isArray(templates)) {
    throw new Error("BEHAVIOR_ISSUE_TEMPLATE export was not an array.");
  }
  return templates as BehaviorTemplate[];
}

export async function runBehaviorStoryLibrary(options: RunnerOptions) {
  const outputDir = options.outputDir;
  const runDir = path.join(outputDir, "runs", timestampForPath(options.generatedAt));
  const attemptsDir = path.join(runDir, "issue-attempts");
  await mkdir(attemptsDir, { recursive: true });

  const selected = selectTemplates(options.behaviorTemplates, {
    sourceRows: options.sourceRows,
    limit: options.limit,
  });
  const records: BehaviorStoryLibraryRecord[] = [];
  const warnings: string[] = [];
  const usages: ApiUsage[] = [];

  for (const behavior of selected) {
    const slug = slugifyBehavior(behavior.sourceRow, behavior.visibleBehavior);
    const attemptLog: IssueAttemptLog = {
      sourceRow: behavior.sourceRow,
      categoryId: behavior.categoryId,
      behaviorIssue: behavior.visibleBehavior,
      batches: [],
      warnings: [],
    };

    try {
      const references = await verifyReferenceBooks({
        behavior,
        providers: options.providers,
      });
      attemptLog.warnings.push(...references.warnings);
      warnings.push(...references.warnings.map((warning) => `${slug}: ${warning}`));

      const generated = await generateApprovedStoryConcepts({
        behavior,
        referenceBooks: references.books,
        jsonClient: options.jsonClient,
        batchSize: options.batchSize,
        maxBatches: options.maxBatches,
        targetCount: options.targetConcepts,
      });
      attemptLog.batches.push(...generated.attempts);
      if (generated.usage) usages.push(generated.usage);

      const status = {
        ...generated.status,
        warnings: [...references.warnings, ...generated.status.warnings],
      };
      records.push(
        buildRecordForMarkdown({
          sourceRow: behavior.sourceRow,
          categoryId: behavior.categoryId,
          behaviorIssue: behavior.visibleBehavior,
          referenceBooks: references.books,
          storyConcepts: generated.concepts,
          generationStatus: status,
        }),
      );
    } catch (error) {
      const message = String(error);
      attemptLog.warnings.push(message);
      warnings.push(`${slug}: ${message}`);
      records.push(
        buildRecordForMarkdown({
          sourceRow: behavior.sourceRow,
          categoryId: behavior.categoryId,
          behaviorIssue: behavior.visibleBehavior,
          referenceBooks: [],
          storyConcepts: [],
          generationStatus: buildGenerationStatus({
            approvedCount: 0,
            batchesTried: 0,
            failed: true,
            warnings: [message],
          }),
        }),
      );
    }

    await writeFile(
      path.join(attemptsDir, `${slug}.json`),
      `${JSON.stringify(attemptLog, null, 2)}\n`,
      "utf8",
    );
    await writeBehaviorStoryLibraryArtifacts({
      outputDir,
      records,
      generatedAt: options.generatedAt,
    });
  }

  const { library } = await writeBehaviorStoryLibraryArtifacts({
    outputDir,
    records,
    generatedAt: options.generatedAt,
  });
  const summary: RunnerSummary = {
    outputDir,
    ...library.summary,
    warnings,
    usage: sumUsage(usages),
  };
  await writeFile(
    path.join(runDir, "run-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  return { library, summary };
}

export function selectTemplates(
  templates: BehaviorTemplate[],
  options: { sourceRows?: number[]; limit?: number },
) {
  const selected = options.sourceRows?.length
    ? templates.filter((entry) => options.sourceRows?.includes(entry.sourceRow))
    : templates;
  return typeof options.limit === "number" ? selected.slice(0, options.limit) : selected;
}

export function createJsonChatClient(config: AiConfig): JsonChatClient {
  return async (systemPrompt, userPrompt) => {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
    });
    if (!response.ok) {
      throw new Error(`Story concept JSON request failed with ${response.status}: ${await response.text()}`);
    }
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: ApiUsage;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Story concept JSON request returned empty content.");
    return { data: extractJson(content), usage: data.usage };
  };
}

export function getAiConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AiConfig | null {
  const baseUrl =
    env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ??
    env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey =
    env.AI_INTEGRATIONS_OPENROUTER_API_KEY ??
    env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return {
    baseUrl,
    apiKey,
    textModel:
      env.AI_INTEGRATIONS_OPENROUTER_MODEL ??
      env.AI_INTEGRATIONS_OPENAI_MODEL ??
      "openai/gpt-5.4-nano",
    openRouterSiteUrl: env.OPENROUTER_SITE_URL,
    openRouterAppTitle: env.OPENROUTER_APP_TITLE,
  };
}

async function main() {
  const config = getAiConfigFromEnv();
  if (!config) {
    throw new Error(
      "AI credentials are missing. Set AI_INTEGRATIONS_OPENROUTER_BASE_URL and AI_INTEGRATIONS_OPENROUTER_API_KEY.",
    );
  }
  const generatedAt = new Date().toISOString();
  const outputDir =
    process.env.BEHAVIOR_STORY_LIBRARY_OUTPUT_DIR ??
    path.join(repoRoot, "artifacts", "behavior-story-library");
  const sourceRows = parseSourceRows(process.env.BEHAVIOR_STORY_LIBRARY_SOURCE_ROWS);
  const limit = parseOptionalNumber(process.env.BEHAVIOR_STORY_LIBRARY_LIMIT);
  const batchSize = parseOptionalNumber(process.env.BEHAVIOR_STORY_LIBRARY_BATCH_SIZE);
  const maxBatches = parseOptionalNumber(process.env.BEHAVIOR_STORY_LIBRARY_MAX_BATCHES);
  const templates = await loadBehaviorTemplates(repoRoot);
  const result = await runBehaviorStoryLibrary({
    repoRoot,
    outputDir,
    behaviorTemplates: templates,
    providers: [
      createOpenLibraryProvider(),
      createGoogleBooksProvider(),
    ],
    jsonClient: createJsonChatClient(config),
    sourceRows,
    limit,
    batchSize,
    maxBatches,
    generatedAt,
  });
  console.log(JSON.stringify(result.summary, null, 2));
}

function headers(config: AiConfig) {
  const result: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openRouterSiteUrl) result["HTTP-Referer"] = config.openRouterSiteUrl;
  if (config.openRouterAppTitle) result["X-OpenRouter-Title"] = config.openRouterAppTitle;
  return result;
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function parseSourceRows(value?: string) {
  if (!value) return undefined;
  return value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

function parseOptionalNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function timestampForPath(value = new Date().toISOString()) {
  return value.replace(/[:.]/g, "-");
}

function sumUsage(usages: ApiUsage[]) {
  if (usages.length === 0) return null;
  return usages.reduce<ApiUsage>((sum, usage) => {
    for (const [key, value] of Object.entries(usage)) {
      if (typeof value === "number") {
        sum[key] = (typeof sum[key] === "number" ? sum[key] : 0) + value;
      }
    }
    return sum;
  }, {});
}

if (process.argv[1]) {
  const invoked = path.resolve(process.argv[1]);
  const current = path.resolve(new URL(import.meta.url).pathname);
  if (invoked === current) {
    main().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }
}
