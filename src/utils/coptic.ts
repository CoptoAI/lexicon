// Coptic Alphabet and Transliteration Tools

export interface CopticChar {
  upper: string;
  lower: string;
  name: string;
  translit: string;
  key: string;
  category: 'core' | 'demotic' | 'diacritic' | 'number';
}

export const COPTIC_ALPHABET: CopticChar[] = [
  { upper: 'Ⲁ', lower: 'ⲁ', name: 'Alpha', translit: 'a', key: 'a', category: 'core' },
  { upper: 'Ⲃ', lower: 'ⲃ', name: 'Beta / Vida', translit: 'b/v', key: 'b', category: 'core' },
  { upper: 'Ⲅ', lower: 'ⲅ', name: 'Gamma', translit: 'g/gh', key: 'g', category: 'core' },
  { upper: 'Ⲇ', lower: 'ⲇ', name: 'Delta', translit: 'd/dh', key: 'd', category: 'core' },
  { upper: 'Ⲉ', lower: 'ⲉ', name: 'Eie', translit: 'e', key: 'e', category: 'core' },
  { upper: 'Ⲋ', lower: 'ⲋ', name: 'Soou (Six)', translit: '6', key: '6', category: 'number' },
  { upper: 'Ⲍ', lower: 'ⲍ', name: 'Zeta', translit: 'z', key: 'z', category: 'core' },
  { upper: 'Ⲏ', lower: 'ⲏ', name: 'Hate / Ita', translit: 'ē/i', key: 'h', category: 'core' },
  { upper: 'Ⲑ', lower: 'ⲑ', name: 'Thete', translit: 'th', key: 'th', category: 'core' },
  { upper: 'Ⲓ', lower: 'ⲓ', name: 'Iota', translit: 'i/y', key: 'i', category: 'core' },
  { upper: 'Ⲕ', lower: 'ⲕ', name: 'Kappa', translit: 'k', key: 'k', category: 'core' },
  { upper: 'Ⲗ', lower: 'ⲗ', name: 'Laula', translit: 'l', key: 'l', category: 'core' },
  { upper: 'Ⲙ', lower: 'ⲙ', name: 'Mei', translit: 'm', key: 'm', category: 'core' },
  { upper: 'Ⲛ', lower: 'ⲛ', name: 'Nei', translit: 'n', key: 'n', category: 'core' },
  { upper: 'Ⲝ', lower: 'ⲝ', name: 'Ksi', translit: 'ks', key: 'x', category: 'core' },
  { upper: 'Ⲟ', lower: 'ⲟ', name: 'O', translit: 'o', key: 'o', category: 'core' },
  { upper: 'Ⲡ', lower: 'ⲡ', name: 'Pi', translit: 'p', key: 'p', category: 'core' },
  { upper: 'Ⲣ', lower: 'ⲣ', name: 'Ro', translit: 'r', key: 'r', category: 'core' },
  { upper: 'Ⲥ', lower: 'ⲥ', name: 'Sima', translit: 's', key: 's', category: 'core' },
  { upper: 'Ⲧ', lower: 'ⲧ', name: 'Tav', translit: 't', key: 't', category: 'core' },
  { upper: 'Ⲩ', lower: 'ⲩ', name: 'Upsilon', translit: 'u/v/y', key: 'u', category: 'core' },
  { upper: 'Ⲫ', lower: 'ⲫ', name: 'Phi', translit: 'ph/f', key: 'ph', category: 'core' },
  { upper: 'Ⲭ', lower: 'ⲭ', name: 'Khi', translit: 'kh/ch', key: 'kh', category: 'core' },
  { upper: 'Ⲯ', lower: 'ⲯ', name: 'Psi', translit: 'ps', key: 'ps', category: 'core' },
  { upper: 'Ⲱ', lower: 'ⲱ', name: 'Oou / Omega', translit: 'ō', key: 'w', category: 'core' },
  
  // Demotic-origin additions
  { upper: 'Ϣ', lower: 'ϣ', name: 'Shai', translit: 'š / sh', key: 'sh', category: 'demotic' },
  { upper: 'Ϥ', lower: 'ϥ', name: 'Fai', translit: 'f', key: 'f', category: 'demotic' },
  { upper: 'Ϧ', lower: 'ϧ', name: 'Khai (Bohairic)', translit: 'ḫ / x', key: 'x', category: 'demotic' },
  { upper: 'Ⳉ', lower: 'ⳉ', name: 'Horori (Akhmimic)', translit: 'ẖ', key: 'h2', category: 'demotic' },
  { upper: 'Ϩ', lower: 'ϩ', name: 'Hori', translit: 'h', key: 'hh', category: 'demotic' },
  { upper: 'Ϫ', lower: 'ϫ', name: 'Janja', translit: 'j / dj', key: 'j', category: 'demotic' },
  { upper: 'Ϭ', lower: 'ϭ', name: 'Kyima', translit: 'q / ch', key: 'q', category: 'demotic' },
  { upper: 'Ϯ', lower: 'ϯ', name: 'Ti', translit: 'ti / di', key: 'ti', category: 'demotic' }
];

