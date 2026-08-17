import { DictionaryEntry, SearchFilters } from '../types/dictionary';
import { stripDiacritics } from '../utils/coptic';
import { normalizeArabic, isArabicText } from '../utils/arabic';

const DB_NAME = 'coptolex_offline_db';
const DB_VERSION = 1;
const STORE_ENTRIES = 'entries';
const STORE_META = 'metadata';

let dbInstance: IDBDatabase | null = null;
let inMemoryEntries: DictionaryEntry[] | null = null;

/**
 * Opens or initializes the IndexedDB database
 */
export function openIndexedDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this browser'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const store = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        store.createIndex('coptic_clean', 'coptic_clean', { unique: false });
        store.createIndex('coptic_name', 'coptic_name', { unique: false });
        store.createIndex('pos', 'pos', { unique: false });
        store.createIndex('origin', 'origin', { unique: false });
        store.createIndex('freq_rank', 'freq_rank', { unique: false });
        store.createIndex('ascii', 'ascii', { unique: false });
        store.createIndex('xml_id', 'xml_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Checks if the offline database is already populated
 */
export async function isOfflineReady(): Promise<boolean> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_META, STORE_ENTRIES], 'readonly');
      const metaStore = tx.objectStore(STORE_META);
      const getReq = metaStore.get('status');

      getReq.onsuccess = () => {
        if (getReq.result && getReq.result.synced) {
          resolve(true);
        } else {
          // Check count in entries store
          const countReq = tx.objectStore(STORE_ENTRIES).count();
          countReq.onsuccess = () => resolve(countReq.result > 5000);
          countReq.onerror = () => resolve(false);
        }
      };
      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Downloads and saves dictionary dataset into IndexedDB in background
 */
export async function syncOfflineDatabase(
  onProgress?: (percent: number, count: number, total: number) => void
): Promise<{ success: boolean; count: number }> {
  try {
    console.log('[OfflineDB] Starting dataset sync from /data/dictionary_offline.json...');
    const response = await fetch('/data/dictionary_offline.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any[] = await response.json();
    const total = data.length;
    const db = await openIndexedDb();

    // Cache in memory for instant local queries
    inMemoryEntries = data as DictionaryEntry[];

    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < total; i += batchSize) {
      const chunk = data.slice(i, i + batchSize);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_ENTRIES], 'readwrite');
        const store = tx.objectStore(STORE_ENTRIES);

        for (const item of chunk) {
          store.put(item);
        }

        tx.oncomplete = () => {
          const progress = Math.min(100, Math.round(((i + chunk.length) / total) * 100));
          if (onProgress) onProgress(progress, i + chunk.length, total);
          resolve();
        };

        tx.onerror = () => reject(tx.error);
      });
    }

    // Save metadata
    const txMeta = db.transaction([STORE_META], 'readwrite');
    txMeta.objectStore(STORE_META).put({
      key: 'status',
      synced: true,
      count: total,
      timestamp: Date.now()
    });

    console.log(`[OfflineDB] Sync complete! Cached ${total} entries.`);
    return { success: true, count: total };
  } catch (err: any) {
    console.warn('[OfflineDB] Sync error:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Loads all entries into memory if not already loaded
 */
async function ensureEntriesInMemory(): Promise<DictionaryEntry[]> {
  if (inMemoryEntries && inMemoryEntries.length > 0) {
    return inMemoryEntries;
  }

  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ENTRIES], 'readonly');
    const store = tx.objectStore(STORE_ENTRIES);
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      inMemoryEntries = getAllReq.result as DictionaryEntry[];
      resolve(inMemoryEntries);
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

/**
 * Searches the offline IndexedDB / memory store
 */
export async function searchOffline(
  filters: SearchFilters,
  limit = 50
): Promise<{ results: DictionaryEntry[]; count: number }> {
  try {
    const all = await ensureEntriesInMemory();
    if (!all || all.length === 0) {
      return { results: [], count: 0 };
    }

    const q = (filters.query || '').trim();
    const cleanQ = stripDiacritics(q).toLowerCase();
    const isArabic = isArabicText(q);
    const cleanArQ = isArabic ? normalizeArabic(q) : '';

    const dialectFilter = filters.dialect && filters.dialect !== 'any' ? filters.dialect : null;
    const posFilter = filters.pos && filters.pos !== 'any' ? filters.pos : null;
    const originFilter = filters.origin && filters.origin !== 'all' ? filters.origin : null;
    const langFilter = filters.lang && filters.lang !== 'any' ? filters.lang : null;

    let matched = all.filter((entry) => {
      // 1. Dialect Filter
      if (dialectFilter) {
        if (!entry.dialects || !entry.dialects.includes(dialectFilter)) {
          return false;
        }
      }

      // 2. Part of Speech Filter
      if (posFilter) {
        if (entry.pos !== posFilter) return false;
      }

      // 3. Origin Filter
      if (originFilter) {
        if (entry.origin !== originFilter) return false;
      }

      // 4. Query Match
      if (!cleanQ && !cleanArQ) {
        return true;
      }

      // Coptic headword / clean match
      if (entry.coptic_clean && (entry.coptic_clean.includes(cleanQ) || entry.coptic_clean.startsWith(cleanQ))) {
        return true;
      }
      if (entry.coptic_name && entry.coptic_name.toLowerCase().includes(q.toLowerCase())) {
        return true;
      }

      // Arabic text search
      if (isArabic || langFilter === 'ar') {
        const arText = (entry as any).search_ar || '';
        const normAr = normalizeArabic(arText);
        if (normAr.includes(cleanArQ || cleanQ)) return true;
      }

      // Language definition search
      if (langFilter === 'en' || langFilter === 'any') {
        const enText = (entry as any).search_en || '';
        if (enText.toLowerCase().includes(cleanQ)) return true;
      }
      if (langFilter === 'de' || langFilter === 'any') {
        const deText = (entry as any).search_de || '';
        if (deText.toLowerCase().includes(cleanQ)) return true;
      }
      if (langFilter === 'fr' || langFilter === 'any') {
        const frText = (entry as any).search_fr || '';
        if (frText.toLowerCase().includes(cleanQ)) return true;
      }

      // Etymology text search
      if ((entry as any).search_etym && (entry as any).search_etym.toLowerCase().includes(cleanQ)) {
        return true;
      }

      return false;
    });

    // Sort Results
    if (filters.sortBy === 'freq') {
      matched.sort((a, b) => (a.freq_rank || 99999) - (b.freq_rank || 99999));
    } else {
      matched.sort((a, b) => (a.ascii || a.coptic_name).localeCompare(b.ascii || b.coptic_name));
    }

    const totalCount = matched.length;
    const paginated = matched.slice(0, limit);

    return {
      results: paginated,
      count: totalCount
    };
  } catch (err) {
    console.error('[OfflineDB] Search offline failed:', err);
    return { results: [], count: 0 };
  }
}

/**
 * Fetches single entry details offline
 */
export async function getEntryOffline(idOrXml: string | number): Promise<DictionaryEntry | null> {
  try {
    const all = await ensureEntriesInMemory();
    const strVal = String(idOrXml).trim();
    const numVal = Number(idOrXml);

    const found = all.find(
      (e) =>
        (!isNaN(numVal) && e.id === numVal) ||
        e.xml_id === strVal ||
        e.coptic_name === strVal
    );

    return found || null;
  } catch (err) {
    console.error('[OfflineDB] Get entry offline error:', err);
    return null;
  }
}
