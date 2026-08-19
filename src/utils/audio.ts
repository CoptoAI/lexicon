// Comprehensive Coptic Phonetic Pronunciation & Audio Engine
// Supports Jinikim diacritic vocalizations, contextual phonetic rules (Gamma, Chi, Theta, Tav),
// dual Arabic & Western Text-to-Speech engines, and Web Audio API formant synthesis.

/**
 * Normalizes Coptic text and converts Jinikim diacritics into vocalic syllables
 */
function normalizeAndVocalizeCoptic(text: string): string {
  if (!text) return '';

  let normalized = text.toLowerCase();

  // Combine unicode combining characters
  // Jinikim combining characters: \u0300 (grave), \u0301 (acute), \u0307 (dot above)
  // Check consonant + jinikim patterns
  normalized = normalized.replace(/([ⲛⲙⲣⲗⲃⲕⲥⲧⲡϥϣϩϫϭⲭⲑⲫ])[\u0300\u0301\u0307`̀]/g, 'eh-$1');
  normalized = normalized.replace(/̀([ⲛⲙⲣⲗⲃⲕⲥⲧⲡϥϣϩϫϭⲭⲑⲫ])/g, 'eh-$1');

  // Strip remaining combining diacritic marks
  normalized = normalized.replace(/[\u0300-\u036f]/g, '');

  return normalized;
}

/**
 * Transliterates Coptic Unicode into clean Western IPA/Phonetic speech string
 */
export function copticToPhoneticSpeech(copticWord: string, dialect: 'S' | 'B' = 'S'): string {
  if (!copticWord) return '';

  let text = normalizeAndVocalizeCoptic(copticWord);

  // 1. Contextual Rules
  // Gamma (ⲅ): 'ng' before ⲅ, ⲕ, ⲭ, ⲝ; 'g' before ⲉ, ⲏ, ⲓ, ⲩ; 'gh' elsewhere in Bohairic
  text = text.replace(/ⲅ([ⲅⲕⲭⲝ])/g, 'ng$1');
  text = text.replace(/ⲅ([ⲉⲏⲓⲩ])/g, 'g$1');
  text = text.replace(/ⲅ/g, dialect === 'B' ? 'gh' : 'g');

  // Theta (ⲑ): 't' after ⲥ or ϣ, 'th' elsewhere
  text = text.replace(/([ⲥϣ])ⲑ/g, '$1t');
  text = text.replace(/ⲑ/g, 'th');

  // Chi (ⲭ): 'sh' before front vowels (ⲉ, ⲏ, ⲓ, ⲩ) in Bohairic, 'kh' elsewhere
  if (dialect === 'B') {
    text = text.replace(/ⲭ([ⲉⲏⲓⲩ])/g, 'sh$1');
  }
  text = text.replace(/ⲭ/g, 'kh');

  // Post-nasal Tav (ⲛⲧ): 'n-d'
  text = text.replace(/ⲛⲧ/g, 'nd');

  // Multi-character substitutions
  text = text.replace(/ⲟⲩ/g, 'oo');
  text = text.replace(/ϯ/g, dialect === 'B' ? 'dee' : 'tee');
  text = text.replace(/ⲯ/g, 'ps');
  text = text.replace(/ⲝ/g, 'ks');
  text = text.replace(/ⲫ/g, 'f');
  text = text.replace(/ϣ/g, 'sh');
  text = text.replace(/ϥ/g, 'f');
  text = text.replace(/ϧ|ⳉ/g, 'kh');
  text = text.replace(/ϩ/g, 'h');
  text = text.replace(/ϫ/g, dialect === 'B' ? 'j' : 'ch');
  text = text.replace(/ϭ/g, dialect === 'B' ? 'ch' : 'k');

  // Single characters map
  const charMap: Record<string, string> = {
    'ⲁ': 'ah',
    'ⲃ': dialect === 'B' ? 'v' : 'b',
    'ⲇ': 'd',
    'ⲉ': 'eh',
    'ⲍ': 'z',
    'ⲏ': 'ay',
    'ⲓ': 'ee',
    'ⲕ': 'k',
    'ⲗ': 'l',
    'ⲙ': 'm',
    'ⲛ': 'n',
    'ⲟ': 'o',
    'ⲡ': 'p',
    'ⲣ': 'r',
    'ⲥ': 's',
    'ⲧ': 't',
    'ⲩ': 'oo',
    'ⲱ': 'oh',
    '-': ' ',
    '⸗': '',
    '=': '',
    '·': ' '
  };

  let result = '';
  for (const ch of text) {
    if (charMap[ch] !== undefined) {
      result += charMap[ch];
    } else if (/[a-z\s-]/i.test(ch)) {
      result += ch;
    }
  }

  return result.replace(/\s+/g, ' ').trim() || copticWord;
}

/**
 * Transliterates Coptic into natural Arabic phonetic string for Arabic TTS engines
 */
export function copticToArabicPhoneticSpeech(copticWord: string, dialect: 'S' | 'B' = 'S'): string {
  if (!copticWord) return '';

  let text = normalizeAndVocalizeCoptic(copticWord);

  text = text.replace(/ⲅ([ⲅⲕⲭⲝ])/g, 'نج$1');
  text = text.replace(/ⲅ([ⲉⲏⲓⲩ])/g, 'ج$1');
  text = text.replace(/ⲅ/g, dialect === 'B' ? 'غ' : 'ج');

  text = text.replace(/([ⲥϣ])ⲑ/g, '$1ت');
  text = text.replace(/ⲑ/g, 'ث');
  text = text.replace(/ⲛⲧ/g, 'ند');

  text = text.replace(/ⲟⲩ/g, 'و');
  text = text.replace(/ϯ/g, 'تي');
  text = text.replace(/ⲯ/g, 'بس');
  text = text.replace(/ⲝ/g, 'كس');
  text = text.replace(/ⲫ/g, 'ف');
  text = text.replace(/ϣ/g, 'ش');
  text = text.replace(/ϥ/g, 'ف');
  text = text.replace(/ϧ|ⳉ/g, 'خ');
  text = text.replace(/ϩ/g, 'ح');
  text = text.replace(/ϫ/g, dialect === 'B' ? 'ج' : 'تش');
  text = text.replace(/ϭ/g, dialect === 'B' ? 'تش' : 'ك');

  const arCharMap: Record<string, string> = {
    'ⲁ': 'ا',
    'ⲃ': dialect === 'B' ? 'ڤ' : 'ب',
    'ⲇ': 'د',
    'ⲉ': 'إ',
    'ⲍ': 'ز',
    'ⲏ': 'ي',
    'ⲓ': 'ي',
    'ⲕ': 'ك',
    'ⲗ': 'ل',
    'ⲙ': 'م',
    'ⲛ': 'ن',
    'ⲟ': 'و',
    'ⲡ': 'ب',
    'ⲣ': 'ر',
    'ⲥ': 'س',
    'ⲧ': 'ت',
    'ⲩ': 'و',
    'ⲱ': 'و',
    'e': 'إ',
    'h': 'هـ'
  };

  let result = '';
  for (const ch of text) {
    if (arCharMap[ch] !== undefined) {
      result += arCharMap[ch];
    } else if (/[\u0600-\u06FF\s]/i.test(ch)) {
      result += ch;
    }
  }

  return result.trim() || copticWord;
}

/**
 * Main pronunciation player with multi-lingual SpeechSynthesis & Web Audio fallback
 */
export function playSynthesizedCoptic(
  copticWord: string,
  dialect: 'S' | 'B' = 'S',
  playbackRate: number = 0.85
): void {
  if (!copticWord) return;

  const westernPhonetic = copticToPhoneticSpeech(copticWord, dialect);
  const arabicPhonetic = copticToArabicPhoneticSpeech(copticWord, dialect);

  // 1. Primary: Browser SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Clear queue

      const voices = window.speechSynthesis.getVoices();

      // Find best matching voice
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      const westernVoice = voices.find(
        v => v.lang.startsWith('el') || v.lang.startsWith('it') || v.lang.startsWith('la') || v.lang.startsWith('es')
      ) || voices.find(v => v.lang.startsWith('en'));

      let speechText = westernPhonetic;
      let selectedVoice = westernVoice;

      // On devices with Arabic voice selected or default Arabic locale, use Arabic phonetic speech
      if (arabicVoice && (!westernVoice || navigator.language.startsWith('ar'))) {
        speechText = arabicPhonetic;
        selectedVoice = arabicVoice;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = playbackRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onerror = () => {
        playWebAudioFallback(copticWord, dialect);
      };

      window.speechSynthesis.speak(utterance);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      return;
    } catch (e) {
      console.warn('SpeechSynthesis failed, using Web Audio fallback:', e);
    }
  }

  // 2. Fallback: Web Audio Formant Synthesizer
  playWebAudioFallback(copticWord, dialect);
}

/**
 * Web Audio API Formant Synthesizer Fallback
 */
function playWebAudioFallback(copticWord: string, dialect: 'S' | 'B' = 'S'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    masterGain.connect(ctx.destination);

    const baseFreq = dialect === 'B' ? 140 : 150;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 3.0;

    osc.connect(filter);
    filter.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    console.error('Web Audio playback failed:', err);
  }
}
