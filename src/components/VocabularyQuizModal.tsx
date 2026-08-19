import React, { useState, useEffect } from 'react';
import { X, Sparkles, Volume2, RotateCw, CheckCircle2, XCircle, Trophy, BookOpen, Award, ArrowRight, ChevronLeft, GraduationCap } from 'lucide-react';
import { playSynthesizedCoptic } from '../utils/audio';

interface QuizWord {
  id: number;
  coptic: string;
  translit: string;
  dialect: string;
  pos: string;
  en: string;
  ar: string;
  exampleCoptic: string;
  exampleRef: string;
}

const TOP_BIBLICAL_QUIZ_WORDS: QuizWord[] = [
  { id: 1, coptic: "ⲡⲛⲟⲩⲧⲉ", translit: "p-noute", dialect: "S", pos: "N", en: "God", ar: "الله", exampleCoptic: "ⲀⲨⲰ ⲚⲈⲨⲚⲞⲨⲦⲈ ⲠⲈ ⲠϢⲀϪⲈ", exampleRef: "John 1:1" },
  { id: 2, coptic: "ⲫϯ", translit: "ph-nouti", dialect: "B", pos: "N", en: "God", ar: "الله", exampleCoptic: "ⲟⲩⲟϩ ⲛⲉ ⲟⲩⲛⲟⲩϯ ⲡⲉ ⲡⲓⲥⲁϫⲓ", exampleRef: "John 1:1" },
  { id: 3, coptic: "ⲡϣⲁϫⲉ", translit: "p-shaje", dialect: "S", pos: "N", en: "the Word", ar: "الكلمة", exampleCoptic: "ϨⲚ ⲦⲈϨⲞⲨⲈⲒⲦⲈ ⲚⲈϤϢⲞⲞⲠ ⲚϬⲒ ⲠϢⲀϪⲈ", exampleRef: "John 1:1" },
  { id: 4, coptic: "ⲡⲓⲥⲁϫⲓ", translit: "pi-saji", dialect: "B", pos: "N", en: "the Word", ar: "الكلمة", exampleCoptic: "ϧⲉⲛ ⳿ⲧⲁⲣⲭⲏ ⲛⲉ ⲡⲓⲥⲁϫⲓ ⲡⲉ", exampleRef: "John 1:1" },
  { id: 5, coptic: "ⲁⲅⲁⲡⲏ", translit: "agapē", dialect: "S/B", pos: "N", en: "love", ar: "محبة", exampleCoptic: "ⲠⲚⲞⲨⲦⲈ ⲦⲈ ⲦⲀⲄⲀⲠⲎ", exampleRef: "1 John 4:8" },
  { id: 6, coptic: "ⲓⲏⲥⲟⲩⲥ", translit: "Iēsous", dialect: "S/B", pos: "N", en: "Jesus", ar: "يسوع", exampleCoptic: "ⲒⲎⲤⲞⲨⲤ ⲠⲈⲬⲢⲒⲤⲦⲞⲤ", exampleRef: "Mark 1:1" },
  { id: 7, coptic: "ⲡⲛⲉⲩⲙⲁ", translit: "pneuma", dialect: "S/B", pos: "N", en: "Spirit", ar: "الروح", exampleCoptic: "ⲠⲠⲚⲈⲨⲘⲀ ⲈⲦⲞⲨⲀⲀⲂ", exampleRef: "Luke 1:15" },
  { id: 8, coptic: "ⲟⲩⲱⲛϩ", translit: "ōnh", dialect: "S", pos: "N", en: "life", ar: "حياة", exampleCoptic: "ⲚⲈⲢⲈ ⲠⲰⲚϨ ϢⲞⲞⲠ ⲚϨⲎⲦϤ", exampleRef: "John 1:4" },
  { id: 9, coptic: "ⲟⲩⲱⲓⲛⲓ", translit: "ouoini", dialect: "B", pos: "N", en: "light", ar: "نور", exampleCoptic: "ⲟⲩⲟϩ ⲡⲓⲟⲩⲱⲓⲛⲓ ϧⲉⲛ ⲡⲓⲕⲁⲕⲓ ⲣⲓⲟⲩⲱⲓⲛⲓ", exampleRef: "John 1:5" },
  { id: 10, coptic: "ⲥⲱⲧⲡ", translit: "sōtp", dialect: "S/B", pos: "V", en: "to choose / elect", ar: "يختار / ينقي", exampleCoptic: "ⲀϤⲤⲰⲦⲠ ⲘⲘⲞⲞⲨ", exampleRef: "Luke 6:13" },
  { id: 11, coptic: "ⲙⲁⲑⲏⲧⲏⲥ", translit: "mathētēs", dialect: "S/B", pos: "N", en: "disciple", ar: "تلميذ", exampleCoptic: "ⲚⲈϤⲘⲀⲐⲎⲦⲎⲤ", exampleRef: "Matthew 10:1" },
  { id: 12, coptic: "ⲁⲡⲟⲥⲧⲟⲗⲟⲥ", translit: "apostolos", dialect: "S/B", pos: "N", en: "apostle", ar: "رسول", exampleCoptic: "ⲚⲒⲀⲠⲞⲤⲦⲞⲖⲞⲤ ⲒⲂ", exampleRef: "Matthew 10:2" },
  { id: 13, coptic: "ⲉⲕⲕⲗⲏⲥⲓⲁ", translit: "ekklēsia", dialect: "S/B", pos: "N", en: "church / assembly", ar: "كنيسة / جماعة", exampleCoptic: "ⲦⲈⲔⲔⲖⲎⲤⲒⲀ ⲘⲠⲚⲞⲨⲦⲈ", exampleRef: "1 Corinthians 10:32" },
  { id: 14, coptic: "ⲉⲓⲣⲏⲛⲏ", translit: "eirēnē", dialect: "S/B", pos: "N", en: "peace", ar: "سلام", exampleCoptic: "ⲦⲈⲒⲢⲎⲚⲎ ⲘⲠⲈⲬⲢⲒⲤⲦⲞⲤ", exampleRef: "Colossians 3:15" },
  { id: 15, coptic: "ⲇⲓⲕⲁⲓⲟⲥⲩⲛⲏ", translit: "dikaiosynē", dialect: "S/B", pos: "N", en: "righteousness", ar: "بر", exampleCoptic: "ⲦⲆⲒⲔⲀⲒⲞⲤⲨⲚⲎ ⲘⲠⲚⲞⲨⲦⲈ", exampleRef: "Matthew 6:33" }
];

