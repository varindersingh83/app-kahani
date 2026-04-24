import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoryMode = "behavior" | "random";

type StoryRequest = {
  mode: StoryMode;
  prompt?: string;
  character: {
    name: string;
    photoUri?: string;
    appearance?: string;
  };
  supportingCharacters?: Array<{
    name: string;
    relationship: string;
  }>;
};

type GeneratedStory = {
  title: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    illustrationPrompt: string;
    imageUrl?: string;
  }>;
  reflectionQuestion: string;
  coverImageUrl?: string;
  sheetImageUrl?: string;
};

type StoryPlan = {
  title: string;
  reflectionQuestion: string;
  storySpine?: {
    beginning: string;
    middle: string;
    ending: string;
    emotionalArc: string;
  };
  masterSheetPrompt?: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    illustrationPrompt: string;
    sheetPlacement?: {
      pageNumber: number;
      row: number;
      col: number;
      panelLabel: string;
    };
    beat?: string;
    visualFocus?: string;
    emotion?: string;
  }>;
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

type BookPipelineResult = {
  bookId: string;
  status: string;
  story: GeneratedStory;
  flaggedForHuman: boolean;
  retryTotal: number;
};

type BookStatusResponse = {
  bookId: string;
  status: string;
  currentStep: string;
  title?: string;
  pageCount: number;
  flaggedForHuman: boolean;
  retryTotal: number;
  story?: {
    title: string;
    reflectionQuestion: string;
    pages?: GeneratedStory["pages"];
    coverImageUrl?: string;
    sheetImageUrl?: string;
    storyPlan?: StoryPlan;
    sheetPrompt?: string;
    sliceManifest?: SheetSliceManifestEntry[];
    review?: {
      pages: Array<{
        pageNumber: number;
        alignmentScore: number;
        flagForHuman: boolean;
        reviewNotes: string[];
        failureReason?: string;
      }>;
      flaggedPages: number[];
      shouldEscalate: boolean;
    };
  };
  setupJson?: {
    storyPlan?: StoryPlan;
  };
};

type CarouselTitleSlide = {
  kind: "title";
  label: string;
  title: string;
  imageUrl?: string;
  body: string;
};

type CarouselPageSlide = {
  kind: "page";
  label: string;
  title: string;
  imageUrl?: string;
  body: string;
  footer: string;
};

type CarouselEndSlide = {
  kind: "end";
  label: string;
  title: string;
  imageUrl?: string;
  body: string;
};

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const repoRoot = path.resolve(import.meta.dirname, "../..");
const outputDir =
  process.env.BOOK_HARNESS_OUTPUT_DIR ??
  path.join(repoRoot, "artifacts", "book-runs", new Date().toISOString().replace(/[:.]/g, "-"));

const request: StoryRequest = JSON.parse(
  process.env.BOOK_HARNESS_REQUEST ??
    JSON.stringify({
      mode: "behavior",
      prompt: "My child is learning to ask for a turn instead of grabbing toys.",
      character: {
        name: "Ava",
        photoUri: "/Users/varindernagra/Downloads/girl 3.png",
      },
      supportingCharacters: [
        {
          name: "Leo",
          relationship: "little brother",
        },
      ],
    }),
);

