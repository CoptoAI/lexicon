import { DictionaryEntry, Sense } from '../types/dictionary';

export interface SavedWord {
  id: number;
  xml_id: string;
  coptic_name: string;
  pos: string;
  dialects: string;
  origin: string;
  definition: string;
  ipa: string;
  saved_at: number;
  entry: DictionaryEntry;
}

const STORAGE_KEY = 'coptolex_saved_words';
type SavedWordsListener = (words: SavedWord[]) => void;
const listeners: Set<SavedWordsListener> = new Set();

export function getSavedWords(): SavedWord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse saved words:', err);
    return [];
  }
}

export function isWordSaved(idOrXml: string | number): boolean {
  const words = getSavedWords();
  const strId = String(idOrXml).trim();
  const numId = Number(idOrXml);
  return words.some(
    (w) =>
      (!isNaN(numId) && w.id === numId) ||
      w.xml_id === strId ||
      w.coptic_name === strId
  );
}

export function toggleSaveWord(entry: DictionaryEntry): boolean {
  if (!entry) return false;
  const words = getSavedWords();
  const isAlreadySaved = words.some(
    (w) => w.id === entry.id || w.xml_id === entry.xml_id || w.coptic_name === entry.coptic_name
  );

  let updated: SavedWord[];
  let newState: boolean;

  if (isAlreadySaved) {
    updated = words.filter(
      (w) => !(w.id === entry.id || w.xml_id === entry.xml_id || w.coptic_name === entry.coptic_name)
    );
    newState = false;
  } else {
    let primaryDef = '';
    if (entry.en_json) {
      try {
        const parsed: Sense[] = JSON.parse(entry.en_json);
        if (Array.isArray(parsed) && parsed.length > 0) primaryDef = parsed[0].definition;
      } catch (e) {}
    }
    if (!primaryDef && entry.ar_json) {
      try {
        const parsed: Sense[] = JSON.parse(entry.ar_json);
        if (Array.isArray(parsed) && parsed.length > 0) primaryDef = parsed[0].definition;
      } catch (e) {}
    }

    const newSaved: SavedWord = {
      id: entry.id,
      xml_id: entry.xml_id || String(entry.id),
      coptic_name: entry.coptic_name,
      pos: entry.pos || '',
      dialects: entry.dialects || '',
      origin: entry.origin || 'egyptian',
      definition: primaryDef || 'Coptic lexical entry',
      ipa: entry.ipa_sahidic || entry.ipa_bohairic || '',
      saved_at: Date.now(),
      entry
    };

    updated = [newSaved, ...words];
    newState = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
  } catch (err) {
    console.error('Failed to save words to localStorage:', err);
  }

  return newState;
}

export function removeSavedWord(idOrXml: string | number): void {
  const words = getSavedWords();
  const strId = String(idOrXml).trim();
  const numId = Number(idOrXml);
  const updated = words.filter(
    (w) => !((!isNaN(numId) && w.id === numId) || w.xml_id === strId || w.coptic_name === strId)
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
  } catch (err) {
    console.error('Failed to update saved words:', err);
  }
}

export function clearSavedWords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyListeners([]);
  } catch (err) {
    console.error('Failed to clear saved words:', err);
  }
}

export function subscribeSavedWords(listener: SavedWordsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(words: SavedWord[]): void {
  listeners.forEach((l) => l(words));
}