interface VocabularyQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabicUi?: boolean;
}

export const VocabularyQuizModal: React.FC<VocabularyQuizModalProps> = ({
  isOpen,
  onClose,
  isArabicUi = false
}) => {
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const currentWord = TOP_BIBLICAL_QUIZ_WORDS[currentIndex];

  // Generate 4 multiple choice options
  useEffect(() => {
    if (mode === 'quiz' && currentWord) {
      const correctAnswer = isArabicUi ? currentWord.ar : currentWord.en;
      const otherAnswers = TOP_BIBLICAL_QUIZ_WORDS
        .filter(w => w.id !== currentWord.id)
        .map(w => (isArabicUi ? w.ar : w.en));

      // Shuffle 3 distractors
      const shuffledDistractors = [...otherAnswers].sort(() => 0.5 - Math.random()).slice(0, 3);
      const allOptions = [...shuffledDistractors, correctAnswer].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [currentIndex, mode, isArabicUi]);

  if (!isOpen) return null;

  const handleNextWord = () => {
    setIsFlipped(false);
    if (currentIndex < TOP_BIBLICAL_QUIZ_WORDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (mode === 'quiz') {
        setQuizCompleted(true);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const handlePrevWord = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    const correctAnswer = isArabicUi ? currentWord.ar : currentWord.en;
    if (opt === correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dialect = currentWord.dialect.includes('B') ? 'B' : 'S';
    playSynthesizedCoptic(currentWord.coptic, dialect);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container quiz-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-title-box">
            <GraduationCap className="quiz-icon" />
            <div>
              <h2>{isArabicUi ? 'تدريب مفردات العهد الجديد' : 'Coptic Biblical Vocabulary Trainer'}</h2>
              <p>{isArabicUi ? 'بطاقات استذكار واختبارات تفاعلية لأهم كلمات الكتاب المقدس' : 'Flashcards & interactive quizzes for key New Testament words'}</p>
            </div>
          </div>

          <div className="quiz-mode-toggles">
            <button
              type="button"
              className={`quiz-tab-btn ${mode === 'flashcards' ? 'active' : ''}`}
              onClick={() => { setMode('flashcards'); handleRestartQuiz(); }}
            >
              <BookOpen size={16} />
              <span>{isArabicUi ? 'بطاقات استذكار' : 'Flashcards'}</span>
            </button>

            <button
              type="button"
              className={`quiz-tab-btn ${mode === 'quiz' ? 'active' : ''}`}
              onClick={() => { setMode('quiz'); handleRestartQuiz(); }}
            >
              <Award size={16} />
              <span>{isArabicUi ? 'اختبار تفاعلي' : 'Quiz Challenge'}</span>
            </button>

            <button type="button" className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="quiz-body">
          {mode === 'flashcards' ? (
            /* Mode 1: Flashcards */
            <div className="flashcard-view">
              <div className="flashcard-progress">
                <span>{isArabicUi ? `الكلمة ${currentIndex + 1} من ${TOP_BIBLICAL_QUIZ_WORDS.length}` : `Word ${currentIndex + 1} of ${TOP_BIBLICAL_QUIZ_WORDS.length}`}</span>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((currentIndex + 1) / TOP_BIBLICAL_QUIZ_WORDS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Flip Card Container */}
              <div
                className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-inner">
                  {/* Front Side */}
                  <div className="flashcard-front">
                    <span className="card-hint-badge">{isArabicUi ? 'انقر لقلب البطاقة' : 'Click to flip card'}</span>
                    <h1 className="coptic-word-large coptic-font">{currentWord.coptic}</h1>
                    <span className="coptic-translit-text">{currentWord.translit}</span>

                    <div className="card-meta-row">
                      <span className="meta-badge dialect">{currentWord.dialect === 'S' ? 'Ϩ Sahidic' : currentWord.dialect === 'B' ? 'Ϧ Bohairic' : 'Ϩ/Ϧ Both'}</span>
                      <span className="meta-badge pos">{currentWord.pos}</span>
                      <button type="button" className="audio-play-btn" onClick={handlePlayAudio} title="Listen">
                        <Volume2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flashcard-back">
                    <span className="card-hint-badge back">{isArabicUi ? 'المعنى في القاموس' : 'Lexicon Definition'}</span>
                    <h2 className="translation-heading">{isArabicUi ? currentWord.ar : currentWord.en}</h2>

                    <div className="example-verse-box">
                      <span className="verse-ref-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <BookOpen size={12} />
                        <span>{currentWord.exampleRef}</span>
                      </span>
                      <p className="verse-coptic-text coptic-font">{currentWord.exampleCoptic}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flashcard-controls">
                <button
                  type="button"
                  className="quiz-action-btn secondary"
                  onClick={handlePrevWord}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={16} />
                  <span>{isArabicUi ? 'السابق' : 'Previous'}</span>
                </button>

                <button
                  type="button"
                  className="quiz-action-btn"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <RotateCw size={16} />
                  <span>{isArabicUi ? 'قلب البطاقة' : 'Flip Card'}</span>
                </button>

                <button
                  type="button"
                  className="quiz-action-btn primary"
                  onClick={handleNextWord}
                >
                  <span>{isArabicUi ? 'التالي' : 'Next'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : quizCompleted ? (
            /* Quiz Completed Score Summary */
            <div className="quiz-results-card">
              <Trophy size={64} className="trophy-gold-icon" />
              <h2>{isArabicUi ? 'اكتمل الاختبار!' : 'Quiz Completed!'}</h2>
              <p className="score-summary-text">
                {isArabicUi
                  ? `أجبت بشكل صحيح على ${quizScore} من ${TOP_BIBLICAL_QUIZ_WORDS.length} كلمة!`
                  : `You scored ${quizScore} out of ${TOP_BIBLICAL_QUIZ_WORDS.length}!`}
              </p>
              <div className="score-percentage-badge">
                {Math.round((quizScore / TOP_BIBLICAL_QUIZ_WORDS.length) * 100)}%
              </div>

              <button type="button" className="quiz-action-btn primary large" onClick={handleRestartQuiz}>
                <RotateCw size={18} />
                <span>{isArabicUi ? 'إعادة الاختبار' : 'Try Again'}</span>
              </button>
            </div>
          ) : (
            /* Mode 2: Quiz Challenge */
            <div className="quiz-challenge-view">
              <div className="quiz-progress-row">
                <span className="quiz-question-badge">
                  {isArabicUi ? `السؤال ${currentIndex + 1} من ${TOP_BIBLICAL_QUIZ_WORDS.length}` : `Question ${currentIndex + 1} of ${TOP_BIBLICAL_QUIZ_WORDS.length}`}
                </span>
                <span className="quiz-score-live">
                  {isArabicUi ? `النتيجة: ${quizScore}` : `Score: ${quizScore}`}
                </span>
              </div>

              {/* Question Card */}
              <div className="quiz-question-card">
                <span className="question-label">{isArabicUi ? 'ما هو معنى الكلمة القبطية التالية؟' : 'What is the meaning of this Coptic word?'}</span>
                <h1 className="coptic-question-word coptic-font">{currentWord.coptic}</h1>
                <button type="button" className="audio-play-btn" onClick={handlePlayAudio}>
                  <Volume2 size={20} />
                </button>
              </div>

              {/* Multiple Choice Options */}
              <div className="quiz-options-grid">
                {options.map((opt, idx) => {
                  const correctAnswer = isArabicUi ? currentWord.ar : currentWord.en;
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === correctAnswer;

                  let optClass = 'quiz-option-btn';
                  if (isAnswered) {
                    if (isCorrect) optClass += ' correct';
                    else if (isSelected && !isCorrect) optClass += ' incorrect';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={optClass}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && <CheckCircle2 size={20} className="icon-correct" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="icon-incorrect" />}
                    </button>
                  );
                })}
              </div>

              {/* Next Question Footer */}
              {isAnswered && (
                <div className="quiz-answer-footer">
                  <div className="answer-feedback">
                    {selectedOption === (isArabicUi ? currentWord.ar : currentWord.en) ? (
                      <span className="feedback-text success">✓ {isArabicUi ? 'إجابة صحيحة ممتاز!' : 'Correct answer! Excellent!'}</span>
                    ) : (
                      <span className="feedback-text error">✗ {isArabicUi ? `الإجابة الصحيحة هي: ${isArabicUi ? currentWord.ar : currentWord.en}` : `Correct answer is: ${currentWord.en}`}</span>
                    )}
                  </div>

                  <button type="button" className="quiz-action-btn primary" onClick={handleNextWord}>
                    <span>{isArabicUi ? 'السؤال التالي' : 'Next Question'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
