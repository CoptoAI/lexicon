export interface Sense {
  definition: string;
  citations: string[];
}

export interface FormItem {
  orth: string;
  dialect: string;
  gram: string;
  form_id: string;
}

export interface EgyptianEtymology {
  tla: string;
  coptic: string;
  egy_num?: string;
  egy_lemma?: string;
  demo_num?: string;
  demo_lemma?: string;
  english?: string;
  german?: string;
  tla_link?: string;
  tla_link_d?: string;
}

export interface InflectionParadigm {
  tla: string;
  lemma: string;
  alt_infinitives?: string;
  prenominal?: string;
  prepronominal?: string;
  stative?: string;
  imperative?: string;
}

export interface ManuscriptCitation {
  lemma: string;
  urn: string;
  chapter?: string;
  verse?: string;
  priority?: number;
  notes?: string;
}

export interface DictionaryEntry {
  id: number;
  super_ref?: number;
  coptic_name: string;
  coptic_clean?: string;
  pos: string;
  origin?: 'egyptian' | 'greek' | 'semitic';
  freq_rank?: number;
  ipa_sahidic?: string;
  ipa_bohairic?: string;
  dialects: string;
  en_json?: string;
  de_json?: string;
  fr_json?: string;
  ar_json?: string;
  forms_json?: string;
  egyptian_json?: string;
  inflection_json?: string;
  citations_json?: string;
  etym?: string;
  ascii?: string;
  search?: string;
  oref?: string;
  grk_id?: string;
  xml_id: string;
  parsed_en?: Sense[];
  parsed_de?: Sense[];
  parsed_fr?: Sense[];
  parsed_ar?: Sense[];
  parsed_forms?: FormItem[];
  parsed_egyptian?: EgyptianEtymology;
  parsed_inflection?: InflectionParadigm;
  parsed_citations?: ManuscriptCitation[];
}

export interface SearchFilters {
  query: string;
  dialect: string;
  pos: string;
  lang: 'any' | 'en' | 'de' | 'fr' | 'ar' | string;
  origin?: 'all' | 'egyptian' | 'greek';
  sortBy?: 'alpha' | 'freq';
}

export interface DatabaseStats {
  entries: number;
  lemmas: number;
  collocates: number;
}

export interface CollocateItem {
  collocate: string;
  freq: number;
  assoc: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  isRoot?: boolean;
  freq?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface BibleBookInfo {
  code: string;
  canon_order: number;
  name_en: string;
  name_ar: string;
  name_cop: string;
  chapters: number;
}

export interface ParallelBibleVerse {
  verse_id: string;
  canon_order?: number;
  book: string;
  book_name_en: string;
  book_name_ar: string;
  book_name_cop: string;
  chapter: number;
  verse: number;
  coptic_sahidic: string;
  coptic_bohairic: string;
  coptic_bohairic_plain?: string;
  arabic_nav?: string;
  arabic_svd?: string;
  arabic_wbtc?: string;
  english_kjv?: string;
}

export interface BibleChapterResponse {
  book: BibleBookInfo;
  chapter: number;
  total_chapters: number;
  verses: ParallelBibleVerse[];
}