export const DIALECT_DESCRIPTIONS: Record<string, { name: string; region: string; color: string }> = {
  S: { name: 'Sahidic', region: 'Upper Egypt (Standard literary)', color: '#3b82f6' },
  B: { name: 'Bohairic', region: 'Delta & Lower Egypt (Ecclesiastical)', color: '#10b981' },
  A: { name: 'Akhmimic', region: 'Panopolis / Akhmim', color: '#f59e0b' },
  K: { name: 'Old Coptic', region: 'Pre-standardized early dialect', color: '#8b5cf6' },
  F: { name: 'Fayyumic', region: 'Fayyum Oasis', color: '#ec4899' },
  M: { name: 'Mesokemic', region: 'Middle Egypt (Oxyrhynchite)', color: '#06b6d4' },
  L: { name: 'Lycopolitan', region: 'Subakhmimic / Asyut', color: '#84cc16' },
  P: { name: 'Proto-Theban', region: 'Thebes region early forms', color: '#eab308' },
  V: { name: 'South Fayyumic Greek', region: 'Greek usage in South Fayyum', color: '#6366f1' },
  W: { name: 'Crypto-Mesokemic Greek', region: 'Greek loanwords in Mesokemic', color: '#14b8a6' },
  '?': { name: 'Greek (Usage unclear)', region: 'Undetermined dialectal Greek', color: '#94a3b8' }
};

export const POS_DESCRIPTIONS: Record<string, string> = {
  N: 'Noun',
  V: 'Verb (Infinitive)',
  VSTAT: 'Verb (Statival / Qualitative)',
  VBD: 'Verb (Imperative / Base form)',
  A: 'Adjective / Verbal Prefix',
  ART: 'Article (Definite / Indefinite)',
  C: 'Conjunction / Clause Converter',
  CONJ: 'Conjunction',
  NEG: 'Negative particle / prefix',
  NUM: 'Numeral / Number',
  PDEM: 'Demonstrative Pronoun',
  PINT: 'Interrogative Pronoun',
  PPER: 'Personal Pronoun',
  PPERO: 'Personal Pronoun Object',
  PPOS: 'Possessive Pronoun / Article',
  PREP: 'Preposition',
  PTC: 'Particle',
  PUNCT: 'Punctuation',
  UNKNOWN: 'Unknown / Unspecified'
};

/**
 * Phonetic conversion from standard Latin keystrokes to Coptic
 */
