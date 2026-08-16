/**
 * Arabic Language & Text Utilities
 * Normalization, detection, and RTL direction helpers
 */

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F]/;

/**
 * Checks if a string contains any Arabic characters
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  return ARABIC_REGEX.test(text);
}

/**
 * Normalizes Arabic text for orthographic invariant search
 * - Normalizes Alef forms (أ, إ, آ, ٱ -> ا)
 * - Normalizes Yaa forms (ى -> ي)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Strips Tashkeel / Harakat diacritics
 * - Strips Tatweel / Kashida
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel
    .replace(/\u0640/g, '') // Tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}
