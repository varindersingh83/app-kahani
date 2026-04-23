import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

type BookPipelineResult = {
  bookId: string;
  status: string;
  story: GeneratedStory;
  flaggedForHuman: boolean;
  retryTotal: number;
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
        photoUri: "file:///parent/uploads/ava.jpg",
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
  await writeFile(path.join(outputDir, "book.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(
    path.join(outputDir, "book.md"),
    `# ${result.story.title}

Book ID: ${result.bookId}
Status: ${result.status}
Flagged for human: ${result.flaggedForHuman}
Retry total: ${result.retryTotal}

## Final Book

- Title: ${result.story.title}
- Pages: ${result.story.pages.length}
- Reflection: ${result.story.reflectionQuestion}
- Cover: ${result.story.coverImageUrl ?? "none"}

## Pages

${result.story.pages
  .map(
    (page) => `### Page ${page.pageNumber}

${page.text}

Illustration prompt: ${page.illustrationPrompt}`,
  )
  .join("\n\n")}
`,
  );
  await writeFile(path.join(outputDir, "book.html"), renderBookHtml(result));

  console.log(`Book saved to ${path.join(outputDir, "book.json")}`);
  console.log(`Open the visual book at ${path.join(outputDir, "book.html")}`);
  console.log(`Open the final book at ${apiBaseUrl}/api/books/${result.bookId}`);
  console.log(`Inspect page state at ${apiBaseUrl}/api/books/${result.bookId}/pages`);
  console.log(`Inspect event log at ${apiBaseUrl}/api/books/${result.bookId}/events`);
  console.log(`QA queue at ${apiBaseUrl}/api/books/qa`);
}

function renderBookHtml(result: BookPipelineResult) {
  const coverImage = result.story.coverImageUrl
    ? `<img class="cover-image" src="${escapeHtml(result.story.coverImageUrl)}" alt="${escapeHtml(result.story.title)} cover" />`
    : `<div class="cover-placeholder">No cover image was generated.</div>`;
  const sheetImage = result.story.sheetImageUrl
    ? `<img class="sheet-image" src="${escapeHtml(result.story.sheetImageUrl)}" alt="${escapeHtml(result.story.title)} sheet" />`
    : `<div class="sheet-placeholder">No sheet image was generated.</div>`;

  const pages = result.story.pages
    .map(
      (page) => `
        <section class="page-card">
          <div class="page-number">Page ${page.pageNumber}</div>
          <p class="page-text">${escapeHtml(page.text)}</p>
          ${
            page.imageUrl
              ? `<img class="page-art" src="${escapeHtml(page.imageUrl)}" alt="Page ${page.pageNumber} illustration" />`
              : `<div class="page-art">Illustration area</div>`
          }
          <div class="page-prompt">${escapeHtml(page.illustrationPrompt)}</div>
        </section>
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
      .cover-image { width: 100%; display: block; border-radius: 16px; background: #fff; }
      .cover-placeholder { width: 100%; min-height: 320px; border-radius: 16px; background: #fff; display: grid; place-items: center; color: #7b6a59; border: 1px dashed #cbbda8; }
      .sheet-image { width: 100%; display: block; border-radius: 16px; background: #fff; margin-bottom: 16px; }
      .sheet-placeholder { width: 100%; min-height: 180px; border-radius: 16px; background: #fff; display: grid; place-items: center; color: #7b6a59; border: 1px dashed #cbbda8; margin-bottom: 16px; }
      .page-art { width: 100%; min-height: 180px; object-fit: cover; border-radius: 14px; background: linear-gradient(135deg, #f5e7d3, #fff9f0); border: 1px solid #eadcc8; display: grid; place-items: center; color: #8b735b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; }
      .meta h1 { margin: 0 0 12px; font-size: 32px; line-height: 1.1; }
      .meta p { margin: 6px 0; font-size: 16px; line-height: 1.5; }
      .pages { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .page-card { background: rgba(255,255,255,0.85); border: 1px solid #e4d7c7; border-radius: 18px; padding: 16px; box-shadow: 0 8px 24px rgba(71, 51, 27, 0.06); }
      .page-number { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #8b735b; margin-bottom: 10px; }
      .page-text { margin: 12px 0; font-size: 18px; line-height: 1.6; }
      .page-prompt { margin-top: 10px; font-size: 13px; line-height: 1.45; color: #6f6254; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <div>${coverImage}</div>
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
      ${sheetImage}
      <section class="pages">
        ${pages}
      </section>
    </main>
  </body>
</html>
`;
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
