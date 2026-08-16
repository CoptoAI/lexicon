// Coptic Morphological Analyzer & Bound-Group Deconstruction Engine
// Decomposes polymorphemic Coptic words and clauses into structured grammatical constituents.

export interface MorphemeToken {
  surface: string;
  type: 'article' | 'relative' | 'tense' | 'preposition' | 'verb' | 'noun' | 'pronoun' | 'converter' | 'suffix' | 'unknown';
  label: string;
  gloss: string;
  color: string;
  dictionaryQuery?: string;
}

export interface MorphAnalysis {
  original: string;
  clean: string;
  tokens: MorphemeToken[];
  explanation: string;
}

// Prefixes / Bound morphemes ordered by decreasing length for maximal matching
const PREFIX_RULES = [
  // Compound Prepositions & Adverbs
  { pattern: /^ⲉⲃⲟⲗ ϩⲛ-?/i, surface: 'ⲉⲃⲟⲗ ϩⲛ', type: 'preposition' as const, label: 'Prep.', gloss: 'out of / from', color: '#38bdf8' },
  { pattern: /^ⲉⲃⲟⲗ ϩⲓ-?/i, surface: 'ⲉⲃⲟⲗ ϩⲓ', type: 'preposition' as const, label: 'Prep.', gloss: 'out from on', color: '#38bdf8' },
  { pattern: /^ⲉϩⲟⲩⲛ ⲉ-?/i, surface: 'ⲉϩⲟⲩⲛ ⲉ', type: 'preposition' as const, label: 'Prep.', gloss: 'into / towards', color: '#38bdf8' },

  // Conjugation Bases / Tense Converters
  { pattern: /^ⲛⲧⲁⲣⲉ-?/i, surface: 'ⲛⲧⲁⲣⲉ', type: 'tense' as const, label: 'Temporal Base', gloss: 'when / after', color: '#a855f7' },
  { pattern: /^ⲉϥϣⲁⲛ-?/i, surface: 'ⲉϥϣⲁⲛ', type: 'tense' as const, label: 'Conditional (3m)', gloss: 'if he / whenever he', color: '#a855f7' },
  { pattern: /^ⲉⲥϣⲁⲛ-?/i, surface: 'ⲉⲥϣⲁⲛ', type: 'tense' as const, label: 'Conditional (3f)', gloss: 'if she / whenever she', color: '#a855f7' },
  { pattern: /^ⲉⲩϣⲁⲛ-?/i, surface: 'ⲉⲩϣⲁⲛ', type: 'tense' as const, label: 'Conditional (3pl)', gloss: 'if they', color: '#a855f7' },
  { pattern: /^ⲙⲡⲁⲧⲉ-?/i, surface: 'ⲙⲡⲁⲧⲉ', type: 'tense' as const, label: 'Limitative (Neg.)', gloss: 'before / not yet', color: '#ec4899' },
  { pattern: /^ⲙⲡⲉ-?/i, surface: 'ⲙⲡⲉ', type: 'tense' as const, label: 'Neg. Perfect', gloss: 'did not', color: '#ec4899' },
  { pattern: /^ⲛⲧⲁ-?/i, surface: 'ⲛⲧⲁ', type: 'converter' as const, label: 'Focal / 2nd Past', gloss: 'it is ... that (Foc.)', color: '#8b5cf6' },
  { pattern: /^ϣⲁⲣⲉ-?/i, surface: 'ϣⲁⲣⲉ', type: 'tense' as const, label: 'Habitual Base', gloss: 'usually / accustomed to', color: '#a855f7' },
  { pattern: /^ⲙⲉⲣⲉ-?/i, surface: 'ⲙⲉⲣⲉ', type: 'tense' as const, label: 'Neg. Habitual', gloss: 'does not usually', color: '#ec4899' },
  { pattern: /^ⲛⲛⲉ-?/i, surface: 'ⲛⲛⲉ', type: 'tense' as const, label: 'Neg. Future', gloss: 'will not / shall not', color: '#ec4899' },
  { pattern: /^ⲉⲣⲉ-?/i, surface: 'ⲉⲣⲉ', type: 'converter' as const, label: 'Circumstantial Base', gloss: 'while / as', color: '#8b5cf6' },
  { pattern: /^ⲁ-?/i, surface: 'ⲁ', type: 'tense' as const, label: 'Past Base', gloss: 'did (Perf.)', color: '#a855f7' },

  // Relative & Adjectival Converters
  { pattern: /^ⲡⲉⲧⲉ-?/i, surface: 'ⲡⲉⲧⲉ', type: 'relative' as const, label: 'Rel. Pronoun (m)', gloss: 'he who / that which', color: '#eab308' },
  { pattern: /^ⲧⲉⲧⲉ-?/i, surface: 'ⲧⲉⲧⲉ', type: 'relative' as const, label: 'Rel. Pronoun (f)', gloss: 'she who / that which', color: '#eab308' },
  { pattern: /^ⲛⲉⲧⲉ-?/i, surface: 'ⲛⲉⲧⲉ', type: 'relative' as const, label: 'Rel. Pronoun (pl)', gloss: 'those who', color: '#eab308' },
  { pattern: /^ⲡⲉⲧ-?/i, surface: 'ⲡⲉⲧ', type: 'relative' as const, label: 'Rel. Pronoun (m)', gloss: 'he who / that which', color: '#eab308' },
  { pattern: /^ⲧⲉⲧ-?/i, surface: 'ⲧⲉⲧ', type: 'relative' as const, label: 'Rel. Pronoun (f)', gloss: 'she who / that which', color: '#eab308' },
  { pattern: /^ⲛⲉⲧ-?/i, surface: 'ⲛⲉⲧ', type: 'relative' as const, label: 'Rel. Pronoun (pl)', gloss: 'those who', color: '#eab308' },
  { pattern: /^ⲉⲧⲉ-?/i, surface: 'ⲉⲧⲉ', type: 'relative' as const, label: 'Relative Marker', gloss: 'who / which / that', color: '#eab308' },
  { pattern: /^ⲉⲧ-?/i, surface: 'ⲉⲧ', type: 'relative' as const, label: 'Relative Marker', gloss: 'who / which / that', color: '#eab308' },

  // Possessive Articles
  { pattern: /^ⲡⲁ-?/i, surface: 'ⲡⲁ', type: 'article' as const, label: 'Poss. Art. (1s.m)', gloss: 'my (masc. noun)', color: '#10b981' },
  { pattern: /^ⲧⲁ-?/i, surface: 'ⲧⲁ', type: 'article' as const, label: 'Poss. Art. (1s.f)', gloss: 'my (fem. noun)', color: '#10b981' },
  { pattern: /^ⲛⲁ-?/i, surface: 'ⲛⲁ', type: 'article' as const, label: 'Poss. Art. (1s.pl)', gloss: 'my (plural nouns)', color: '#10b981' },
  { pattern: /^ⲡⲉⲕ-?/i, surface: 'ⲡⲉⲕ', type: 'article' as const, label: 'Poss. Art. (2sm.m)', gloss: 'your (masc. to male)', color: '#10b981' },
  { pattern: /^ⲡⲟⲩ-?/i, surface: 'ⲡⲟⲩ', type: 'article' as const, label: 'Poss. Art. (2sf.m)', gloss: 'your (masc. to female)', color: '#10b981' },
  { pattern: /^ⲡⲉϥ-?/i, surface: 'ⲡⲉϥ', type: 'article' as const, label: 'Poss. Art. (3sm.m)', gloss: 'his (masc. noun)', color: '#10b981' },
  { pattern: /^ⲧⲉϥ-?/i, surface: 'ⲧⲉϥ', type: 'article' as const, label: 'Poss. Art. (3sm.f)', gloss: 'his (fem. noun)', color: '#10b981' },
  { pattern: /^ⲛⲉϥ-?/i, surface: 'ⲛⲉϥ', type: 'article' as const, label: 'Poss. Art. (3sm.pl)', gloss: 'his (plural nouns)', color: '#10b981' },
  { pattern: /^ⲡⲉⲥ-?/i, surface: 'ⲡⲉⲥ', type: 'article' as const, label: 'Poss. Art. (3sf.m)', gloss: 'her (masc. noun)', color: '#10b981' },
  { pattern: /^ⲡⲉⲛ-?/i, surface: 'ⲡⲉⲛ', type: 'article' as const, label: 'Poss. Art. (1pl.m)', gloss: 'our (masc. noun)', color: '#10b981' },
  { pattern: /^ⲡⲉⲩ-?/i, surface: 'ⲡⲉⲩ', type: 'article' as const, label: 'Poss. Art. (3pl.m)', gloss: 'their (masc. noun)', color: '#10b981' },

  // Definite & Indefinite Articles
  { pattern: /^ⲡ-?/i, surface: 'ⲡ', type: 'article' as const, label: 'Def. Art. (m)', gloss: 'the (masc. sg.)', color: '#10b981' },
  { pattern: /^ⲧ-?/i, surface: 'ⲧ', type: 'article' as const, label: 'Def. Art. (f)', gloss: 'the (fem. sg.)', color: '#10b981' },
  { pattern: /^ⲛ-?/i, surface: 'ⲛ', type: 'article' as const, label: 'Def. Art. (pl)', gloss: 'the (plural)', color: '#10b981' },
  { pattern: /^ⲟⲩ-?/i, surface: 'ⲟⲩ', type: 'article' as const, label: 'Indef. Art. (sg)', gloss: 'a / an', color: '#10b981' },
  { pattern: /^ϩⲉⲛ-?/i, surface: 'ϩⲉⲛ', type: 'article' as const, label: 'Indef. Art. (pl)', gloss: 'some (plural)', color: '#10b981' },

  // Simple Prepositions
  { pattern: /^ϩⲛ-?/i, surface: 'ϩⲛ', type: 'preposition' as const, label: 'Prep.', gloss: 'in / inside', color: '#38bdf8' },
  { pattern: /^ϩⲓ-?/i, surface: 'ϩⲓ', type: 'preposition' as const, label: 'Prep.', gloss: 'on / upon', color: '#38bdf8' },
  { pattern: /^ⲉ-?/i, surface: 'ⲉ', type: 'preposition' as const, label: 'Prep.', gloss: 'to / toward', color: '#38bdf8' },
  { pattern: /^ⲙⲛ-?/i, surface: 'ⲙⲛ', type: 'preposition' as const, label: 'Prep.', gloss: 'with / and', color: '#38bdf8' }
];

