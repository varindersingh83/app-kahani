import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBookSearchQueries,
  createGoogleBooksProvider,
  createOpenLibraryProvider,
  mapGoogleBooksItem,
  mapOpenLibraryDoc,
  verifyReferenceBooks,
  type BookSearchProvider,
} from "./bookVerifier";
import type { BehaviorTemplate, ReferenceBook } from "./types";

const behavior: BehaviorTemplate = {
  categoryId: "template_2_screaming_in_public",
  sourceRow: 2,
  scene: "grocery checkout",
  visibleBehavior: "Screaming in public",
  mechanism: "Frustration from limited language.",
  strategy: "Use positive directions.",
  childStorySkill: "practice a replacement phrase",
  parentGuidance: "Use positive directions. Avoid yelling.",
  targetOutcome: "Child uses a quieter phrase.",
  storyFocusLabel: "Screaming in public",
};

function book(title: string, author = "Real Author"): ReferenceBook {
  return {
    title,
    author,
    source: "open_library",
    sourceId: `/works/${title.replace(/\s+/g, "")}`,
    firstPublishYear: 2019,
  };
}

test("builds search queries from behavior issue and broader themes", () => {
  const queries = buildBookSearchQueries(behavior);

  assert.match(queries[0], /Screaming in public/);
  assert.ok(queries.some((query) => /limited language/.test(query)));
  assert.ok(queries.some((query) => /positive directions/.test(query)));
});

test("maps Open Library metadata into a verified reference book", () => {
  assert.deepEqual(
    mapOpenLibraryDoc({
      key: "/works/OL123W",
      title: "When Sophie Gets Angry",
      author_name: ["Molly Bang"],
      first_publish_year: 1999,
      isbn: ["9780439598453"],
      publisher: ["Scholastic"],
    }),
    {
      title: "When Sophie Gets Angry",
      author: "Molly Bang",
      source: "open_library",
      sourceId: "/works/OL123W",
      firstPublishYear: 1999,
      publisher: "Scholastic",
      isbn: "9780439598453",
    },
  );
});

test("maps Google Books metadata into a verified reference book", () => {
  assert.deepEqual(
    mapGoogleBooksItem({
      id: "abc123",
      volumeInfo: {
        title: "Llama Llama Mad at Mama",
        authors: ["Anna Dewdney"],
        publishedDate: "2007-09-06",
        publisher: "Viking",
        industryIdentifiers: [{ type: "ISBN_13", identifier: "9780670062409" }],
      },
    }),
    {
      title: "Llama Llama Mad at Mama",
      author: "Anna Dewdney",
      source: "google_books",
      sourceId: "abc123",
      firstPublishYear: 2007,
      publisher: "Viking",
      isbn: "9780670062409",
    },
  );
});

test("rejects metadata candidates missing title or author", () => {
  assert.equal(mapOpenLibraryDoc({ key: "/works/OL1W", title: "No Author" }), null);
  assert.equal(
    mapGoogleBooksItem({ id: "abc", volumeInfo: { authors: ["No Title"] } }),
    null,
  );
});

test("dedupes within an issue while allowing provider results to repeat", async () => {
  const provider: BookSearchProvider = {
    source: "open_library",
    async search() {
      return [
        book("The Rabbit Listened", "Cori Doerrfeld"),
        book("The Rabbit Listened", "Cori Doerrfeld"),
        book("Grumpy Monkey", "Suzanne Lang"),
      ];
    },
  };

  const result = await verifyReferenceBooks({
    behavior,
    providers: [provider],
    targetCount: 2,
  });

  assert.deepEqual(
    result.books.map((entry) => entry.title),
    ["The Rabbit Listened", "Grumpy Monkey"],
  );
});

test("returns verified partial list with warning instead of inventing books", async () => {
  const provider: BookSearchProvider = {
    source: "open_library",
    async search() {
      return [book("One Real Book")];
    },
  };

  const result = await verifyReferenceBooks({
    behavior,
    providers: [provider],
    targetCount: 5,
  });

  assert.equal(result.books.length, 1);
  assert.match(result.warnings.join("\n"), /Only verified 1 of 5/);
});

test("captures provider failure and keeps searching other providers", async () => {
  const failing: BookSearchProvider = {
    source: "open_library",
    async search() {
      throw new Error("network down");
    },
  };
  const fallback: BookSearchProvider = {
    source: "google_books",
    async search() {
      return [book("Fallback Book")];
    },
  };

  const result = await verifyReferenceBooks({
    behavior,
    providers: [failing, fallback],
    targetCount: 1,
  });

  assert.equal(result.books[0]?.title, "Fallback Book");
  assert.match(result.warnings.join("\n"), /network down/);
});

test("Open Library provider searches official API shape", async () => {
  const seenUrls: string[] = [];
  const provider = createOpenLibraryProvider(async (url) => {
    seenUrls.push(String(url));
    return new Response(
      JSON.stringify({
        docs: [
          {
            key: "/works/OL1W",
            title: "Real Book",
            author_name: ["Real Author"],
          },
        ],
      }),
      { status: 200 },
    );
  });

  const results = await provider.search("anger picture book", 3);

  assert.equal(results[0]?.title, "Real Book");
  assert.match(seenUrls[0] ?? "", /openlibrary\.org\/search\.json/);
  assert.match(seenUrls[0] ?? "", /limit=3/);
});

test("Google Books provider searches official API shape", async () => {
  const seenUrls: string[] = [];
  const provider = createGoogleBooksProvider(async (url) => {
    seenUrls.push(String(url));
    return new Response(
      JSON.stringify({
        items: [
          {
            id: "gb1",
            volumeInfo: {
              title: "Real Google Book",
              authors: ["Real Author"],
            },
          },
        ],
      }),
      { status: 200 },
    );
  });

  const results = await provider.search("tantrum picture book", 99);

  assert.equal(results[0]?.title, "Real Google Book");
  assert.match(seenUrls[0] ?? "", /googleapis\.com\/books\/v1\/volumes/);
  assert.match(seenUrls[0] ?? "", /maxResults=40/);
});
