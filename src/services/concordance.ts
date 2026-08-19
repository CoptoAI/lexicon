export interface ManuscriptExample {
  id: string;
  reference: string;
  reference_ar?: string;
  urn: string;
  genre: 'biblical' | 'patristic' | 'monastic' | 'martyrdom';
  dialect: 'Sahidic' | 'Bohairic';
  source_name: string;
  coptic_text: string;
  english_translation: string;
  arabic_translation: string;
  scriptorium_url?: string;
}

// In-memory cache for ultra-fast lookup
const concordanceCache = new Map<string, ManuscriptExample[]>();
let staticJsonCache: Record<string, ManuscriptExample[]> | null = null;

/**
 * Unescapes HTML entities commonly found in raw corpus text (e.g. &apos; -> ')
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .trim();
}

/**
 * Constructs verified deep link to Coptic Scriptorium digital edition or CTS URN viewer
 */
export function getScriptoriumUrl(urn: string): string {
  if (!urn) return 'https://copticscriptorium.org';
  const cleanUrn = urn.trim();
  if (cleanUrn.startsWith('urn:cts:copticLit:')) {
    return `https://data.copticscriptorium.org/${cleanUrn}`;
  }
  return `https://copticscriptorium.org/`;
}

/**
 * Normalizes Coptic text for flexible matching (removes diacritics, jinikim, etc.)
 */
export function normalizeCoptic(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\uFE20-\uFE2F\u02BC\u02BD`'=\-⸗·*.?\[\]()]/g, '')
    .normalize('NFC')
    .trim()
    .toLowerCase();
}

/**
 * Asynchronously loads manuscript concordance sentences from /api/concordance or static JSON
 */
export async function fetchConcordanceExamples(coptic_name: string, dialect: string = 'all'): Promise<ManuscriptExample[]> {
  if (!coptic_name) return [];

  const rawTarget = coptic_name.trim();
  const cleanTarget = normalizeCoptic(rawTarget);
  const cacheKey = `${cleanTarget}_${dialect}`;

  if (concordanceCache.has(cacheKey)) {
    return concordanceCache.get(cacheKey)!;
  }

  // 1. Try D1 API endpoint
  try {
    const dialectQuery = dialect !== 'all' ? `&dialect=${encodeURIComponent(dialect)}` : '';
    const res = await fetch(`/api/concordance?lemma=${encodeURIComponent(cleanTarget)}${dialectQuery}`);
    if (res.ok) {
      const data = (await res.json()) as { citations?: ManuscriptExample[] };
      if (data && Array.isArray(data.citations) && data.citations.length > 0) {
        const mapped = data.citations.map(ensureScriptoriumUrl);
        concordanceCache.set(cacheKey, mapped);
        return mapped;
      }
    }
  } catch {
    // Fallback to static JSON below
  }

  // 2. Fallback to /data/corpus_concordance.json (static assets)
  try {
    if (!staticJsonCache) {
      const staticRes = await fetch('/data/corpus_concordance.json');
      if (staticRes.ok) {
        staticJsonCache = await staticRes.json();
      }
    }

    if (staticJsonCache) {
      let results: ManuscriptExample[] = [];

      if (staticJsonCache[rawTarget] && staticJsonCache[rawTarget].length > 0) {
        results = staticJsonCache[rawTarget];
      } else if (staticJsonCache[cleanTarget] && staticJsonCache[cleanTarget].length > 0) {
        results = staticJsonCache[cleanTarget];
      } else {
        // Compound prefix fallback
        const compoundPrefixes = ['ⲙⲛⲧ', 'ⲙⲉⲧ', 'ⲣⲉϥ', 'ⲣⲉϥϫⲓ', 'ⲁⲧ', 'ⲥⲁ', 'ϫⲓⲛ', 'ⲙⲁⲛ'];
        for (const pfx of compoundPrefixes) {
          const cleanPfx = normalizeCoptic(pfx);
          if (cleanTarget.startsWith(cleanPfx) && cleanTarget.length > cleanPfx.length + 2) {
            const stem = cleanTarget.slice(cleanPfx.length);
            if (staticJsonCache[stem] && staticJsonCache[stem].length > 0) {
              results = staticJsonCache[stem];
              break;
            }
          }
        }
      }

      if (results.length > 0) {
        const mapped = results.map(ensureScriptoriumUrl);
        concordanceCache.set(cleanTarget, mapped);
        concordanceCache.set(rawTarget, mapped);
        return mapped;
      }
    }
  } catch {
    // Ignore fetch errors
  }

  concordanceCache.set(cleanTarget, []);
  return [];
}

/**
 * Synchronously checks cache for instant UI preview
 */
export function getCachedConcordanceExamples(coptic_name: string): ManuscriptExample[] | null {
  const cleanTarget = normalizeCoptic(coptic_name);
  if (concordanceCache.has(cleanTarget)) {
    return concordanceCache.get(cleanTarget)!;
  }
  return null;
}

function ensureScriptoriumUrl(item: ManuscriptExample): ManuscriptExample {
  return {
    ...item,
    english_translation: unescapeHtml(item.english_translation),
    arabic_translation: unescapeHtml(item.arabic_translation),
    scriptorium_url: item.scriptorium_url || getScriptoriumUrl(item.urn)
  };
}

/**
 * Helper to build high-contrast keyword highlighting for Coptic sentences
 */
export function splitAndHighlightCoptic(
  sentence: string,
  targetLemma: string
): { text: string; isHighlight: boolean }[] {
  if (!sentence || !targetLemma) return [{ text: sentence, isHighlight: false }];

  const cleanLemma = normalizeCoptic(targetLemma);
  if (cleanLemma.length < 2) return [{ text: sentence, isHighlight: false }];

  const tokens = sentence.split(/(\s+|[.,;:?!⸗\[\]\(\)\-\=])/);

  return tokens.map((token) => {
    if (!token) return { text: '', isHighlight: false };
    const cleanToken = normalizeCoptic(token);
    const isHighlight =
      cleanToken.length >= 2 &&
      (cleanToken === cleanLemma ||
        cleanToken.includes(cleanLemma) ||
        (cleanLemma.length >= 4 && cleanLemma.includes(cleanToken)));

    return {
      text: token,
      isHighlight
    };
  }).filter(t => t.text.length > 0);
}
