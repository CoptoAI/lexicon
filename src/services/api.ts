import { DictionaryEntry, SearchFilters, NetworkData, DatabaseStats } from '../types/dictionary';
import { searchOffline, getEntryOffline } from './offlineDb';

export async function fetchStats(): Promise<DatabaseStats> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.warn('Stats fetch fallback:', err);
    return { entries: 11272, lemmas: 8358, collocates: 32452 };
  }
}

export async function searchDictionary(filters: SearchFilters, limit = 50): Promise<{ results: DictionaryEntry[]; count: number }> {
  // If browser is offline, directly use offline DB
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await searchOffline(filters, limit);
  }

  try {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.dialect && filters.dialect !== 'any') params.set('dialect', filters.dialect);
    if (filters.pos && filters.pos !== 'any') params.set('pos', filters.pos);
    if (filters.lang && filters.lang !== 'any') params.set('lang', filters.lang);
    if (filters.origin && filters.origin !== 'all') params.set('origin', filters.origin);
    if (filters.sortBy) params.set('sort', filters.sortBy);
    params.set('limit', limit.toString());

    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) throw new Error('Search failed');
    const data = (await res.json()) as any;
    return {
      results: data.results || [],
      count: data.count || (data.results ? data.results.length : 0)
    };
  } catch (err) {
    console.warn('API search failed, attempting offline fallback:', err);
    return await searchOffline(filters, limit);
  }
}

export async function fetchEntryDetail(idOrXml: string | number): Promise<DictionaryEntry | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await getEntryOffline(idOrXml);
  }

  try {
    const res = await fetch(`/api/entries/${encodeURIComponent(idOrXml)}`);
    if (!res.ok) throw new Error('Entry not found');
    return (await res.json()) as DictionaryEntry;
  } catch (err) {
    console.warn('Fetch entry detail failed, trying offline store:', err);
    return await getEntryOffline(idOrXml);
  }
}

export async function fetchTermNetwork(word: string): Promise<NetworkData> {
  try {
    const res = await fetch(`/api/network/${encodeURIComponent(word)}`);
    if (!res.ok) throw new Error('Failed to fetch network');
    return (await res.json()) as NetworkData;
  } catch (err) {
    console.error('Fetch network error:', err);
    return { nodes: [{ id: word, label: word, isRoot: true }], links: [] };
  }
}

/**
 * Generates an Anki Flashcard CSV deck from a list of entries and triggers download
 */
export function exportAnkiDeck(entries: DictionaryEntry[], filename = 'coptic_anki_deck.csv'): void {
  if (!entries || entries.length === 0) return;

  const rows: string[] = [
    ['Coptic Word', 'IPA Pronunciation', 'Part of Speech', 'Dialects', 'Arabic Definition', 'English Definition', 'German Definition', 'Etymology / Root', 'Entry ID'].map(csvEscape).join('\t')
  ];

  for (const e of entries) {
    let arDef = '';
    if (e.ar_json) {
      try {
        const p = JSON.parse(e.ar_json);
        if (Array.isArray(p)) arDef = p.map((s, i) => `${i + 1}. ${s.definition}`).join('; ');
      } catch (err) {}
    }

    let enDef = '';
    if (e.en_json) {
      try {
        const p = JSON.parse(e.en_json);
        if (Array.isArray(p)) enDef = p.map((s, i) => `${i + 1}. ${s.definition}`).join('; ');
      } catch (err) {}
    }

    let deDef = '';
    if (e.de_json) {
      try {
        const p = JSON.parse(e.de_json);
        if (Array.isArray(p)) deDef = p.map((s, i) => `${i + 1}. ${s.definition}`).join('; ');
      } catch (err) {}
    }

    const row = [
      e.coptic_name,
      e.ipa_sahidic || '',
      e.pos || '',
      e.dialects || '',
      arDef,
      enDef,
      deDef,
      e.etym || '',
      e.xml_id || ''
    ];

    rows.push(row.map(csvEscape).join('\t'));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function csvEscape(text: string): string {
  if (!text) return '""';
  const clean = text.replace(/"/g, '""');
  return `"${clean}"`;
}
