export interface WidgetConfig {
  theme: 'dark' | 'light' | 'auto';
  lang: 'en' | 'de' | 'fr' | 'ar';
  mode: 'hover' | 'click';
  audio: boolean;
  selectionLookup: boolean;
  selector: string;
  apiUrl: string;
  zIndex: number;
}

export interface WidgetLookupResult {
  found: boolean;
  id?: number;
  xml_id?: string;
  coptic_name?: string;
  pos?: string;
  origin?: 'egyptian' | 'greek' | 'semitic';
  dialects?: string[];
  freq_rank?: number;
  ipa?: string;
  ipa_sahidic?: string;
  ipa_bohairic?: string;
  definition?: string;
  en_definition?: string;
  de_definition?: string;
  fr_definition?: string;
  ar_definition?: string;
  etym?: string | null;
  url?: string;
  matched_stem?: string;
  original_query?: string;
}

export interface PopoverPosition {
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}
