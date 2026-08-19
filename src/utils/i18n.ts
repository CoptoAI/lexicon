export type UiLanguage = 'en' | 'ar';

export interface UiTranslations {
  siteTitle: string;
  siteSubtitle: string;
  headerEntries: string;
  parallelBible: string;
  embedWidget: string;
  howToSearch: string;
  aboutCoptoLex: string;
  toggleThemeLight: string;
  toggleThemeDark: string;

  searchPlaceholder: string;
  clearSearch: string;
  keyboard: string;
  originLabel: string;
  allLexicon: string;
  egyptianRoots: string;
  greekLoanwords: string;
  sortLabel: string;
  sortAlpha: string;
  sortFreq: string;
  exportAnki: string;
  dialectLabel: string;
  allDialects: string;
  posLabel: string;
  anyPos: string;
  langLabel: string;
  langAny: string;
  langAr: string;
  langEn: string;
  langDe: string;
  langFr: string;

  showingResults: (count: number, total: number) => string;
  resultsHint: string;
  noResultsTitle: string;
  noResultsBody: string;

  footerDesc: string;
  arabicBadge: string;
}

export const UI_STRINGS: Record<UiLanguage, UiTranslations> = {
  en: {
    siteTitle: 'COPTOLEX',
    siteSubtitle: 'ⲡⲗⲉⲝⲓⲕⲟⲛ ⲛ̀ϯⲁⲥⲡⲓ ⲛ̀ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ • Comprehensive Coptic Lexicon',
    headerEntries: '11,272 Entries',
    parallelBible: 'Parallel Bible',
    embedWidget: 'Embed Widget',
    howToSearch: 'How to Search',
    aboutCoptoLex: 'About CoptoLex',
    toggleThemeLight: 'Switch to light mode',
    toggleThemeDark: 'Switch to dark mode',

    searchPlaceholder: 'Search Coptic (e.g. ⲛⲟⲩⲧⲉ, ⲁⲅⲁⲡⲏ), Arabic (الله, محبة, سلام), English, German, French...',
    clearSearch: 'Clear search',
    keyboard: 'Keyboard',
    originLabel: 'Origin:',
    allLexicon: 'All Lexicon (11,272)',
    egyptianRoots: '🏺 Egyptian Roots',
    greekLoanwords: '🏛️ Greek Loanwords',
    sortLabel: 'Sort:',
    sortAlpha: 'A-Z',
    sortFreq: 'Frequency',
    exportAnki: 'Anki Deck',
    dialectLabel: 'Dialect:',
    allDialects: 'All Dialects',
    posLabel: 'Part of Speech:',
    anyPos: 'Any POS Tag',
    langLabel: 'Definition Language:',
    langAny: 'Any / All Languages',
    langAr: 'Arabic (العربية)',
    langEn: 'English only',
    langDe: 'German only (Deutsch)',
    langFr: 'French only (Français)',

    showingResults: (count, total) => `Showing ${count} of ${total.toLocaleString()} matching entries`,
    resultsHint: 'Click any card for full conjugation, Egyptian roots & citations',
    noResultsTitle: 'No matching entries found',
    noResultsBody: 'Try broadening your search term, toggling the Origin filter to "All Lexicon", or using the Coptic Virtual Keyboard.',

    footerDesc: 'CoptoLex is an open-access lexical research project by Copto.org & Coptic scholars.',
    arabicBadge: 'العربية'
  },
  ar: {
    siteTitle: 'كوبتوليكس',
    siteSubtitle: 'ⲡⲗⲉⲝⲓⲕⲟⲛ ⲛ̀ϯⲁⲥⲡⲓ ⲛ̀ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ • المعجم القبطي الشامل',
    headerEntries: '١١,٢٧٢ كلمة',
    parallelBible: 'العهد الجديد المقارن',
    embedWidget: 'تضمين الأداة',
    howToSearch: 'دليل البحث',
    aboutCoptoLex: 'حول القاموس',
    toggleThemeLight: 'التبديل إلى الوضع الفاتح',
    toggleThemeDark: 'التبديل إلى الوضع الداكن',

    searchPlaceholder: 'ابحث بالقبطية (ⲛⲟⲩⲧⲉ, ⲁⲅⲁⲡⲏ)، بالعربية (الله، محبة، سلام)، أو بالإنجليزية...',
    clearSearch: 'مسح البحث',
    keyboard: 'لوحة المفاتيح',
    originLabel: 'الأصل اللغوي:',
    allLexicon: 'كل المعجم (١١,٢٧٢)',
    egyptianRoots: '🏺 أصول مصرية قديمة',
    greekLoanwords: '🏛️ ألفاظ يونانية دخيلة',
    sortLabel: 'الترتيب:',
    sortAlpha: 'أبجدياً (أ-ي)',
    sortFreq: 'حسب الشيوع',
    exportAnki: 'تصدير لبطاقات أنكي (Anki)',
    dialectLabel: 'اللهجة:',
    allDialects: 'جميع اللهجات',
    posLabel: 'نوع الكلمة:',
    anyPos: 'أي تصنيف نحوي',
    langLabel: 'لغة التعريف المعجمي:',
    langAny: 'جميع اللغات',
    langAr: 'العربية فقط',
    langEn: 'الإنجليزية فقط',
    langDe: 'الألمانية فقط',
    langFr: 'الفرنسية فقط',

    showingResults: (count, total) => `عرض ${count} من إجمالي ${total.toLocaleString('ar-EG')} كلمة مطابقة`,
    resultsHint: 'انقر على أي بطاقة لعرض التصريف الكامل، الجذور الهيروغليفية، والشواهد المخطوطية',
    noResultsTitle: 'لم يتم العثور على نتائج مطابقة',
    noResultsBody: 'حاول كتابة جذر الكلمة، أو اختيار "كل المعجم"، أو استخدام لوحة المفاتيح القبطية المدمجة.',

    footerDesc: 'CoptoLex هو معجم قبطي شامل مفتوح المصدر برعاية Copto.org وباحثي اللغة القبطية والمخطوطات.',
    arabicBadge: 'العربية'
  }
};
