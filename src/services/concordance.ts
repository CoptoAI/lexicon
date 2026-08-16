import concordanceData from '../../data/corpus_concordance.json';

export interface ManuscriptExample {
  id: string;
  lemma: string;
  matched_form: string;
  source_name: string;
  reference: string;
  urn: string;
  genre: 'biblical' | 'patristic' | 'monastic' | 'martyrdom';
  dialect: 'Sahidic' | 'Bohairic';
  coptic_text: string;
  english_translation: string;
  arabic_translation: string;
  scriptorium_url?: string;
}

const corpus: ManuscriptExample[] = (concordanceData as ManuscriptExample[]).map((item) => ({
  ...item,
  scriptorium_url: getScriptoriumUrl(item.urn)
}));

/**
 * Constructs deep link to Coptic Scriptorium digital edition or CTS URN viewer
 */
export function getScriptoriumUrl(urn: string): string {
  if (!urn) return 'https://copticscriptorium.org';
  // CTS URN pattern: urn:cts:copticLit:nt.john.sahidica:1.1
  const cleanUrn = urn.trim();
  return `https://copticscriptorium.org/corpora/#search=${encodeURIComponent(cleanUrn)}`;
}

/**
 * Normalizes Coptic text for flexible matching (removes diacritics, jinikim, etc.)
 */
function normalizeCoptic(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\uFE20-\uFE2F]/g, '')
    .replace(/[·.,;:?!]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Returns matching manuscript concordance sentences for a given Coptic headword
 */
export function getConcordanceExamples(coptic_name: string): ManuscriptExample[] {
  if (!coptic_name) return [];

  const normTarget = normalizeCoptic(coptic_name);

  return corpus.filter((item) => {
    const normLemma = normalizeCoptic(item.lemma);
    if (normLemma === normTarget || normTarget.includes(normLemma) || normLemma.includes(normTarget)) {
      return true;
    }

    const normForm = normalizeCoptic(item.matched_form);
    if (normForm === normTarget || normForm.includes(normTarget)) {
      return true;
    }

    // Check occurrences in the sentence text
    const normText = normalizeCoptic(item.coptic_text);
    return normText.split(/\s+/).some((token) => token.includes(normTarget));
  });
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
  const words = sentence.split(/(\s+|[.,;:?!])/);

  return words.map((token) => {
    const cleanToken = normalizeCoptic(token);
    // Matches exact token or token containing lemma (e.g. ⲡⲛⲟⲩⲧⲉ, ⲙⲡⲛⲟⲩⲧⲉ, ⲧⲁⲅⲁⲡⲏ)
    const isHighlight =
      cleanToken.length >= 2 &&
      cleanLemma.length >= 2 &&
      (cleanToken === cleanLemma || cleanToken.includes(cleanLemma) || cleanLemma.includes(cleanToken));

    return {
      text: token,
      isHighlight
    };
  });
}
