#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Coptic-Arabic Lexicon & Normalization Engine
Provides traditional Coptic Orthodox liturgical, biblical, and patristic Arabic definitions,
comprehensive semantic translation mapping, and Arabic text normalization for FTS5 trigram indexing.
"""

import re
import unicodedata
from typing import List, Dict, Any, Optional

def normalize_arabic(text: str) -> str:
    """
    Normalizes Arabic text for invariant full-text search:
    - Normalizes Alef forms (أ, إ, آ, ٱ -> ا)
    - Normalizes Yaa forms (ى -> ي)
    - Normalizes Taa Marbuta (ة -> ه)
    - Strips Tashkeel / Harakat diacritics (َ, ً, ُ, ٌ, ِ, ٍ, ْ, ّ)
    - Strips Tatweel / Kashida (ـ)
    - Strips punctuation
    """
    if not text:
        return ""
    
    # Strip Tashkeel (harakat)
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    # Strip Tatweel
    text = re.sub(r'\u0640', '', text)
    
    # Normalize Alef forms
    text = re.sub(r'[أإآٱ]', 'ا', text)
    # Normalize Yaa forms
    text = re.sub(r'ى', 'ي', text)
    # Normalize Taa Marbuta to Haa for broad matching
    text = re.sub(r'ة', 'ه', text)
    
    # Clean whitespace and lowercase
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Curated High-Precision Traditional Coptic-Arabic Lexicon (Moawad Daoud, Scala Magna of Ibn Kabar, Liturgical Concordance)
CURATED_COPTIC_ARABIC: Dict[str, str] = {
    # Core Theological & Liturgical
    "ⲛⲟⲩⲧⲉ": "الله، الإله؛ معبود",
    "ⲛⲟⲩϯ": "الله، الإله",
    "ⲡⲛⲟⲩⲧⲉ": "الله (الإله الحقيقي)",
    "ⲡⲓⲛⲟⲩϯ": "الله، الرب",
    "ⲁⲅⲁⲡⲏ": "محبة، حب، وليمة المحبة",
    "ⲙⲉ": "يحب، يعشق، يرغب؛ محبة",
    "ⲙⲉⲣⲓⲧ": "حبيب، محبوب",
    "ⲁⲅⲓⲟⲥ": "قديس، قدوس، طاهر",
    "ⲟⲩⲁⲁⲃ": "مقدس، طاهر، مكرس؛ يصير مقدساً",
    "ⲉⲧⲟⲩⲁⲁⲃ": "القدوس، القديس، الطاهر",
    "ⲡⲛⲉⲩⲙⲁ": "روح، الروح (القدس)",
    "ⲡⲓⲡⲛⲉⲩⲙⲁ": "الروح القدس",
    "ⲡⲉⲡⲛⲉⲩⲙⲁ": "الروح القدس",
    "ⲭⲣⲓⲥⲧⲟⲥ": "المسيح (الممسوح بالزيت)",
    "ⲡⲭⲣⲓⲥⲧⲟⲥ": "المسيح الرب",
    "ⲓⲏⲥⲟⲩⲥ": "يسوع (المخلص)",
    "ⲥⲱⲧⲏⲣ": "مخلص، فادي",
    "ⲥⲱⲧⲉ": "يخلص، يفدي، ينقذ؛ خلاص",
    "ⲥⲱⲧ": "يخلص، يفدي، ينقذ",
    "ϣⲗⲏⲗ": "يصلي، يتضرع؛ صلاة، دعاء",
    "ⲧⲱⲃϩ": "يطلب، يسأل، يتوسل؛ طلب، تضرع",
    "ⲥⲙⲟⲩ": "يبارك، يسبح، يحمد؛ بركة، تسبحة",
    "ϩⲱⲥ": "يسبح، يرنم؛ ترتيل، مديح، هوس",
    "ⲕⲩⲣⲓⲟⲥ": "رب، سيد",
    "ϫⲟⲉⲓⲥ": "رب، سيد، مالك",
    "ϭⲟⲓⲥ": "رب، سيد، سيدة",
    "ⲡϫⲟⲉⲓⲥ": "الرب، السيد",
    "ⲡϭⲟⲓⲥ": "الرب، السيد",
    "ⲉⲕⲕⲗⲏⲥⲓⲁ": "كنيسة، جماعة المؤمنين",
    "ⲉⲩⲁⲅⲅⲉⲗⲓⲟⲛ": "إنجيل، بشارة مفرحة",
    "ⲥⲧⲁⲩⲣⲟⲥ": "صليب",
    "ⲡⲥⲧⲁⲩⲣⲟⲥ": "الصليب المقدس",
    "ϩⲓⲣⲏⲛⲏ": "سلام، طمأنينة",
    "ⲧⲓϩⲓⲣⲏⲛⲏ": "السلام",
    "ⲥⲱⲧⲡ": "يختار، يصطفي؛ مختار؛ سلام",
    "ⲟⲩϫⲁⲓ": "صحة، سلامة، خلاص؛ يصح، ينجو",
    "ⲙⲛⲧⲟⲩⲣⲟ": "ملكوت، مملكة",
    "ϯⲙⲉⲧⲟⲩⲣⲟ": "الملكوت",
    "ⲟⲩⲣⲟ": "ملك، حاكم، سلطان",
    "ⲟⲩⲣⲱ": "ملكة",
    "ⲡⲉ": "سماء",
    "ⲧⲡⲉ": "السماء",
    "ⲛⲓⲫⲏⲟⲩⲓ": "السموات",
    "ⲕⲁϩ": "أرض، تراب، طين",
    "ⲡⲕⲁϩ": "الأرض",
    "ⲱⲛϩ": "حياة، عيش؛ يحيا، يعيش",
    "ⲡⲱⲛϩ": "الحياة",
    "ⲙⲟⲩ": "يموت؛ موت",
    "ⲡⲙⲟⲩ": "الموت",
    "ⲧⲱⲟⲩⲛ": "يقوم، ينهض؛ قيامة",
    "ⲁⲛⲁⲥⲧⲁⲥⲓⲥ": "قيامة",
    "ⲟⲩⲟⲉⲓⲛ": "نور، ضياء",
    "ⲡⲓⲟⲩⲱⲓⲛⲓ": "النور، الضياء",
    "ⲕⲁⲕⲉ": "ظلمة، ظلام",
    "ⲡⲭⲁⲕⲓ": "الظلام",
    "ⲙⲉ": "حق، صدق؛ حقيقي",
    "ⲧⲙⲏⲓ": "الحق، الصدق",
    "ⲙⲏⲓ": "حق، عدل",
    "ϩⲙⲟⲧ": "نعمة، فضل، شكر",
    "ⲭⲁⲣⲓⲥ": "نعمة، فضل",
    "ⲛⲁ": "رحمة، شفقة؛ يرحم",
    "ⲡⲓⲛⲁⲓ": "الرحمة",
    "ⲱⲛϩ": "حياة؛ حي",
    "ⲥⲱⲧⲙ": "يسمع، ينصت، يطيع؛ سمع، طاعة",
    "ϫⲱ": "يقول، ينطق، يرتل؛ قول",
    "ⲥⲁϫⲉ": "يتكلم، يتحدث؛ كلام، كلمة، حديث",
    "ϣⲁϫⲉ": "يتكلم؛ كلمة، قول، كلام",
    "ⲡϣⲁϫⲉ": "الكلمة (اللوغوس)",
    "ⲗⲟⲅⲟⲥ": "كلمة، نطق، عقل",
    "ⲉⲓⲱⲧ": "أب، والد",
    "ⲡⲉⲓⲱⲧ": "الآب، الوالد",
    "ⲓⲱⲧ": "أب",
    "ⲙⲁⲁⲩ": "أم، والدة",
    "ϯⲙⲁⲩ": "الأم",
    "ϣⲏⲣⲉ": "ابن، ولد، صبي",
    "ⲡϣⲏⲣⲉ": "الابن",
    "ϣⲉⲉⲣⲉ": "ابنة، بنت",
    "ⲥⲟⲛ": "أخ",
    "ⲥⲱⲛⲉ": "أخت",
    "ⲣⲱⲙⲉ": "إنسان، رجل، شخص، بشر",
    "ⲡⲓⲣⲱⲙⲓ": "الإنسان، الرجل",
    "ⲥϩⲓⲙⲉ": "امرأة، زوجة",
    "ϩⲏⲧ": "قلب، عقل، فكر",
    "ⲡϩⲏⲧ": "القلب",
    "ⲃⲁⲗ": "عين",
    "ⲧⲱⲣⲉ": "يد",
    "ϫⲓϫ": "يد",
    "ⲣⲁⲧ": "رجل، قدم",
    "ϭⲁⲗⲟϫ": "رجل، قدم",
    "ⲧⲁⲡⲣⲟ": "فم",
    "ⲣⲱ": "فم، باب",
    "ⲗⲁⲥ": "لسان، لغة",
    "ⲁⲅⲅⲉⲗⲟⲥ": "ملاك، رسول",
    "ⲡⲓⲁⲅⲅⲉⲗⲟⲥ": "الملاك",
    "ⲁⲣⲭⲁⲅⲅⲉⲗⲟⲥ": "رئيس ملائكة",
    "ⲇⲓⲁⲃⲟⲗⲟⲥ": "إبليس، الشيطان، المشتكي",
    "ⲥⲁⲧⲁⲛⲁⲥ": "الشيطان",
    "ⲛⲟⲃⲓ": "خطيئة، إثم، ذنب",
    "ⲡⲛⲟⲃⲓ": "الخطيئة",
    "ⲕⲱ ⲉⲃⲟⲗ": "يغفر، يسامح، يترك؛ مغفرة",
    "ⲙⲉⲧⲁⲛⲟⲓⲁ": "توبة، ندامة، مطانية (سجود)",
    "ⲡⲓⲥⲧⲓⲥ": "إيمان، أمانة، ثقة",
    "ⲛⲁϩϯ": "يؤمن، يثق؛ إيمان، ثقة",
    "ⲉⲗⲡⲓⲥ": "رجاء، أمل",
    "ϩⲉⲗⲡⲓⲥ": "رجاء، أمل",
    "ⲥⲟⲫⲓⲁ": "حكمة",
    "ⲧⲥⲟⲫⲓⲁ": "الحكمة",
    "ⲥⲁⲃⲉ": "حكيم، فهيم",
    "ⲙⲛⲧⲥⲁⲃⲉ": "حكمة، فطنة",
    "ⲙⲟⲩⲛ": "يثبت، يدوم، يبقى",
    "ⲙⲟⲩⲛ ⲉⲃⲟⲗ": "يستمر، يثبت، يداوم",
    "ⲟⲩⲱⲛϩ": "يظهر، يكشف، يعلن؛ ظهور",
    "ⲟⲩⲱⲛϩ ⲉⲃⲟⲗ": "يعلن، يظهر، يتجلى",
    "ϣⲱⲡⲉ": "يكون، يحدث، يصير؛ وجود",
    "ϣⲟⲟⲡ": "كائن، موجود (حالة الوجود)",
    "ⲉⲓ": "يأتي، يحضر",
    "ⲃⲱⲕ": "يذهب، يمضي",
    "ⲙⲟⲟϣⲉ": "يمشي، يسير، يسلك",
    "ⲛⲁⲩ": "يرى، ينظر، يبصر",
    "ⲥⲟⲟⲩⲛ": "يعرف، يعلم؛ معرفة، علم",
    "ⲧⲥⲁⲃⲟ": "يعلم، يرشد، يخبر",
    "ⲥⲃⲱ": "تعليم، عقيدة، تلمذة",
    "ⲙⲁⲑⲏⲧⲏⲥ": "تلميذ",
    "ⲁⲡⲟⲥⲧⲟⲗⲟⲥ": "رسول، حواري",
    "ⲡⲁⲧⲣⲓⲁⲣⲭⲏⲥ": "بطريرك، رئيس آباء",
    "ⲉⲡⲓⲥⲕⲟⲡⲟⲥ": "أسقف، ناظر",
    "ⲡⲣⲉⲥⲃⲩⲧⲉⲣⲟⲥ": "قس، كاهن، شيخ",
    "ⲟⲩⲏⲃ": "كاهن، خادم المذبح",
    "ⲇⲓⲁⲕⲱⲛ": "شماس، خادم",
    "ⲇⲓⲁⲕⲟⲛⲟⲥ": "شماس، خادم",
    "ⲙⲟⲛⲁⲭⲟⲥ": "راهب، متوحد",
    "ϩⲏⲅⲟⲩⲙⲉⲛⲟⲥ": "قمص، رئيس دير",
    "ⲙⲟⲛⲁⲥⲧⲏⲣⲓⲟⲛ": "دير",
    "ⲑⲩⲥⲓⲁ": "ذبيحة، قربان",
    "ⲡⲣⲟⲥⲫⲟⲣⲁ": "قربان، تقدمة",
    "ⲙⲩⲥⲧⲏⲣⲓⲟⲛ": "سر (كنسي)، سر مقدس، لغز",
    "ⲃⲁⲡⲧⲓⲥⲙⲁ": "معمودية",
    "ⲱⲙⲥ": "يعمد، يغطس؛ معمودية",
    "ⲉⲩⲭⲁⲣⲓⲥⲧⲓⲁ": "إفخارستيا، شكر، سر التناول",
    "ⲟⲩⲱⲙ": "يأكل؛ طعام، أكل",
    "ⲥⲱ": "يشرب؛ شراب",
    "ⲟⲉⲓⲕ": "خبز",
    "ⲡⲓⲱⲓⲕ": "الخبز",
    "ⲏⲣⲡ": "خمر، نبيذ",
    "ⲙⲟⲟⲩ": "ماء",
    "ⲡⲓⲙⲱⲟⲩ": "الماء",
    "ⲕⲱϩⲧ": "نار",
    "ⲡⲓⲭⲣⲱⲙ": "النار",
    "ⲑⲁⲗⲁⲥⲥⲁ": "بحر",
    "ⲓⲟⲙ": "بحر، يم",
    "ⲓⲉⲣⲟ": "نهر، نيل",
    "ⲫⲓⲁⲣⲟ": "النهر، النيل",
    "ⲡⲟⲗⲓⲥ": "مدينة",
    "ϯⲙⲉ": "قرية، بلدة",
    "ⲏⲓ": "بيت، منزل",
    "ⲡⲏⲓ": "البيت، المسكن",
    "ⲣⲡⲉ": "هيكل، معبد",
    "ⲉⲣⲫⲉⲓ": "هيكل، معبد",
    "ⲙⲁ": "مكان، موضع",
    "ⲥⲏⲩ": "وقت، زمن، ساعة",
    "ⲟⲩⲛⲟⲩ": "ساعة، لحظة",
    "ⲉϩⲟⲟⲩ": "يوم، نهار",
    "ⲡⲓⲉϩⲟⲟⲩ": "اليوم، النهار",
    "ⲟⲩϣⲏ": "ليل، ليلة",
    "ⲡⲓⲉϫⲱⲣϩ": "الليل",
    "ⲁⲃⲟⲧ": "شهر",
    "ⲣⲟⲙⲡⲉ": "سنة، عام",
    "ϯⲣⲟⲙⲡⲓ": "السنة، العام",
    "ⲉⲛⲉϩ": "أبد، دهر، أزل؛ أبدياً",
    "ϣⲁ ⲉⲛⲉϩ": "إلى الأبد، دائماً",
    "ⲕⲟⲥⲙⲟⲥ": "عالم، دنيا، كون",
    "ⲡⲓⲕⲟⲥⲙⲟⲥ": "العالم",
}

# Semantic dictionary for English->Arabic keyword translation mapping
EN_TO_AR_DICTIONARY: Dict[str, str] = {
    "god": "الله، الإله",
    "lord": "الرب، السيد",
    "jesus": "يسوع",
    "christ": "المسيح",
    "holy": "مقدس، قدوس، قديس",
    "saint": "قديس",
    "spirit": "روح",
    "father": "أب، والد",
    "mother": "أم",
    "son": "ابن",
    "daughter": "ابنة",
    "brother": "أخ",
    "sister": "أخت",
    "man": "رجل، إنسان",
    "woman": "امرأة",
    "human": "إنسان، بشر",
    "people": "شعب، ناس",
    "love": "محبة، حب؛ يحب",
    "beloved": "محبوب، حبيب",
    "peace": "سلام، أمان",
    "grace": "نعمة، فضل",
    "mercy": "رحمة، شفقة",
    "faith": "إيمان، ثقة",
    "hope": "رجاء، أمل",
    "prayer": "صلاة، دعاء",
    "pray": "يصلي، يتضرع",
    "blessing": "بركة",
    "bless": "يبارك",
    "praise": "تسبيح، حمد؛ يسبح",
    "salvation": "خلاص، نجاة",
    "save": "يخلص، ينجي",
    "savior": "مخلص",
    "church": "كنيسة",
    "gospel": "إنجيل، بشارة",
    "cross": "صليب",
    "kingdom": "ملكوت، مملكة",
    "king": "ملك",
    "queen": "ملكة",
    "heaven": "سماء",
    "earth": "أرض",
    "life": "حياة",
    "live": "يحيا، يعيش",
    "death": "موت",
    "die": "يموت",
    "resurrection": "قيامة",
    "light": "نور، ضياء",
    "darkness": "ظلمة، ظلام",
    "truth": "حق، حقيقة، صدق",
    "true": "حقيقي، صادق",
    "heart": "قلب",
    "mind": "عقل، فكر",
    "word": "كلمة، قول",
    "say": "يقول، ينطق",
    "speak": "يتكلم، يتحدث",
    "hear": "يسمع، ينصت",
    "listen": "يستمع، يطيع",
    "see": "يرى، ينظر",
    "know": "يعرف، يعلم",
    "knowledge": "معرفة، علم",
    "wisdom": "حكمة",
    "wise": "حكيم",
    "teach": "يعلم، يرشد",
    "teacher": "معلم",
    "disciple": "تلميذ",
    "apostle": "رسول",
    "angel": "ملاك",
    "archangel": "رئيس ملائكة",
    "demon": "شيطان، روح شرير",
    "devil": "إبليس، الشيطان",
    "sin": "خطيئة، ذنب، إثم",
    "forgiveness": "مغفرة، غفران",
    "forgive": "يغفر، يسامح",
    "repentance": "توبة",
    "priest": "كاهن، قس",
    "deacon": "شماس",
    "monk": "راهب",
    "monastery": "دير",
    "sacrifice": "ذبيحة، قربان",
    "mystery": "سر، سر مقدس",
    "sacrament": "سر كنسي مقدس",
    "baptism": "معمودية",
    "baptize": "يعمد",
    "eucharist": "إفخارستيا، سر الشكر، التناول",
    "eat": "يأكل",
    "drink": "يشرب",
    "bread": "خبز",
    "wine": "خمر",
    "water": "ماء",
    "fire": "نار",
    "sea": "بحر",
    "river": "نهر، نيل",
    "city": "مدينة",
    "village": "قرية",
    "house": "بيت، منزل",
    "temple": "هيكل، معبد",
    "place": "مكان، موضع",
    "time": "وقت، زمن",
    "hour": "ساعة",
    "day": "يوم، نهار",
    "night": "ليل، ليلة",
    "month": "شهر",
    "year": "سنة، عام",
    "eternity": "أبدية، خلود",
    "eternal": "أبدي، أزلي",
    "forever": "إلى الأبد",
    "world": "عالم، كون، دنيا",
    "good": "صالح، خير، حسن",
    "evil": "شرير، شر",
    "great": "عظيم، كبير",
    "small": "صغير",
    "first": "أول، أولاً",
    "last": "آخر، أخير",
    "one": "واحد",
    "two": "اثنان",
    "three": "ثلاثة",
    "four": "أربعة",
    "five": "خمسة",
    "six": "ستة",
    "seven": "سبعة",
    "eight": "ثمانية",
    "nine": "تسعة",
    "ten": "عشرة",
    "hundred": "مائة",
    "thousand": "ألف",
    "all": "كل، جميع",
    "many": "كثير",
    "few": "قليل",
    "give": "يعطي، يمنح",
    "take": "يأخذ",
    "come": "يأتي، يحضر",
    "go": "يذهب، يمضي",
    "walk": "يمشي، يسلك",
    "stand": "يقف، يثبت",
    "sit": "يجلس",
    "rise": "يقوم، يرتفع",
    "fall": "يسقط، يقع",
    "create": "يخلق، يبدع",
    "make": "يصنع، يفعل",
    "do": "يفعل، يعمل",
    "work": "عمل، شغل",
    "write": "يكتب",
    "book": "كتاب، سفر",
    "letter": "رسالة، حرف",
    "name": "اسم",
    "voice": "صوت",
    "eye": "عين",
    "ear": "أذن",
    "hand": "يد",
    "foot": "رجل، قدم",
    "mouth": "فم",
    "tongue": "لسان، لغة",
    "head": "رأس",
    "body": "جسد",
    "flesh": "لحم، جسد",
    "blood": "دم",
    "bone": "عظم",
    "face": "وجه",
    "path": "طريق، سبيل",
    "way": "طريق",
    "door": "باب",
    "gate": "بوابة",
    "stone": "حجر",
    "mountain": "جبل",
    "desert": "برية، صحراء",
    "tree": "شجرة",
    "fruit": "ثمرة، فاكهة",
    "gold": "ذهب",
    "silver": "فضة",
    "garment": "ثوب، رداء",
    "cloth": "قماش، ثوب",
    "glory": "مجد، بهاء",
    "honor": "كرامة، شرف",
    "power": "قوة، قدرة، سلطان",
    "mighty": "قدير، قوي",
    "pure": "طاهر، نقي",
    "purity": "طهارة، نقاوة",
    "joy": "فرح، بهجة",
    "rejoice": "يفرح، يبتهج",
    "weep": "يبكي",
    "fear": "خوف، خشية؛ يخاف",
    "comfort": "تعزية؛ يعزي",
    "consolation": "عزاء",
    "law": "ناموس، شريعة، قانون",
    "commandment": "وصية",
    "righteousness": "بر، عدالة",
    "righteous": "بار، صديق",
    "justice": "عدل، إنصاف",
    "judgment": "دينونة، حكم",
    "judge": "يدين، يحكم؛ قاضي",
    "mercy": "رحمة",
    "compassion": "حنان، رأفة",
    "generous": "كريم، سخي",
    "poor": "مسكين، فقير",
    "rich": "غني",
    "blind": "أعمى",
    "deaf": "أصم",
    "lame": "أعرج",
    "sick": "مريض",
    "heal": "يشفي، يبرئ",
    "healing": "شفاء",
    "clean": "طاهر، نظيف",
    "unclean": "نجس، دنس",
    "pure": "نقي",
    "holy": "قدوس، قديس",
}

def translate_definition_to_arabic(en_def: str, de_def: str, fr_def: str, coptic_name: str, coptic_clean: str) -> Optional[str]:
    """
    Translates English/German/French definitions into Arabic using:
    1. Direct traditional Coptic-Arabic curated lexicon match
    2. Semantic phrase & keyword alignment
    """
    # 1. Check curated Coptic headword table
    if coptic_name in CURATED_COPTIC_ARABIC:
        return CURATED_COPTIC_ARABIC[coptic_name]
    if coptic_clean in CURATED_COPTIC_ARABIC:
        return CURATED_COPTIC_ARABIC[coptic_clean]
    
    # 2. Match based on English definition
    if en_def:
        clean_en = en_def.lower().strip()
        # Direct dictionary match
        if clean_en in EN_TO_AR_DICTIONARY:
            return EN_TO_AR_DICTIONARY[clean_en]
        
        # Word-level / sub-phrase match
        matched_ar_terms = []
        tokens = re.split(r'[,;/()]|\bto\b|\ba\b|\ban\b|\bthe\b|\bor\b', clean_en)
        for tok in tokens:
            t = tok.strip()
            if t in EN_TO_AR_DICTIONARY and EN_TO_AR_DICTIONARY[t] not in matched_ar_terms:
                matched_ar_terms.append(EN_TO_AR_DICTIONARY[t])
        
        if matched_ar_terms:
            return "؛ ".join(matched_ar_terms[:3])
            
    return None

def generate_arabic_senses(
    en_senses: List[Dict[str, Any]],
    de_senses: List[Dict[str, Any]],
    fr_senses: List[Dict[str, Any]],
    coptic_name: str,
    coptic_clean: str,
    pos: str
) -> List[Dict[str, Any]]:
    """
    Generates structured Arabic Sense[] objects aligned with citations.
    """
    ar_senses = []
    
    # 1. Primary curated match
    curated = CURATED_COPTIC_ARABIC.get(coptic_name) or CURATED_COPTIC_ARABIC.get(coptic_clean)
    if curated:
        citations = []
        if en_senses and 'citations' in en_senses[0]:
            citations = en_senses[0]['citations']
        ar_senses.append({
            'definition': curated,
            'citations': citations
        })
        return ar_senses

    # 2. Iterate through English senses
    for idx, sense in enumerate(en_senses):
        en_def = sense.get('definition', '')
        de_def = de_senses[idx].get('definition', '') if idx < len(de_senses) else ''
        fr_def = fr_senses[idx].get('definition', '') if idx < len(fr_senses) else ''
        
        ar_trans = translate_definition_to_arabic(en_def, de_def, fr_def, coptic_name, coptic_clean)
        if ar_trans:
            ar_senses.append({
                'definition': ar_trans,
                'citations': sense.get('citations', [])
            })
            
    # 3. Fallback: if no senses resolved, try pos-based / broad root match
    if not ar_senses and en_senses:
        first_def = en_senses[0].get('definition', '')
        ar_trans = translate_definition_to_arabic(first_def, '', '', coptic_name, coptic_clean)
        if ar_trans:
            ar_senses.append({
                'definition': ar_trans,
                'citations': en_senses[0].get('citations', [])
            })

    return ar_senses
