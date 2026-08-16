import { WidgetLookupResult } from './types';

// In-memory LRU cache for 0ms repeat lookups
const lookupCache = new Map<string, WidgetLookupResult>();
const MAX_CACHE_SIZE = 300;

/**
 * Fetch word definition from CoptoLex Edge API with client cache
 */
export async function fetchWordLookup(
  word: string,
  apiUrl: string,
  lang: 'en' | 'de' | 'fr' | 'ar' = 'en'
): Promise<WidgetLookupResult | null> {
  const cleanWord = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
    .normalize('NFC')
    .trim()
    .toLowerCase();

  if (!cleanWord) return null;

  const cacheKey = `${cleanWord}:${lang}`;
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey)!;
  }

  try {
    const base = apiUrl.replace(/\/$/, '');
    const url = `${base}/widget/lookup?word=${encodeURIComponent(cleanWord)}&lang=${lang}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return null;
    }

    const data: WidgetLookupResult = await res.json();
    if (data && data.found) {
      if (lookupCache.size >= MAX_CACHE_SIZE) {
        const firstKey = lookupCache.keys().next().value;
        if (firstKey) lookupCache.delete(firstKey);
      }
      lookupCache.set(cacheKey, data);
      return data;
    }

    return null;
  } catch (err) {
    console.warn('[CoptoLex Widget] Lookup error:', err);
    return null;
  }
}

/**
 * Lightweight Coptic speech synthesizer for widget
 */
export function playWidgetAudio(copticWord: string, dialect: 'S' | 'B' = 'S'): void {
  if (!copticWord || typeof window === 'undefined') return;

  let text = copticWord.toLowerCase();
  text = text.replace(/ⲟⲩ/g, 'oo');
  text = text.replace(/ϯ/g, dialect === 'B' ? 'dee' : 'tee');
  text = text.replace(/ⲯ/g, 'ps');
  text = text.replace(/ⲝ/g, 'ks');
  text = text.replace(/ⲑ/g, 'th');
  text = text.replace(/ⲫ/g, 'f');
  text = text.replace(/ⲭ/g, 'kh');
  text = text.replace(/ϣ/g, 'sh');
  text = text.replace(/ϥ/g, 'f');
  text = text.replace(/ϧ|ⳉ/g, 'kh');
  text = text.replace(/ϩ/g, 'h');
  text = text.replace(/ϫ/g, dialect === 'B' ? 'j' : 'ch');
  text = text.replace(/ϭ/g, dialect === 'B' ? 'ch' : 'k');

  const charMap: Record<string, string> = {
    'ⲁ': 'ah', 'ⲃ': dialect === 'B' ? 'v' : 'b', 'ⲅ': 'g', 'ⲇ': 'd',
    'ⲉ': 'eh', 'ⲍ': 'z', 'ⲏ': 'ay', 'ⲓ': 'ee', 'ⲕ': 'k', 'ⲗ': 'l',
    'ⲙ': 'm', 'ⲛ': 'n', 'ⲟ': 'o', 'ⲡ': 'p', 'ⲣ': 'r', 'ⲥ': 's',
    'ⲧ': 't', 'ⲩ': 'oo', 'ⲱ': 'oh'
  };

  let phonetic = '';
  for (const ch of text) {
    if (charMap[ch] !== undefined) phonetic += charMap[ch];
    else if (/[a-z\s]/i.test(ch)) phonetic += ch;
  }
  phonetic = phonetic.trim() || copticWord;

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phonetic);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('el') || v.lang.startsWith('it') || v.lang.startsWith('la') || v.lang.startsWith('es'))
        || voices.find(v => v.lang.startsWith('en'));

      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      return;
    } catch (e) {}
  }
}