async function main() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "request.json"), `${JSON.stringify(request, null, 2)}\n`);

  const runLog: string[] = [];
  const logLine = (line: string) => {
    runLog.push(line);
    console.log(line);
  };

  logLine(`Run directory: ${outputDir}`);
  console.log(`Submitting book job to ${apiBaseUrl}/api/books ...`);
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Book generation failed with ${response.status}: ${body}`);
  }

  const result = (await response.json()) as BookPipelineResult;
  const statusResponse = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/books/${result.bookId}`);
  if (!statusResponse.ok) {
    const body = await statusResponse.text();
    throw new Error(`Book status lookup failed with ${statusResponse.status}: ${body}`);
  }
  const status = (await statusResponse.json()) as BookStatusResponse;

  const pagesResponse = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/books/${result.bookId}/pages`);
  if (!pagesResponse.ok) {
    const body = await pagesResponse.text();
    throw new Error(`Book page lookup failed with ${pagesResponse.status}: ${body}`);
  }
  const pagesState = (await pagesResponse.json()) as { items: Array<Record<string, unknown>> };

  const storyPlan = status.setupJson?.storyPlan ?? result.story;
  const sliceManifest = getSliceManifest(result, status);
  logLine(`Book ID: ${result.bookId}`);
  logLine(`Status: ${result.status}`);
  logLine(`Pages: ${result.story.pages.length}`);
  logLine(`Cover image: ${result.story.coverImageUrl ?? "none"}`);
  logLine(`Storyboard sheet: ${result.story.sheetImageUrl ?? "none"}`);
  logLine(`Story plan pages: ${storyPlan.pages.length}`);

  const verification = verifyBookRun({
    result,
    status,
    pagesState: pagesState.items,
    storyPlan,
    sliceManifest,
  });

  const eventsResponse = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/books/${result.bookId}/events`);
  const eventsJson = eventsResponse.ok ? await eventsResponse.json() : [];
  runLog.push("");
  runLog.push("Events:");
  runLog.push(JSON.stringify(eventsJson, null, 2));
  runLog.push("");
  runLog.push("Verification:");
  runLog.push(JSON.stringify(verification, null, 2));
  await writeFile(path.join(outputDir, "book.log"), `${runLog.join("\n")}\n`);
  await writeFile(path.join(outputDir, "run-path.txt"), `${outputDir}\n`);
  await writeFile(path.join(outputDir, "book.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(path.join(outputDir, "book-status.json"), `${JSON.stringify(status, null, 2)}\n`);
  await writeFile(path.join(outputDir, "story-plan.json"), `${JSON.stringify(storyPlan, null, 2)}\n`);
  await writeFile(path.join(outputDir, "slice-manifest.json"), `${JSON.stringify(sliceManifest, null, 2)}\n`);
  await writeFile(path.join(outputDir, "verification.json"), `${JSON.stringify(verification, null, 2)}\n`);
  await writeFile(
    path.join(outputDir, "book.md"),
    buildBookMarkdown({
      result,
      status,
      storyPlan,
      sliceManifest,
      verification,
      eventsJson,
      pagesState: pagesState.items,
      outputDir,
    }),
  );
  await writeFile(path.join(outputDir, "book.html"), await renderBookHtml({ result, storyPlan, verification }));

  console.log(`Book saved to ${path.join(outputDir, "book.json")}`);
  console.log(`Run log saved to ${path.join(outputDir, "book.log")}`);
  console.log(`Open the visual book at ${path.join(outputDir, "book.html")}`);
  console.log(`Open the final book at ${apiBaseUrl}/api/books/${result.bookId}`);
  console.log(`Inspect page state at ${apiBaseUrl}/api/books/${result.bookId}/pages`);
  console.log(`Inspect event log at ${apiBaseUrl}/api/books/${result.bookId}/events`);
  console.log(`QA queue at ${apiBaseUrl}/api/books/qa`);
  if (!verification.ok) {
    throw new Error(`Verification failed: ${verification.failures.join("; ")}`);
  }
}

async function renderBookHtml(input: {
  result: BookPipelineResult;
  storyPlan: StoryPlan;
  verification: VerificationResult;
}) {
  const { result, storyPlan, verification } = input;
  const assetsDir = path.join(outputDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const coverImageUrl = await copyImageAsset(result.story.coverImageUrl, path.join(assetsDir, "cover"));
  const sheetImageUrl = await copyImageAsset(result.story.sheetImageUrl, path.join(assetsDir, "sheet"));
  const pageImageUrls = await Promise.all(
    result.story.pages.map((page) => copyImageAsset(page.imageUrl, path.join(assetsDir, `page-${String(page.pageNumber).padStart(2, "0")}`))),
  );

  const slides: Array<CarouselTitleSlide | CarouselPageSlide | CarouselEndSlide> = [
    {
      kind: "title",
      label: "Book Title",
      title: result.story.title,
      imageUrl: coverImageUrl,
      body: [
        `<p><strong>Book ID:</strong> ${escapeHtml(result.bookId)}</p>`,
        `<p><strong>Status:</strong> ${escapeHtml(result.status)}</p>`,
        `<p><strong>Reflection:</strong> ${escapeHtml(result.story.reflectionQuestion)}</p>`,
        `<p><strong>Story spine:</strong> ${escapeHtml(storyPlan.storySpine?.beginning ?? "")}</p>`,
        `<p><strong>Middle:</strong> ${escapeHtml(storyPlan.storySpine?.middle ?? "")}</p>`,
        `<p><strong>Ending:</strong> ${escapeHtml(storyPlan.storySpine?.ending ?? "")}</p>`,
      ].join("\n"),
    },
    ...result.story.pages.map(
      (page, index): CarouselPageSlide => ({
        kind: "page",
        label: `Page ${page.pageNumber}`,
        title: page.pageNumber === 1 ? `${result.story.title} - Page 1` : `Page ${page.pageNumber}`,
        imageUrl: pageImageUrls[index],
        body: escapeHtml(page.text),
        footer: `Page ${page.pageNumber}/12`,
      }),
    ),
    {
      kind: "end",
      label: "The End",
      title: "The End",
      body: `<p>Pages reviewed: ${result.story.pages.length}</p><p>Verification: ${verification.ok ? "passed" : "needs attention"}</p>`,
      imageUrl: sheetImageUrl,
    },
  ];

  const carouselSlides = slides
    .map(
      (slide, index) => `
        <article class="carousel-card ${slide.kind === "title" ? "is-title" : slide.kind === "end" ? "is-end" : "is-page"}" data-slide="${index}">
          <div class="card-top">
            <div class="card-label">${escapeHtml(slide.label)}</div>
          <div class="card-counter">${index + 1}/${slides.length}</div>
          </div>
          <div class="card-media">
            ${
              slide.imageUrl
                ? `<img class="card-image" src="${escapeHtml(slide.imageUrl)}" alt="${escapeHtml(slide.title)}" />`
                : `<div class="card-placeholder">No image available</div>`
            }
          </div>
          <div class="card-copy">
            <h2>${escapeHtml(slide.title)}</h2>
            ${
              slide.kind === "title" || slide.kind === "end"
                ? `<div class="card-body">${slide.body}</div>`
                : `<p class="card-body">${slide.body}</p>`
            }
          </div>
            ${
              slide.kind === "page"
                ? `<div class="card-footer">${escapeHtml(slide.footer ?? "")}</div>`
                : slide.kind === "end"
                  ? `<div class="card-footer">Closing card</div>`
                  : `<div class="card-footer">Title card</div>`
            }
        </article>
      `,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(result.story.title)}</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f1e8; color: #1f1b16; }
      .wrap { max-width: 960px; margin: 0 auto; padding: 24px; }
      .hero { display: grid; gap: 16px; grid-template-columns: 320px 1fr; align-items: start; margin-bottom: 28px; }
      .section-title { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.16em; color: #8b735b; }
      .cover-image { width: 100%; display: block; border-radius: 16px; background: #fff; }
      .cover-placeholder { width: 100%; min-height: 320px; border-radius: 16px; background: #fff; display: grid; place-items: center; color: #7b6a59; border: 1px dashed #cbbda8; }
      .sheet-image { width: 100%; display: block; border-radius: 16px; background: #fff; margin-bottom: 16px; }
      .sheet-placeholder { width: 100%; min-height: 180px; border-radius: 16px; background: #fff; display: grid; place-items: center; color: #7b6a59; border: 1px dashed #cbbda8; margin-bottom: 16px; }
      .run-log { background: rgba(255,255,255,0.82); border: 1px solid #e4d7c7; border-radius: 18px; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; line-height: 1.45; color: #675846; white-space: pre-wrap; overflow-x: auto; }
      .carousel-shell { position: relative; margin-bottom: 24px; overflow: visible; }
      .carousel-rail {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 100%;
        gap: 16px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        padding: 6px 0 18px;
        scrollbar-width: none;
      }
      .carousel-rail::-webkit-scrollbar { display: none; }
      .carousel-card {
        scroll-snap-align: start;
        background: rgba(255,255,255,0.9);
        border: 1px solid #e4d7c7;
        border-radius: 22px;
        box-shadow: 0 12px 30px rgba(71, 51, 27, 0.08);
        padding: 18px;
        display: grid;
        gap: 14px;
        min-height: 680px;
        position: relative;
      }
      .carousel-card.is-end {
        background: linear-gradient(180deg, rgba(255,248,237,0.98), rgba(248,239,227,0.96));
        border-style: dashed;
      }
      .card-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .card-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: #8b735b; }
      .card-counter { font-size: 12px; color: #7b6a59; }
      .card-media { border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, #f5e7d3, #fff9f0); border: 1px solid #eadcc8; }
      .card-image { width: 100%; display: block; object-fit: cover; aspect-ratio: 1 / 1; }
      .card-placeholder { min-height: 520px; display: grid; place-items: center; color: #8b735b; }
      .card-copy h2 { margin: 0 0 10px; font-size: 28px; line-height: 1.1; }
      .card-body { margin: 0; font-size: 18px; line-height: 1.65; white-space: pre-wrap; color: #2b221a; }
      .card-footer {
        position: absolute;
        right: 18px;
        bottom: 18px;
        font-size: 13px;
        color: #8b735b;
        background: rgba(255,255,255,0.92);
        border: 1px solid #eadcc8;
        padding: 6px 10px;
        border-radius: 999px;
      }
      .carousel-nav {
        position: absolute;
        inset: 50% 10px auto;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        transform: translateY(-50%);
        z-index: 5;
      }
      .carousel-button {
        pointer-events: auto;
        border: 1px solid #dbc7ac;
        background: rgba(255,255,255,0.96);
        color: #3d2f22;
        width: 46px;
        height: 46px;
        border-radius: 999px;
        box-shadow: 0 10px 24px rgba(71, 51, 27, 0.12);
        display: grid;
        place-items: center;
        font-size: 22px;
        cursor: pointer;
      }
      .carousel-button:disabled { opacity: 0.45; cursor: default; }
      .meta h1 { margin: 0 0 12px; font-size: 32px; line-height: 1.1; }
      .meta p { margin: 6px 0; font-size: 16px; line-height: 1.5; }
      @media (max-width: 820px) {
        .hero { grid-template-columns: 1fr; }
        .carousel-nav { inset: auto 12px 16px; transform: none; top: auto; z-index: 5; }
        .carousel-card { min-height: 0; padding-bottom: 62px; }
        .card-copy h2 { font-size: 24px; }
        .card-body { font-size: 16px; }
      }
      @media (max-width: 560px) {
        .wrap { padding: 16px; }
        .carousel-button { width: 40px; height: 40px; font-size: 20px; }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section>
        <div class="section-title">Run Log</div>
        <div class="run-log">Run directory: ${escapeHtml(outputDir)}
Book ID: ${escapeHtml(result.bookId)}
Status: ${escapeHtml(result.status)}
Pages: ${String(result.story.pages.length)}
Cover image: ${escapeHtml(result.story.coverImageUrl ?? "none")}
Storyboard sheet: ${escapeHtml(result.story.sheetImageUrl ?? "none")}
Log file: ${escapeHtml(path.join(outputDir, "book.log"))}</div>
      </section>
      <section class="hero">
        <div>
          <div class="section-title">Title Image</div>
          ${
            coverImageUrl
              ? `<img class="cover-image" src="${escapeHtml(coverImageUrl)}" alt="${escapeHtml(result.story.title)} cover" />`
              : `<div class="cover-placeholder">No cover image was generated.</div>`
          }
        </div>
        <div class="meta">
          <h1>${escapeHtml(result.story.title)}</h1>
          <p><strong>Book ID:</strong> ${escapeHtml(result.bookId)}</p>
          <p><strong>Status:</strong> ${escapeHtml(result.status)}</p>
          <p><strong>Flagged for human:</strong> ${String(result.flaggedForHuman)}</p>
          <p><strong>Retry total:</strong> ${String(result.retryTotal)}</p>
          <p><strong>Reflection:</strong> ${escapeHtml(result.story.reflectionQuestion)}</p>
          <p><strong>Sheet image:</strong> ${escapeHtml(result.story.sheetImageUrl ?? "none")}</p>
        </div>
      </section>
      <section>
        <div class="section-title">Book Carousel</div>
        <div class="carousel-shell">
          <div class="carousel-nav" aria-hidden="false">
            <button class="carousel-button" id="carouselPrev" type="button" aria-label="Previous card">‹</button>
            <button class="carousel-button" id="carouselNext" type="button" aria-label="Next card">›</button>
          </div>
          <div class="carousel-rail" id="carouselRail">
            ${carouselSlides}
          </div>
        </div>
      </section>
      <section>
        <div class="section-title">Storyboard Sheet</div>
        ${
          sheetImageUrl
            ? `<img class="sheet-image" src="${escapeHtml(sheetImageUrl)}" alt="${escapeHtml(result.story.title)} sheet" />`
            : `<div class="sheet-placeholder">No sheet image was generated.</div>`
        }
      </section>
    </main>
    <script>
      (() => {
        const rail = document.getElementById("carouselRail");
        const prev = document.getElementById("carouselPrev");
        const next = document.getElementById("carouselNext");
        if (!rail || !prev || !next) return;

        const cards = Array.from(rail.querySelectorAll(".carousel-card"));
        const getCurrentIndex = () => {
          const scrollLeft = rail.scrollLeft;
          let closestIndex = 0;
          let closestDistance = Infinity;
          cards.forEach((card, index) => {
            const distance = Math.abs(card.offsetLeft - scrollLeft);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });
          return closestIndex;
        };

        const updateButtons = () => {
          const index = getCurrentIndex();
          prev.disabled = index <= 0;
          next.disabled = index >= cards.length - 1;
        };

        const scrollToIndex = (index) => {
          const card = cards[index];
          if (!card) return;
          rail.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        };

        prev.addEventListener("click", () => scrollToIndex(Math.max(0, getCurrentIndex() - 1)));
        next.addEventListener("click", () => scrollToIndex(Math.min(cards.length - 1, getCurrentIndex() + 1)));
        rail.addEventListener("scroll", () => window.requestAnimationFrame(updateButtons), { passive: true });
        window.addEventListener("resize", updateButtons);
        updateButtons();
      })();
    </script>
  </body>
</html>
`;
}

type VerificationResult = {
  ok: boolean;
  failures: string[];
  pageCount: number;
  sliceCount: number;
  reviewedPages: number[];
};

function verifyBookRun(input: {
  result: BookPipelineResult;
  status: BookStatusResponse;
  pagesState: Array<Record<string, unknown>>;
  storyPlan: StoryPlan;
  sliceManifest: SheetSliceManifestEntry[];
}): VerificationResult {
  const failures: string[] = [];
  const finalPages = input.result.story.pages;
  const pageNumbers = finalPages.map((page) => page.pageNumber);
  const reviewedPages = input.storyPlan.pages.map((page) => page.pageNumber);

  if (finalPages.length !== 12) {
    failures.push(`expected 12 pages, received ${finalPages.length}`);
  }
  if (input.sliceManifest.length !== 12) {
    failures.push(`expected 12 sliced images, received ${input.sliceManifest.length}`);
  }
  if (pageNumbers.join(",") !== "1,2,3,4,5,6,7,8,9,10,11,12") {
    failures.push(`pages are out of order: ${pageNumbers.join(", ")}`);
  }
  if (input.pagesState.length !== 12) {
    failures.push(`page state count mismatch: ${input.pagesState.length}`);
  }

  for (const page of finalPages) {
    if (!page.text.trim()) {
      failures.push(`page ${page.pageNumber} is missing text`);
    }
    if (!page.imageUrl) {
      failures.push(`page ${page.pageNumber} is missing an image`);
    }
  }

  const sliceNumbers = input.sliceManifest.map((entry) => entry.pageNumber).sort((a, b) => a - b);
  if (sliceNumbers.join(",") !== pageNumbers.join(",")) {
    failures.push("slice manifest page order does not match the packaged pages");
  }

  if (!input.storyPlan.masterSheetPrompt?.trim()) {
    failures.push("missing master storyboard prompt");
  }

  if (input.status.story?.review?.shouldEscalate && !input.status.flaggedForHuman) {
    failures.push("review requested escalation but the status was not flagged");
  }

  return {
    ok: failures.length === 0,
    failures,
    pageCount: finalPages.length,
    sliceCount: input.sliceManifest.length,
    reviewedPages,
  };
}

function getSliceManifest(result: BookPipelineResult, status: BookStatusResponse) {
  const statusSliceManifest = status.story?.sliceManifest;
  if (statusSliceManifest && statusSliceManifest.length > 0) {
    return statusSliceManifest;
  }
  const packageSliceManifest = (result.story as unknown as { sliceManifest?: SheetSliceManifestEntry[] }).sliceManifest;
  return packageSliceManifest ?? [];
}

function buildBookMarkdown(input: {
  result: BookPipelineResult;
  status: BookStatusResponse;
  storyPlan: StoryPlan;
  sliceManifest: SheetSliceManifestEntry[];
  verification: VerificationResult;
  eventsJson: unknown;
  pagesState: Array<Record<string, unknown>>;
  outputDir: string;
}) {
  const { result, status, storyPlan, sliceManifest, verification, eventsJson, pagesState, outputDir } = input;
  const pageSections = result.story.pages
    .map(
      (page) => `### Page ${page.pageNumber}

${page.text}

Illustration prompt: ${page.illustrationPrompt}
Image: ${page.imageUrl ?? "none"}`,
    )
    .join("\n\n");

  return `# ${result.story.title}

Book ID: ${result.bookId}
Status: ${result.status}
Flagged for human: ${result.flaggedForHuman}
Retry total: ${result.retryTotal}

## Story Plan

- Story beginning: ${storyPlan.storySpine?.beginning ?? "n/a"}
- Story middle: ${storyPlan.storySpine?.middle ?? "n/a"}
- Story ending: ${storyPlan.storySpine?.ending ?? "n/a"}
- Master prompt saved: ${Boolean(storyPlan.masterSheetPrompt)}

## Final Book

- Title: ${result.story.title}
- Pages: ${result.story.pages.length}
- Reflection: ${result.story.reflectionQuestion}
- Cover: ${result.story.coverImageUrl ?? "none"}
- Storyboard sheet: ${result.story.sheetImageUrl ?? "none"}
- Slice manifest entries: ${sliceManifest.length}
- Verification: ${verification.ok ? "passed" : "failed"}
- Run log: ${path.join(outputDir, "book.log")}

## Review

${verification.failures.length === 0 ? "All verification checks passed." : verification.failures.map((failure) => `- ${failure}`).join("\n")}

## Pages

${pageSections}

## Page State

${JSON.stringify(pagesState, null, 2)}

## Status

${JSON.stringify(status, null, 2)}

## Events

${JSON.stringify(eventsJson, null, 2)}
`;
}

async function copyImageAsset(source?: string, destinationBasePath?: string) {
  if (!source) return undefined;
  if (!destinationBasePath) return undefined;
  const bytes = await readImageBytes(source);
  const extension = detectImageExtension(source);
  const destinationPath = `${destinationBasePath}.${extension}`;
  await writeFile(destinationPath, bytes);
  return path.relative(outputDir, destinationPath).split(path.sep).join("/");
}

async function readImageBytes(source: string) {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL for image asset.");
    const metadata = source.slice(5, comma);
    const payload = source.slice(comma + 1);
    if (metadata.includes(";base64")) {
      return Buffer.from(payload, "base64");
    }
    return Buffer.from(decodeURIComponent(payload));
  }

  if (source.startsWith("file://")) {
    return readFile(fileURLToPath(source));
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image asset: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return readFile(source);
}

function detectImageExtension(source: string) {
  if (source.startsWith("data:image/jpeg")) return "jpg";
  if (source.startsWith("data:image/jpg")) return "jpg";
  if (source.startsWith("data:image/webp")) return "webp";
  if (source.startsWith("data:image/png")) return "png";
  if (source.toLowerCase().endsWith(".jpg") || source.toLowerCase().endsWith(".jpeg")) return "jpg";
  if (source.toLowerCase().endsWith(".webp")) return "webp";
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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
