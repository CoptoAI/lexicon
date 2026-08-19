// Interactive Coptic Grammar & Verb Conjugation Paradigm Engine
// Rules and paradigms for Bohairic (B) and Sahidic (S) dialects

export interface GrammaticalPerson {
  key: string;
  en: string;
  ar: string;
  copticPronounB: string;
  copticPronounS: string;
}

export interface ConjugationTense {
  id: string;
  en: string;
  ar: string;
  description: string;
  prefixesB: Record<string, string>;
  prefixesS: Record<string, string>;
  suffixesB?: Record<string, string>;
  suffixesS?: Record<string, string>;
}

export interface ConjugatedForm {
  personKey: string;
  personEn: string;
  personAr: string;
  copticForm: string;
  phonetic: string;
  arabicPhonetic: string;
}

export interface VerbConjugationResult {
  verbLemma: string;
  translationEn: string;
  translationAr: string;
  dialect: 'B' | 'S';
  tenseId: string;
  tenseEn: string;
  tenseAr: string;
  forms: ConjugatedForm[];
}

export const GRAMMATICAL_PERSONS: GrammaticalPerson[] = [
  { key: '1s', en: '1st Person Singular (I)', ar: 'المتكلم (أنا)', copticPronounB: 'ⲁⲛⲟⲕ', copticPronounS: 'ⲁⲛⲟⲕ' },
  { key: '2m', en: '2nd Person Masculine (You m)', ar: 'المخاطب (أنتَ)', copticPronounB: 'ⲛⲑⲟⲕ', copticPronounS: 'ⲛⲧⲟⲕ' },
  { key: '2f', en: '2nd Person Feminine (You f)', ar: 'المخاطبة (أنتِ)', copticPronounB: 'ⲛⲑⲟ', copticPronounS: 'ⲛⲧⲟ' },
  { key: '3m', en: '3rd Person Masculine (He / It)', ar: 'الغائب (هو)', copticPronounB: 'ⲛⲑⲟϥ', copticPronounS: 'ⲛⲧⲟϥ' },
  { key: '3f', en: '3rd Person Feminine (She / It)', ar: 'الغائبة (هي)', copticPronounB: 'ⲛⲑⲟⲥ', copticPronounS: 'ⲛⲧⲟⲥ' },
  { key: '1p', en: '1st Person Plural (We)', ar: 'المتكلمين (نحن)', copticPronounB: 'ⲁⲛⲟⲛ', copticPronounS: 'ⲁⲛⲟⲛ' },
  { key: '2p', en: '2nd Person Plural (You all)', ar: 'المخاطبين (أنتم)', copticPronounB: 'ⲛⲑⲱⲧⲛ', copticPronounS: 'ⲛⲧⲱⲧⲛ' },
  { key: '3p', en: '3rd Person Plural (They)', ar: 'الغائبين (هم)', copticPronounB: 'ⲛⲑⲱⲟⲩ', copticPronounS: 'ⲛⲧⲟⲟⲩ' },
];