export function convertLatinToCoptic(input: string): string {
  const map: Record<string, string> = {
    'a': 'ⲁ', 'b': 'ⲃ', 'g': 'ⲅ', 'd': 'ⲇ', 'e': 'ⲉ', 'z': 'ⲍ', 'h': 'ⲏ',
    'th': 'ⲑ', 'i': 'ⲓ', 'k': 'ⲕ', 'l': 'ⲗ', 'm': 'ⲙ', 'n': 'ⲛ', 'x': 'ⲝ',
    'o': 'ⲟ', 'p': 'ⲡ', 'r': 'ⲣ', 's': 'ⲥ', 't': 'ⲧ', 'u': 'ⲩ', 'y': 'ⲩ',
    'ph': 'ⲫ', 'kh': 'ⲭ', 'ps': 'ⲯ', 'w': 'ⲱ', 'sh': 'ϣ', 'f': 'ϥ',
    'kh2': 'ϧ', 'hh': 'ϩ', 'j': 'ϫ', 'c': 'ϭ', 'ti': 'ϯ', '=': '⸗', '-': '-'
  };

  let res = input.toLowerCase();
  // Multi-char substitutions first
  const multiKeys = Object.keys(map).filter(k => k.length > 1).sort((a, b) => b.length - a.length);
  for (const k of multiKeys) {
    res = res.replaceAll(k, map[k]);
  }
  // Single char substitutions
  for (const k of Object.keys(map).filter(k => k.length === 1)) {
    res = res.replaceAll(k, map[k]);
  }
  return res;
}

/**
 * Strips combining marks, supralinear strokes, jinkim, etc. for searching
 */
export function cleanCoptic(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
    .normalize('NFC')
    .trim();
}

export const stripDiacritics = cleanCoptic;

