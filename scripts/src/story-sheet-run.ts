import { execFile as execFileCallback } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

type BehaviorPrompt = {
  id: string;
  prompt: string;
};

type StoryInput = {
  title: string;
  child_name: string;
  parent_name: string;
  parent_role: string;
  behavior: string;
  pages: Array<{
    page: number;
    text: string;
    scene: string;
    composition: string;
    emotion: string;
  }>;
};

type AiConfig = {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  imageModel: string;
  openRouterSiteUrl?: string;
  openRouterAppTitle?: string;
};

type SheetSliceManifestEntry = {
  pageNumber: number;
  row: number;
  col: number;
  source: string;
  output: string;
  crop?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
};

const execFile = promisify(execFileCallback);

const repoRoot = path.resolve(import.meta.dirname, "../..");
const behaviorPromptPath = path.join(repoRoot, "scripts", "data", "behavior-prompts.json");
const storyPromptPath = path.join(repoRoot, "scripts", "data", "story-json-master-prompt.txt");
const sheetPromptPath = path.join(repoRoot, "scripts", "data", "sheet-master-prompt.txt");
const outputDir =
  process.env.STORY_SHEET_OUTPUT_DIR ??
  path.join(repoRoot, "artifacts", "story-sheet-runs", new Date().toISOString().replace(/[:.]/g, "-"));
const childrenDir = path.join(repoRoot, "artifacts", "face-test-data", "ChatGPT-Image-Apr-23--2026--10_18_36-PM", "kids");
const adultsDir = path.join(repoRoot, "artifacts", "face-test-data", "ChatGPT-Image-Apr-23--2026--10_18_36-PM", "women");
const childReferenceImage = process.env.STORY_SHEET_CHILD_IMAGE ?? path.join(childrenDir, "kids-01.png");
const parentReferenceImage = process.env.STORY_SHEET_PARENT_IMAGE ?? path.join(adultsDir, "women-01.png");
const childNameSeed = process.env.STORY_SHEET_CHILD_NAME ?? "";
const parentNameSeed = process.env.STORY_SHEET_PARENT_NAME ?? "Mom";
const behaviorIndex = Number(process.env.STORY_SHEET_BEHAVIOR_INDEX ?? "0");
const slicerScriptPath = path.join(repoRoot, "scripts", "src", "slice-sheet.py");
const pythonExecutable =
  process.env.CODEX_PYTHON_BIN ??
  "/Users/varindernagra/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

async function loadBehaviorPrompts() {
  const raw = await readFile(behaviorPromptPath, "utf8");
  return JSON.parse(raw) as BehaviorPrompt[];
}

async function loadTemplate(filePath: string) {
  return readFile(filePath, "utf8");
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

function headers(config: AiConfig) {
  const result: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openRouterSiteUrl) result["HTTP-Referer"] = config.openRouterSiteUrl;
  if (config.openRouterAppTitle) result["X-OpenRouter-Title"] = config.openRouterAppTitle;
  return result;
}

