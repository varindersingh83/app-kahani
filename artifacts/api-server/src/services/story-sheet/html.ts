import type { SheetSliceManifestEntry, StorySheetInput } from "./types";
import { buildReaderCards } from "./mapper";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderBookHtml(input: {
  story: StorySheetInput;
  slices: SheetSliceManifestEntry[];
  behavior: string;
  sheetImageFileName: string;
}) {
  const cards = buildReaderCards(input).map(
    (card, index) => `
    <article class="card" data-card="${index + 1}">
      <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}" />
      <div class="copy">
        <span>${escapeHtml(card.label)}</span>
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.body)}</p>
        ${card.kind === "story" && "scene" in card ? `<p class="scene">${escapeHtml(card.scene)}</p>` : ""}
      </div>
    </article>
  `,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.story.title)}</title>
    <style>
      :root { color-scheme: light; --bg: #f6efe5; --ink: #24180f; --muted: #7f6a57; --card: rgba(255,255,255,.88); --line: rgba(116,90,64,.18); }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
      main { max-width: 1180px; margin: 0 auto; padding: 28px 18px 42px; }
      h1 { margin: 0 0 8px; font-family: Georgia, serif; font-size: clamp(34px, 6vw, 64px); line-height: .95; }
      .intro { color: var(--muted); margin: 0 0 22px; line-height: 1.55; }
      .track { display: flex; gap: 18px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 20px; }
      .card { flex: 0 0 min(82vw, 540px); scroll-snap-align: center; background: var(--card); border: 1px solid var(--line); border-radius: 28px; overflow: hidden; box-shadow: 0 18px 60px rgba(86,62,35,.14); }
      .card img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: #fff7ee; }
      .copy { padding: 18px; display: grid; gap: 8px; }
      .copy span { color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
      .copy h2 { margin: 0; font-family: Georgia, serif; font-size: 28px; }
      .copy p { margin: 0; line-height: 1.55; }
      .scene { color: var(--muted); font-size: 14px; }
      .sheet { width: 100%; border-radius: 24px; border: 1px solid var(--line); margin-top: 28px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(input.story.title)}</h1>
      <p class="intro">${escapeHtml(input.behavior)} · ${escapeHtml(input.story.child_name)} · ${input.story.pages.length} story pages</p>
      <section class="track">${cards.join("\n")}</section>
      <img class="sheet" src="${escapeHtml(input.sheetImageFileName)}" alt="Storyboard sheet" />
    </main>
  </body>
</html>`;
}