// Pronominal Suffixes attached to end of prepronominal verbs or prepositions
const SUFFIX_RULES = [
  { pattern: /-?ⲧⲏⲩⲧⲛ$/i, surface: 'ⲧⲏⲩⲧⲛ', type: 'suffix' as const, label: 'Pron. Suffix (2pl)', gloss: 'you (pl.)', color: '#f59e0b' },
  { pattern: /-?ⲟⲩ$/i, surface: 'ⲟⲩ', type: 'suffix' as const, label: 'Pron. Suffix (3pl)', gloss: 'them / they', color: '#f59e0b' },
  { pattern: /-?ⲛ$/i, surface: 'ⲛ', type: 'suffix' as const, label: 'Pron. Suffix (1pl)', gloss: 'us / we', color: '#f59e0b' },
  { pattern: /-?ϥ$/i, surface: 'ϥ', type: 'suffix' as const, label: 'Pron. Suffix (3sm)', gloss: 'him / he / it', color: '#f59e0b' },
  { pattern: /-?ⲥ$/i, surface: 'ⲥ', type: 'suffix' as const, label: 'Pron. Suffix (3sf)', gloss: 'her / she / it', color: '#f59e0b' },
  { pattern: /-?ⲕ$/i, surface: 'ⲕ', type: 'suffix' as const, label: 'Pron. Suffix (2sm)', gloss: 'you (m.)', color: '#f59e0b' },
  { pattern: /-?ⲧⲉ$/i, surface: 'ⲧⲉ', type: 'suffix' as const, label: 'Pron. Suffix (2sf)', gloss: 'you (f.)', color: '#f59e0b' },
  { pattern: /-?ⲧ$/i, surface: 'ⲧ', type: 'suffix' as const, label: 'Pron. Suffix (1s)', gloss: 'me / I', color: '#f59e0b' },
  { pattern: /-?ⲓ$/i, surface: 'ⲓ', type: 'suffix' as const, label: 'Pron. Suffix (1s)', gloss: 'me / I', color: '#f59e0b' }
];

