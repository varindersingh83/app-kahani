import type { BehaviorTemplate, ReferenceBook } from "./types";

export type BookSearchProvider = {
  source: ReferenceBook["source"];
  search: (query: string, limit: number) => Promise<ReferenceBook[]>;
};

export type VerifiedReferenceBooks = {
  books: ReferenceBook[];
  warnings: string[];
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
};

type GoogleBooksItem = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    publisher?: string;
    industryIdentifiers?: Array<{
      type?: string;
      identifier?: string;
    }>;
  };
};

export function buildBookSearchQueries(behavior: BehaviorTemplate) {
  const issue = behavior.visibleBehavior || behavior.storyFocusLabel;
  const mechanism = behavior.mechanism.replace(/[.;]/g, "");
  const strategy = behavior.strategy.replace(/[.;]/g, "");
  return uniqueStrings([
    `${issue} children's picture book`,
    `${issue} kids book`,
    `${mechanism} picture book for children`,
    `${strategy} children's book`,
    `${behavior.storyFocusLabel} preschool book`,
  ]).slice(0, 5);
}

export async function verifyReferenceBooks(input: {
  behavior: BehaviorTemplate;
  providers: BookSearchProvider[];
  targetCount?: number;
  perQueryLimit?: number;
}): Promise<VerifiedReferenceBooks> {
  const targetCount = input.targetCount ?? 5;
  const perQueryLimit = input.perQueryLimit ?? 8;
  const warnings: string[] = [];
  const verified: ReferenceBook[] = [];
  const seen = new Set<string>();
  const queries = buildBookSearchQueries(input.behavior);

  if (input.providers.length === 0) {
    return {
      books: [],
      warnings: ["No book search providers configured."],
    };
  }

  for (const query of queries) {
    for (const provider of input.providers) {
      try {
        const candidates = await provider.search(query, perQueryLimit);
        for (const candidate of candidates) {
          const normalized = normalizeReferenceBook(candidate);
          if (!normalized) continue;
          const key = dedupeKey(normalized);
          if (seen.has(key)) continue;
          seen.add(key);
          verified.push(normalized);
          if (verified.length >= targetCount) {
            return { books: verified, warnings };
          }
        }
      } catch (error) {
        warnings.push(
          `${provider.source} search failed for "${query}": ${String(error)}`,
        );
      }
    }
  }

  if (verified.length < targetCount) {
    warnings.push(
      `Only verified ${verified.length} of ${targetCount} reference books for ${input.behavior.visibleBehavior}.`,
    );
  }

  return { books: verified, warnings };
}

export function createOpenLibraryProvider(fetchImpl: typeof fetch = fetch): BookSearchProvider {
  return {
    source: "open_library",
    async search(query, limit) {
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set(
        "fields",
        "key,title,author_name,first_publish_year,isbn,publisher",
      );
      const response = await fetchImpl(url, {
        headers: {
          "User-Agent": "app-kahani-behavior-story-library/1.0",
        },
      });
      if (!response.ok) {
        throw new Error(`Open Library returned ${response.status}`);
      }
      const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
      return (data.docs ?? []).map(mapOpenLibraryDoc).filter(isReferenceBook);
    },
  };
}

export function createGoogleBooksProvider(fetchImpl: typeof fetch = fetch): BookSearchProvider {
  return {
    source: "google_books",
    async search(query, limit) {
      const url = new URL("https://www.googleapis.com/books/v1/volumes");
      url.searchParams.set("q", query);
      url.searchParams.set("printType", "books");
      url.searchParams.set("maxResults", String(Math.min(Math.max(limit, 1), 40)));
      const response = await fetchImpl(url);
      if (!response.ok) {
        throw new Error(`Google Books returned ${response.status}`);
      }
      const data = (await response.json()) as { items?: GoogleBooksItem[] };
      return (data.items ?? []).map(mapGoogleBooksItem).filter(isReferenceBook);
    },
  };
}

export function mapOpenLibraryDoc(doc: OpenLibraryDoc): ReferenceBook | null {
  const title = clean(doc.title);
  const author = clean(doc.author_name?.[0]);
  const sourceId = clean(doc.key);
  if (!title || !author || !sourceId) return null;
  return {
    title,
    author,
    source: "open_library",
    sourceId,
    firstPublishYear: doc.first_publish_year,
    publisher: clean(doc.publisher?.[0]),
    isbn: clean(doc.isbn?.[0]),
  };
}

export function mapGoogleBooksItem(item: GoogleBooksItem): ReferenceBook | null {
  const title = clean(item.volumeInfo?.title);
  const author = clean(item.volumeInfo?.authors?.[0]);
  const sourceId = clean(item.id);
  if (!title || !author || !sourceId) return null;
  return {
    title,
    author,
    source: "google_books",
    sourceId,
    firstPublishYear: parsePublishedYear(item.volumeInfo?.publishedDate),
    publisher: clean(item.volumeInfo?.publisher),
    isbn: clean(
      item.volumeInfo?.industryIdentifiers?.find((entry) =>
        /ISBN/i.test(entry.type ?? ""),
      )?.identifier,
    ),
  };
}

function normalizeReferenceBook(book: ReferenceBook) {
  const title = clean(book.title);
  const author = clean(book.author);
  const sourceId = clean(book.sourceId);
  if (!title || !author || !sourceId) return null;
  return {
    ...book,
    title,
    author,
    sourceId,
    publisher: clean(book.publisher),
    isbn: clean(book.isbn),
  };
}

function isReferenceBook(book: ReferenceBook | null): book is ReferenceBook {
  return book !== null;
}

function clean(value?: string) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
}

function parsePublishedYear(value?: string) {
  const match = value?.match(/\b(\d{4})\b/);
  return match ? Number(match[1]) : undefined;
}

function dedupeKey(book: ReferenceBook) {
  return `${book.title}::${book.author}`.toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