export const COMMON_COPTIC_GLOSSES: Record<string, { en: string; ar: string; pos: string }> = {
  // Common Biblical Headwords & Prefixed Forms
  "ⲡⲛⲟⲩⲧⲉ": { en: "God", ar: "الله", pos: "N" },
  "ⲫϯ": { en: "God", ar: "الله", pos: "N" },
  "ⲡⲓⲥⲁϫⲓ": { en: "the Word", ar: "الكلمة", pos: "N" },
  "ⲡϣⲁϫⲉ": { en: "the Word", ar: "الكلمة", pos: "N" },
  "ⲥⲁϫⲓ": { en: "word / speak", ar: "كلمة / يتكلم", pos: "N/V" },
  "ϣⲁϫⲉ": { en: "word / speak", ar: "كلمة / يتكلم", pos: "N/V" },
  "ⲡⲓⲭⲣⲓⲥⲧⲟⲥ": { en: "the Christ", ar: "المسيح", pos: "N" },
  "ⲡⲉⲭⲣⲓⲥⲧⲟⲥ": { en: "the Christ", ar: "المسيح", pos: "N" },
  "ⲓⲏⲥⲟⲩⲥ": { en: "Jesus", ar: "يسوع", pos: "N" },
  "ⲓⲏⲥ": { en: "Jesus", ar: "يسوع", pos: "N" },
  "ⲡⲛⲉⲩⲙⲁ": { en: "Spirit", ar: "الروح", pos: "N" },
  "ⲡⲛⲁ": { en: "Spirit", ar: "الروح", pos: "N" },
  "ⲡⲓⲡⲛⲉⲩⲙⲁ": { en: "the Spirit", ar: "الروح", pos: "N" },
  "ⲉⲑⲟⲩⲁⲃ": { en: "Holy", ar: "القدوس", pos: "ADJ" },
  "ⲉⲧⲟⲩⲁⲁⲃ": { en: "Holy", ar: "القدوس", pos: "ADJ" },
  "ϧⲉⲛ": { en: "in / with", ar: "في / مع", pos: "PREP" },
  "ϩⲛ": { en: "in / with", ar: "في / مع", pos: "PREP" },
  "ⲛⲉ": { en: "was / is", ar: "كان / يكون", pos: "V" },
  "ⲛⲉϥ": { en: "his / he was", ar: "كان", pos: "V" },
  "ⲛⲁϥ": { en: "was / to him", ar: "له / كان", pos: "PREP" },
  "ⲟⲩⲟϩ": { en: "and", ar: "و", pos: "CONJ" },
  "ⲁⲩⲱ": { en: "and", ar: "و", pos: "CONJ" },
  "ⲡⲉ": { en: "is / was", ar: "هو", pos: "PTC" },
  "ⲡ": { en: "the (m)", ar: "ال", pos: "ART" },
  "ⲧ": { en: "the (f)", ar: "ال", pos: "ART" },
  "ⲛ": { en: "the (pl) / of", ar: "ال / من", pos: "ART" },
  "ⲟⲩ": { en: "a / what", ar: "ما / واحد", pos: "ART" },
  "ϩⲉⲛ": { en: "some", ar: "بعض", pos: "ART" },
  "ⲁⲅⲁⲡⲏ": { en: "love", ar: "محبة", pos: "N" },
  "ⲙⲉⲧⲁⲅⲁⲡⲏ": { en: "love", ar: "محبة", pos: "N" },
  "ⲥⲱⲧⲡ": { en: "choose", ar: "يختار", pos: "V" },
  "ⲙⲁⲑⲏⲧⲏⲥ": { en: "disciple", ar: "تلميذ", pos: "N" },
  "ⲛⲓⲙⲁⲑⲏⲧⲏⲥ": { en: "disciples", ar: "التلاميذ", pos: "N" },
  "ⲛⲙⲁⲑⲏⲧⲏⲥ": { en: "disciples", ar: "التلاميذ", pos: "N" },
  "ⲁⲡⲟⲥⲧⲟⲗⲟⲥ": { en: "apostle", ar: "رسول", pos: "N" },
  "ⲛⲓⲁⲡⲟⲥⲧⲟⲗⲟⲥ": { en: "the apostles", ar: "الرسل", pos: "N" },
  "ⲛⲁⲡⲟⲥⲧⲟⲗⲟⲥ": { en: "the apostles", ar: "الرسل", pos: "N" },
  "ⲟⲩⲱⲛϩ": { en: "life", ar: "حياة", pos: "N" },
  "ⲡⲱⲛϩ": { en: "the life", ar: "الحياة", pos: "N" },
  "ⲡⲓⲱⲛϧ": { en: "the life", ar: "الحياة", pos: "N" },
  "ⲟⲩⲱⲓⲛⲓ": { en: "light", ar: "نور", pos: "N" },
  "ⲡⲟⲩⲟⲉⲓⲛ": { en: "the light", ar: "النور", pos: "N" },
  "ⲡⲓⲟⲩⲱⲓⲛⲓ": { en: "the light", ar: "النور", pos: "N" },
  "ⲧⲁⲣⲭⲏ": { en: "beginning", ar: "البدء", pos: "N" },
  "ⲧⲉϩⲟⲩⲉⲓⲧⲉ": { en: "beginning", ar: "البدء", pos: "N" },
  "ϩⲁⲧⲉⲛ": { en: "with / near", ar: "عند", pos: "PREP" },
  "ⲛⲛⲁϩⲣⲙ": { en: "with / before", ar: "عند", pos: "PREP" }
};

export function getCopticTokenGloss(tok: string, isArabic = false): { text: string; pos: string } | null {
  if (!tok) return null;
  const clean = tok.replace(/[\.\,\;\:\-\—\(\)\[\]\⸗\·\u0300-\u036f]/g, '').trim().toLowerCase();
  
  if (COMMON_COPTIC_GLOSSES[clean]) {
    const item = COMMON_COPTIC_GLOSSES[clean];
    return { text: isArabic ? item.ar : item.en, pos: item.pos };
  }
  
  const originalClean = tok.replace(/[\.\,\;\:\-\—\(\)\[\]\⸗\·]/g, '').trim();
  if (COMMON_COPTIC_GLOSSES[originalClean]) {
    const item = COMMON_COPTIC_GLOSSES[originalClean];
    return { text: isArabic ? item.ar : item.en, pos: item.pos };
  }

  return null;
}
