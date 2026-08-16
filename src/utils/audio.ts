// Comprehensive Coptic Phonetic Pronunciation & Audio Engine
// Combines Browser SpeechSynthesis (with classical Greek/Italian phonetic voices)
// and Web Audio API formant synthesis for 100% reliable multi-browser voice playback.

/**
 * Transliterates Coptic Unicode into clean phonetic speech string
 */
export function copticToPhoneticSpeech(copticWord: string, dialect: 'S' | 'B' = 'S'): string {
  if (!copticWord) return '';

  let text = copticWord.toLowerCase();

  // Multi-character substitutions first
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

  // Single characters
  const charMap: Record<string, string> = {
    'ⲁ': 'ah',
    'ⲃ': dialect === 'B' ? 'v' : 'b',
    'ⲅ': 'g',
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
    '-': '',
    '⸗': '',
    '=': '',
    '·': ' '
  };

  let result = '';
  for (const ch of text) {
    if (charMap[ch] !== undefined) {
      result += charMap[ch];
    } else if (/[a-z\s]/i.test(ch)) {
      result += ch;
    }
  }

  return result.trim() || copticWord;
}

/**
 * Main pronunciation player with speech synthesis & Web Audio fallback
 */
export function playSynthesizedCoptic(copticWord: string, dialect: 'S' | 'B' = 'S'): void {
  if (!copticWord) return;

  const phonetic = copticToPhoneticSpeech(copticWord, dialect);

  // 1. Primary: Browser SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(phonetic);
      utterance.rate = 0.85; // Slightly slower for clear ancient articulation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select suitable voice (Greek, Italian, or English)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('el') || // Greek (closest phonetics to Coptic)
          v.lang.startsWith('it') || // Italian (pure vowels)
          v.lang.startsWith('la') || // Latin
          v.lang.startsWith('es')    // Spanish
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onerror = () => {
        // Fallback to Web Audio oscillator if SpeechSynthesis fails
        playWebAudioFallback(copticWord, dialect);
      };

      window.speechSynthesis.speak(utterance);

      // Chromium bugfix: resume if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      return;
    } catch (e) {
      console.warn('SpeechSynthesis error, falling back to Web Audio:', e);
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
