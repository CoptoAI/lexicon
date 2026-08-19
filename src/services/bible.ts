import { BibleBookInfo, BibleChapterResponse, ParallelBibleVerse } from '../types/dictionary';

// In-memory cache for ultra-fast instant chapter browsing
const chapterCache = new Map<string, BibleChapterResponse>();
let booksCache: BibleBookInfo[] | null = null;

/**
 * Fetches the list of 27 New Testament books
 */
export async function fetchBibleBooks(): Promise<BibleBookInfo[]> {
  if (booksCache && booksCache.length > 0) {
    return booksCache;
  }

  // 1. Try D1 API endpoint
  try {
    const res = await fetch('/api/bible/books');
    if (res.ok) {
      const data = (await res.json()) as { books: BibleBookInfo[] };
      if (data && Array.isArray(data.books) && data.books.length > 0) {
        booksCache = data.books;
        return data.books;
      }
    }
  } catch {
    // Fallback to static JSON
  }

  // 2. Fallback to static /data/bible/books.json
  try {
    const staticRes = await fetch('/data/bible/books.json');
    if (staticRes.ok) {
      const data = (await staticRes.json()) as BibleBookInfo[];
      if (Array.isArray(data) && data.length > 0) {
        booksCache = data;
        return data;
      }
    }
  } catch (err) {
    console.error('Failed to load bible books:', err);
  }

  return [];
}

/**
 * Fetches parallel verses for a given book and chapter
 */
export async function fetchBibleChapter(bookCode: string, chapterNum: number): Promise<BibleChapterResponse | null> {
  const cacheKey = `${bookCode.toUpperCase()}_${chapterNum}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  // 1. Try D1 API endpoint
  try {
    const res = await fetch(`/api/bible/chapter?book=${encodeURIComponent(bookCode)}&chapter=${chapterNum}`);
    if (res.ok) {
      const data = (await res.json()) as BibleChapterResponse;
      if (data && Array.isArray(data.verses) && data.verses.length > 0) {
        chapterCache.set(cacheKey, data);
        return data;
      }
    }
  } catch {
    // Fallback to static JSON
  }

  // 2. Fallback to static /data/bible/chapters/{BOOK}_{CHAPTER}.json
  try {
    const staticRes = await fetch(`/data/bible/chapters/${cacheKey}.json`);
    if (staticRes.ok) {
      const verses = (await staticRes.json()) as ParallelBibleVerse[];
      const books = await fetchBibleBooks();
      const bookMeta = books.find(b => b.code.toUpperCase() === bookCode.toUpperCase()) || {
        code: bookCode,
        canon_order: 1,
        name_en: bookCode,
        name_ar: bookCode,
        name_cop: bookCode,
        chapters: 1
      };

      const chapterData: BibleChapterResponse = {
        book: bookMeta,
        chapter: chapterNum,
        total_chapters: bookMeta.chapters,
        verses
      };
      chapterCache.set(cacheKey, chapterData);
      return chapterData;
    }
  } catch (err) {
    console.error(`Failed to load chapter ${cacheKey}:`, err);
  }

  return null;
}

/**
 * Searches Bible verses via full-text search
 */
export async function searchBibleVerses(query: string, limit: number = 30): Promise<ParallelBibleVerse[]> {
  if (!query || !query.trim()) return [];
  try {
    const res = await fetch(`/api/bible/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    if (res.ok) {
      const data = (await res.json()) as { results: ParallelBibleVerse[] };
      return data.results || [];
    }
  } catch (err) {
    console.error('Bible search failed:', err);
  }
  return [];
}