/**
 * Deconstructs a polymorphemic Coptic phrase into grammatical components.
 */
export function analyzeMorphology(inputPhrase: string): MorphAnalysis | null {
  if (!inputPhrase || inputPhrase.trim().length < 2) return null;

  let current = inputPhrase.trim().toLowerCase();
  const tokens: MorphemeToken[] = [];

  // 1. Strip and record prefixes iteratively
  let matchedPrefix = true;
  while (matchedPrefix && current.length > 2) {
    matchedPrefix = false;
    for (const rule of PREFIX_RULES) {
      if (rule.pattern.test(current)) {
        tokens.push({
          surface: rule.surface,
          type: rule.type,
          label: rule.label,
          gloss: rule.gloss,
          color: rule.color,
          dictionaryQuery: rule.surface
        });
        current = current.replace(rule.pattern, '').replace(/^-/, '').trim();
        matchedPrefix = true;
        break;
      }
    }
  }

  // 2. Check for pronominal suffix if remaining stem is longer than 2 characters
  let suffixToken: MorphemeToken | null = null;
  if (current.length > 2) {
    for (const rule of SUFFIX_RULES) {
      if (rule.pattern.test(current)) {
        suffixToken = {
          surface: rule.surface,
          type: rule.type,
          label: rule.label,
          gloss: rule.gloss,
          color: rule.color
        };
        current = current.replace(rule.pattern, '').replace(/-$/, '').trim();
        break;
      }
    }
  }

  // 3. The remaining core is the lexical stem (Noun or Verb)
  if (current.length > 0) {
    tokens.push({
      surface: current,
      type: 'verb',
      label: 'Core Lexical Stem',
      gloss: 'Lexicon Root',
      color: '#d4af37',
      dictionaryQuery: current
    });
  }

  if (suffixToken) {
    tokens.push(suffixToken);
  }

  // Only return meaningful analysis if we found at least 2 constituents
  if (tokens.length < 2) {
    return null;
  }

  const glosses = tokens.map((t) => t.gloss).join(' + ');
  const explanation = `${tokens.map((t) => t.surface).join(' - ')} = "${glosses}"`;

  return {
    original: inputPhrase,
    clean: tokens.map((t) => t.surface).join(''),
    tokens,
    explanation
  };
}