export const COPTIC_TENSES: ConjugationTense[] = [
  {
    id: 'present1',
    en: 'Present I (General Present / Habitual)',
    ar: 'الحاضر الأول (الزمن الحاضر البسيط)',
    description: 'Expresses ongoing current actions or general truths.',
    prefixesB: {
      '1s': 'ϯ',
      '2m': 'ⲕ',
      '2f': 'ⲧⲉ',
      '3m': 'ϥ',
      '3f': 'ⲥ',
      '1p': 'ⲧⲛ',
      '2p': 'ⲧⲉⲧⲛ',
      '3p': 'ⲥⲉ'
    },
    prefixesS: {
      '1s': 'ϯ',
      '2m': 'ⲕ',
      '2f': 'ⲉⲣⲉ',
      '3m': 'ϥ',
      '3f': 'ⲥ',
      '1p': 'ⲧⲛ',
      '2p': 'ⲧⲉⲧⲛ',
      '3p': 'ⲥⲉ'
    }
  },
  {
    id: 'perfect1',
    en: 'Perfect I (Past Perfect / Completed Action)',
    ar: 'الماضي الأول (الزمن الماضي التام)',
    description: 'Expresses completed past actions.',
    prefixesB: {
      '1s': 'ⲁⲓ',
      '2m': 'ⲁⲕ',
      '2f': 'ⲁⲣⲁ',
      '3m': 'ⲁϥ',
      '3f': 'ⲁⲥ',
      '1p': 'ⲁⲛ',
      '2p': 'ⲁⲧⲉⲧⲛ',
      '3p': 'ⲁⲩ'
    },
    prefixesS: {
      '1s': 'ⲁⲓ',
      '2m': 'ⲁⲕ',
      '2f': 'ⲁⲣ',
      '3m': 'ⲁϥ',
      '3f': 'ⲁⲥ',
      '1p': 'ⲁⲛ',
      '2p': 'ⲁⲧⲉⲧⲛ',
      '3p': 'ⲁⲩ'
    }
  },
  {
    id: 'future1',
    en: 'Future I (Definite Future)',
    ar: 'المستقبل الأول (الزمن المستقبل)',
    description: 'Expresses future intention or action.',
    prefixesB: {
      '1s': 'ϯⲛⲁ',
      '2m': 'ⲕⲛⲁ',
      '2f': 'ⲧⲉⲛⲁ',
      '3m': 'ϥⲛⲁ',
      '3f': 'ⲥⲛⲁ',
      '1p': 'ⲧⲛⲛⲁ',
      '2p': 'ⲧⲉⲧⲛⲛⲁ',
      '3p': 'ⲥⲉⲛⲁ'
    },
    prefixesS: {
      '1s': 'ϯⲛⲁ',
      '2m': 'ⲕⲛⲁ',
      '2f': 'ⲉⲣⲉⲛⲁ',
      '3m': 'ϥⲛⲁ',
      '3f': 'ⲥⲛⲁ',
      '1p': 'ⲧⲛⲛⲁ',
      '2p': 'ⲧⲉⲧⲛⲛⲁ',
      '3p': 'ⲥⲉⲛⲁ'
    }
  },
  {
    id: 'imperfect',
    en: 'Imperfect (Past Continuous / Was doing)',
    ar: 'الماضي المستمر (كان يفعل)',
    description: 'Expresses continuous past background action.',
    prefixesB: {
      '1s': 'ⲛⲁⲓ',
      '2m': 'ⲛⲁⲕ',
      '2f': 'ⲛⲁⲣⲉ',
      '3m': 'ⲛⲁϥ',
      '3f': 'ⲛⲁⲥ',
      '1p': 'ⲛⲁⲛ',
      '2p': 'ⲛⲁⲧⲉⲧⲛ',
      '3p': 'ⲛⲁⲩ'
    },
    prefixesS: {
      '1s': 'ⲛⲉⲓ',
      '2m': 'ⲛⲉⲕ',
      '2f': 'ⲛⲉⲣⲉ',
      '3m': 'ⲛⲉϥ',
      '3f': 'ⲛⲉⲥ',
      '1p': 'ⲛⲉⲛ',
      '2p': 'ⲛⲉⲧⲛ',
      '3p': 'ⲛⲉⲩ'
    }
  },
  {
    id: 'subjunctive',
    en: 'Subjunctive / Optative (That I may do)',
    ar: 'المضارع المنصوب (لكي يفعل)',
    description: 'Expresses purpose, request, or subjunctive mood.',
    prefixesB: {
      '1s': 'ⲛⲧⲁ',
      '2m': 'ⲛⲧⲉⲕ',
      '2f': 'ⲛⲧⲉ',
      '3m': 'ⲛⲧⲉϥ',
      '3f': 'ⲛⲧⲉⲥ',
      '1p': 'ⲛⲧⲉⲛ',
      '2p': 'ⲛⲧⲉⲧⲛ',
      '3p': 'ⲛⲧⲟⲩ'
    },
    prefixesS: {
      '1s': 'ⲧⲁ',
      '2m': 'ⲛⲅ',
      '2f': 'ⲛⲣⲉ',
      '3m': 'ⲛϥ',
      '3f': 'ⲛⲥ',
      '1p': 'ⲛⲧⲛ',
      '2p': 'ⲛⲧⲉⲧⲛ',
      '3p': 'ⲛⲥⲉ'
    }
  }
];

export interface SampleVerb {
  lemma: string;
  en: string;
  ar: string;
  dialect: 'B' | 'S';
}

export const SAMPLE_BIBLICAL_VERBS: SampleVerb[] = [
  { lemma: 'ⲥⲁϫⲓ', en: 'to speak, say', ar: 'يتكلم، يقول', dialect: 'B' },
  { lemma: 'ⲥⲱⲧⲙ', en: 'to hear, listen, obey', ar: 'يسمع، يطيع', dialect: 'B' },
  { lemma: 'ⲙⲉⲓ', en: 'to love', ar: 'يحب', dialect: 'B' },
  { lemma: 'ⲟⲩⲱⲙ', en: 'to eat', ar: 'يأكل', dialect: 'B' },
  { lemma: 'ⲙⲟϣⲓ', en: 'to walk, go', ar: 'يمشي، يسير', dialect: 'B' },
  { lemma: 'ⲛⲁⲩ', en: 'to see, look', ar: 'يرى، ينظر', dialect: 'B' },
  { lemma: 'ⲥϩⲁⲓ', en: 'to write', ar: 'يكتب', dialect: 'B' },
  { lemma: 'ⲱⲛϧ', en: 'to live, be alive', ar: 'يعيش، يحيا', dialect: 'B' },
];

/**
 * Conjugates a Coptic verb stem across tenses and grammatical persons
 */
export function conjugateCopticVerb(
  verbLemma: string,
  tenseId: string = 'present1',
  dialect: 'B' | 'S' = 'B'
): VerbConjugationResult | null {
  if (!verbLemma) return null;

  const cleanLemma = verbLemma.trim().toLowerCase();
  const tense = COPTIC_TENSES.find(t => t.id === tenseId) || COPTIC_TENSES[0];
  const prefixes = dialect === 'B' ? tense.prefixesB : tense.prefixesS;

  const sampleMatch = SAMPLE_BIBLICAL_VERBS.find(v => v.lemma === cleanLemma);
  const translationEn = sampleMatch?.en || 'verb action';
  const translationAr = sampleMatch?.ar || 'فعل';

  const forms: ConjugatedForm[] = GRAMMATICAL_PERSONS.map(person => {
    const prefix = prefixes[person.key] || '';
    const fullForm = `${prefix}${cleanLemma}`;

    return {
      personKey: person.key,
      personEn: person.en,
      personAr: person.ar,
      copticForm: fullForm,
      phonetic: `${prefix}-${cleanLemma}`,
      arabicPhonetic: `${prefix} ${cleanLemma}`
    };
  });

  return {
    verbLemma: cleanLemma,
    translationEn,
    translationAr,
    dialect,
    tenseId: tense.id,
    tenseEn: tense.en,
    tenseAr: tense.ar,
    forms
  };
}