async function callJsonChat(config: AiConfig, systemPrompt: string, userPrompt: string) {
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
    throw new Error(`Story JSON request failed with ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Story JSON request returned empty content.");
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
      referenceImageUris.map(async (uri) => ({
        type: "image_url",
        image_url: { url: await toImageDataUrl(uri), detail: "high" as const },
      })),
    )),
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

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function buildStoryPrompt(template: string, behavior: string, parentName: string) {
  return template
    .replaceAll("{{BEHAVIOR}}", behavior)
    .replaceAll("{{PARENT_NAME}}", parentName);
}

function buildSheetPrompt(template: string, story: StoryInput) {
  return template.replace("{{JSON_INPUT}}", JSON.stringify(story, null, 2));
}

function resolveParentName(referenceImage: string) {
  if (referenceImage.includes("/men/")) return "Dad";
  if (referenceImage.includes("/women/")) return "Mom";
  return parentNameSeed;
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

async function toImageDataUrl(source: string) {
  if (source.startsWith("data:")) return source;
  const bytes = await readImageBytes(source);
  return `data:${detectMimeType(source)};base64,${bytes.toString("base64")}`;
}

function detectMimeType(source: string) {
  const lower = source.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}

async function saveImageAsset(source: string, destinationBasePath: string) {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL image.");
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sliceStoryboardSheet(sheetImagePath: string, outputDir: string) {
  await execFile(pythonExecutable, [
    slicerScriptPath,
    sheetImagePath,
    outputDir,
    "--rows",
    "4",
    "--cols",
    "4",
    "--inset",
    "12",
    "--prefix",
    "page",
    "--format",
    "png",
  ]);

  const manifestPath = path.join(outputDir, "manifest.json");
  return JSON.parse(await readFile(manifestPath, "utf8")) as SheetSliceManifestEntry[];
}

function renderCarouselHtml(input: {
  story: StoryInput;
  sheetImagePath: string;
  slices: SheetSliceManifestEntry[];
  outputDir: string;
  behavior: BehaviorPrompt;
}) {
  const { story, slices, behavior } = input;
  const storyCards = story.pages.map((page) => ({
    label: `Story Page ${page.page}`,
    title: `Page ${page.page}`,
    body: page.text,
    scene: page.scene,
    meta: [page.composition, page.emotion].filter(Boolean),
  }));

  const carouselCards = [
    {
      kind: "cover" as const,
      label: "Cover",
      title: story.title,
      body: "Book cover",
      sliceIndex: 0,
    },
    {
      kind: "ownership" as const,
      label: "Ownership",
      title: `This book belongs to ${story.child_name}`,
      body: "Ownership page",
      sliceIndex: 1,
    },
    ...storyCards.map((card, index) => ({
      ...card,
      kind: "story" as const,
      sliceIndex: index + 4,
    })),
    {
      kind: "end" as const,
      label: "End Page",
      title: "The End",
      body: "Closing page",
      sliceIndex: 2,
    },
    {
      kind: "blank" as const,
      label: "Blank",
      title: "",
      body: "",
      sliceIndex: 3,
    },
  ];

  const cards = carouselCards.map((card, index) => {
    const imageFile = slices[card.sliceIndex]?.output
      ? path.basename(slices[card.sliceIndex]!.output)
      : `page-${String(card.sliceIndex + 1).padStart(2, "0")}.png`;
    const bodyHtml =
      card.kind === "blank"
        ? `<p class="card-scene card-scene-empty"> </p>`
        : card.kind === "story"
          ? `<p class="card-scene">${escapeHtml(card.scene)}</p><div class="card-meta">${card.meta
              .map((item) => `<span>${escapeHtml(item)}</span>`)
              .join("")}</div>`
          : `<p class="card-scene">${escapeHtml(card.body)}</p>`;

    return `
      <article class="card" data-card="${index + 1}">
        <div class="card-image-shell">
          <img src="pages/${escapeHtml(imageFile)}" alt="${escapeHtml(card.title || card.label)}" />
        </div>
        <div class="card-copy">
          <div class="card-kicker">${escapeHtml(card.label)}</div>
          ${card.title ? `<h2>${escapeHtml(card.title)}</h2>` : `<h2 class="card-title-empty">&nbsp;</h2>`}
          ${bodyHtml}
        </div>
      </article>
    `;
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(story.title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6efe5;
        --bg-2: #fef9f1;
        --ink: #24180f;
        --muted: #7f6a57;
        --card: rgba(255, 255, 255, 0.88);
        --line: rgba(116, 90, 64, 0.18);
        --shadow: 0 18px 60px rgba(86, 62, 35, 0.14);
        --accent: #d9784a;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(236, 190, 146, 0.35), transparent 32%),
          radial-gradient(circle at top right, rgba(213, 224, 243, 0.6), transparent 28%),
          linear-gradient(180deg, var(--bg-2), var(--bg));
        color: var(--ink);
      }
      .page {
        max-width: 1280px;
        margin: 0 auto;
        padding: 28px 20px 36px;
      }
      .hero {
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px);
        align-items: stretch;
        margin-bottom: 26px;
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.7);
        box-shadow: var(--shadow);
        backdrop-filter: blur(12px);
      }
      .hero-copy {
        padding: 26px;
        display: grid;
        gap: 14px;
        align-content: start;
      }
      .eyebrow {
        display: inline-flex;
        width: fit-content;
        gap: 8px;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(217, 120, 74, 0.12);
        color: #9a4d28;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(34px, 4vw, 54px);
        line-height: 0.95;
        letter-spacing: -0.04em;
      }
      .intro {
        margin: 0;
        max-width: 60ch;
        font-size: 16px;
        line-height: 1.65;
        color: var(--muted);
      }
      .meta-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .meta-chip {
        padding: 14px 15px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.76);
        border: 1px solid rgba(116, 90, 64, 0.12);
      }
      .meta-chip .label {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        margin-bottom: 6px;
      }
      .meta-chip .value {
        font-size: 15px;
        line-height: 1.4;
      }
      .sheet-preview {
        padding: 14px;
        display: grid;
        gap: 12px;
      }
      .sheet-preview img {
        width: 100%;
        display: block;
        border-radius: 22px;
        border: 1px solid rgba(116, 90, 64, 0.12);
        box-shadow: 0 12px 30px rgba(86, 62, 35, 0.12);
      }
      .section-title {
        margin: 0 0 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }
      .carousel-shell {
        position: relative;
      }
      .carousel-track {
        display: flex;
        gap: 18px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        padding: 10px clamp(18px, 10vw, 120px) 18px;
        margin: 0 -20px;
        scrollbar-width: none;
      }
      .carousel-track::-webkit-scrollbar { display: none; }
      .card {
        flex: 0 0 min(78vw, 560px);
        scroll-snap-align: center;
        border-radius: 30px;
        background: var(--card);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        overflow: hidden;
        transform: translateY(0);
        transition: transform 180ms ease, box-shadow 180ms ease;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 24px 70px rgba(86, 62, 35, 0.18);
      }
      .card-image-shell {
        aspect-ratio: 3 / 4;
        background: linear-gradient(135deg, #fff7ee, #f4eadc);
        border-bottom: 1px solid rgba(116, 90, 64, 0.1);
      }
      .card-image-shell img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .card-copy {
        padding: 18px 18px 20px;
        display: grid;
        gap: 10px;
      }
      .card-kicker {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted);
      }
      .card h2 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(22px, 2.7vw, 30px);
        line-height: 1.08;
        letter-spacing: -0.02em;
      }
      .card-title-empty {
        min-height: 1.1em;
      }
      .card-scene {
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        color: #43382d;
      }
      .card-scene-empty {
        min-height: 1.6em;
      }
      .card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }
      .card-meta span {
        font-size: 12px;
        color: #644f3b;
        background: rgba(217, 120, 74, 0.1);
        border: 1px solid rgba(217, 120, 74, 0.15);
        padding: 6px 10px;
        border-radius: 999px;
      }
      .nav {
        position: absolute;
        inset: 50% 6px auto;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        transform: translateY(-50%);
        z-index: 3;
      }
      .nav button {
        pointer-events: auto;
        border: 1px solid rgba(116, 90, 64, 0.18);
        background: rgba(255, 255, 255, 0.95);
        color: var(--ink);
        width: 48px;
        height: 48px;
        border-radius: 999px;
        box-shadow: 0 10px 28px rgba(86, 62, 35, 0.14);
        display: grid;
        place-items: center;
        font-size: 24px;
        cursor: pointer;
      }
      .nav button:active { transform: scale(0.98); }
      .sheet-section {
        margin-top: 28px;
      }
      .sheet-section img {
        width: 100%;
        border-radius: 26px;
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        display: block;
      }
      .footnote {
        margin-top: 14px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      @media (max-width: 920px) {
        .hero { grid-template-columns: 1fr; }
        .meta-grid { grid-template-columns: 1fr; }
        .card { flex-basis: 82vw; }
        .nav { inset: auto 12px 14px; transform: none; top: auto; }
      }
      @media (max-width: 640px) {
        .page { padding: 16px 14px 28px; }
        .hero-copy { padding: 20px; }
        .nav button { width: 42px; height: 42px; font-size: 20px; }
        .carousel-track { padding-inline: 10px; margin: 0 -14px; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="panel hero-copy">
          <div class="eyebrow">${escapeHtml(behavior.prompt)}</div>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="intro">
            A swipeable card view built from the sliced storyboard pages.
            Each card shows the page image on top, with the story line below it.
          </p>
          <div class="meta-grid">
            <div class="meta-chip">
              <span class="label">Child</span>
              <span class="value">${escapeHtml(story.child_name)}</span>
            </div>
            <div class="meta-chip">
              <span class="label">Parent</span>
              <span class="value">${escapeHtml(story.parent_name)}</span>
            </div>
            <div class="meta-chip">
              <span class="label">Behavior</span>
              <span class="value">${escapeHtml(story.behavior)}</span>
            </div>
            <div class="meta-chip">
              <span class="label">Pages</span>
              <span class="value">${String(story.pages.length)}</span>
            </div>
          </div>
        </div>
        <div class="panel sheet-preview">
          <div class="section-title">Storyboard Sheet</div>
          <img src="sheet.jpg" alt="Storyboard sheet for ${escapeHtml(story.title)}" />
        </div>
      </section>

      <section>
        <div class="section-title">Page Cards</div>
        <div class="carousel-shell">
          <div class="nav">
            <button type="button" id="prevBtn" aria-label="Previous card">‹</button>
            <button type="button" id="nextBtn" aria-label="Next card">›</button>
          </div>
          <div class="carousel-track" id="track">
            ${cards.join("\n")}
          </div>
        </div>
        <div class="footnote">
          Open this file locally and use the arrows or trackpad to move between cards.
        </div>
      </section>
    </main>
    <script>
      (() => {
        const track = document.getElementById("track");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        if (!track || !prevBtn || !nextBtn) return;

        const cards = Array.from(track.querySelectorAll(".card"));

        const currentIndex = () => {
          const scrollLeft = track.scrollLeft + track.clientWidth / 2;
          let best = 0;
          let bestDistance = Infinity;
          cards.forEach((card, index) => {
            const center = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(center - scrollLeft);
            if (distance < bestDistance) {
              bestDistance = distance;
              best = index;
            }
          });
          return best;
        };

        const updateButtons = () => {
          const index = currentIndex();
          prevBtn.disabled = index <= 0;
          nextBtn.disabled = index >= cards.length - 1;
        };

        const scrollToIndex = (index) => {
          const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
          if (!card) return;
          card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        };

        prevBtn.addEventListener("click", () => scrollToIndex(currentIndex() - 1));
        nextBtn.addEventListener("click", () => scrollToIndex(currentIndex() + 1));
        track.addEventListener("scroll", () => window.requestAnimationFrame(updateButtons), { passive: true });
        window.addEventListener("resize", updateButtons);
        updateButtons();
      })();
    </script>
  </body>
</html>`;
}

async function main() {
  const config = getAiConfig();
  if (!config) {
    throw new Error("AI credentials are missing. Set AI_INTEGRATIONS_OPENROUTER_BASE_URL and AI_INTEGRATIONS_OPENROUTER_API_KEY.");
  }

  const behaviors = await loadBehaviorPrompts();
  const selectedBehavior = behaviors[behaviorIndex] ?? behaviors[0];
  if (!selectedBehavior) {
    throw new Error("No behavior prompts found.");
  }

  const parentName = resolveParentName(parentReferenceImage);
  const storyPromptTemplate = await loadTemplate(storyPromptPath);
  const storyPrompt = buildStoryPrompt(storyPromptTemplate, selectedBehavior.prompt, parentName);
  const storyJson = (await callJsonChat(
    config,
    "You write exact JSON only. Follow the user's schema and return valid JSON with no markdown or explanation.",
    storyPrompt,
  )) as StoryInput;

  const sheetPromptTemplate = await loadTemplate(sheetPromptPath);
  const sheetPrompt = buildSheetPrompt(sheetPromptTemplate, storyJson);

  await mkdir(outputDir, { recursive: true });
  const childCopy = path.join(outputDir, path.basename(childReferenceImage));
  const parentCopy = path.join(outputDir, path.basename(parentReferenceImage));
  await copyFile(childReferenceImage, childCopy);
  await copyFile(parentReferenceImage, parentCopy);

  await writeFile(path.join(outputDir, "behavior.json"), `${JSON.stringify(selectedBehavior, null, 2)}\n`);
  await writeFile(path.join(outputDir, "story-prompt.txt"), `${storyPrompt}\n`);
  await writeFile(path.join(outputDir, "story.json"), `${JSON.stringify(storyJson, null, 2)}\n`);
  await writeFile(path.join(outputDir, "sheet-prompt.txt"), `${sheetPrompt}\n`);

  const imageData = await callMultimodalImageModel(
    config,
    sheetPrompt,
    {
      aspectRatio: "1:1",
      imageSize: "4K",
    },
    [childCopy, parentCopy],
  );
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
  const slices = await sliceStoryboardSheet(sheetPath, pagesDir);
  await writeFile(path.join(outputDir, "slices.json"), `${JSON.stringify(slices, null, 2)}\n`);
  await writeFile(
    path.join(outputDir, "book.html"),
    renderCarouselHtml({
      story: storyJson,
      sheetImagePath: sheetPath,
      slices,
      outputDir,
      behavior: selectedBehavior,
    }),
  );

  console.log(`Behavior: ${selectedBehavior.prompt}`);
  console.log(`Child image: ${childCopy}`);
  console.log(`Parent image: ${parentCopy}`);
  console.log(`Story json: ${path.join(outputDir, "story.json")}`);
  console.log(`Sheet image: ${sheetPath}`);
  console.log(`Pages dir: ${pagesDir}`);
  console.log(`Book html: ${path.join(outputDir, "book.html")}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
