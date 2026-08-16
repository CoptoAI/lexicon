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
  forms_json?: string;
  egyptian_json?: string;
  inflection_json?: string;
  etym?: string;
  ascii?: string;
  search?: string;
  oref?: string;
  grk_id?: string;
  xml_id: string;
  parsed_en?: Sense[];
  parsed_de?: Sense[];
  parsed_fr?: Sense[];
  parsed_forms?: FormItem[];
  parsed_egyptian?: EgyptianEtymology;
  parsed_inflection?: InflectionParadigm;
}

export interface SearchFilters {
  query: string;
  dialect: string;
  pos: string;
  lang: 'any' | 'en' | 'de' | 'fr';
  origin: 'all' | 'egyptian' | 'greek';
  sortBy: 'alpha' | 'freq';
}

export interface NetworkNode {
  id: string;
  label: string;
  isRoot?: boolean;
  freq?: number;
  assoc?: number;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  freq: number;
  assoc: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface DatabaseStats {
  entries: number;
  lemmas: number;
  collocates: number;
}
