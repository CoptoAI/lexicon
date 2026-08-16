
-- ============================================================================
-- Coptic Dictionary Online - Cloudflare D1 Full Lexicon Schema
-- Includes FTS5 Trigram Search, Egyptian Etymology, & Inflection Paradigms
-- ============================================================================

DROP TABLE IF EXISTS entries;
DROP TABLE IF EXISTS lemmas;
DROP TABLE IF EXISTS collocates;
DROP TABLE IF EXISTS egyptian_etymologies;
DROP TABLE IF EXISTS inflections;
DROP TABLE IF EXISTS entries_fts;

CREATE TABLE entries (
    id INTEGER PRIMARY KEY,
    super_ref INTEGER,
    name TEXT,
    coptic_name TEXT NOT NULL,
    coptic_clean TEXT NOT NULL,
    pos TEXT,
    origin TEXT DEFAULT 'egyptian',
    freq_rank INTEGER DEFAULT 99999,
    ipa_sahidic TEXT,
    ipa_bohairic TEXT,
    de TEXT,
    en TEXT,
    fr TEXT,
    etym TEXT,
    ascii TEXT,
    search TEXT,
    oref TEXT,
    grk_id TEXT,
    xml_id TEXT UNIQUE,
    dialects TEXT,
    en_json TEXT,
    de_json TEXT,
    fr_json TEXT,
    forms_json TEXT,
    egyptian_json TEXT,
    inflection_json TEXT
);

CREATE INDEX idx_entries_coptic_name ON entries(coptic_name);
CREATE INDEX idx_entries_coptic_clean ON entries(coptic_clean);
CREATE INDEX idx_entries_pos ON entries(pos);
CREATE INDEX idx_entries_origin ON entries(origin);
CREATE INDEX idx_entries_freq_rank ON entries(freq_rank);
CREATE INDEX idx_entries_xml_id ON entries(xml_id);

CREATE TABLE egyptian_etymologies (
    tla TEXT PRIMARY KEY,
    coptic TEXT,
    egy_num TEXT,
    egy_lemma TEXT,
    demo_num TEXT,
    demo_lemma TEXT,
    english TEXT,
    german TEXT,
    tla_link TEXT,
    tla_link_d TEXT
);

CREATE INDEX idx_egy_etym_coptic ON egyptian_etymologies(coptic);

CREATE TABLE inflections (
    tla TEXT PRIMARY KEY,
    lemma TEXT,
    alt_infinitives TEXT,
    prenominal TEXT,
    prepronominal TEXT,
    stative TEXT,
    imperative TEXT
);

CREATE TABLE lemmas (
    word TEXT,
    pos TEXT,
    lemma TEXT,
    word_count TEXT,
    word_freq REAL,
    word_rank INTEGER,
    lemma_count TEXT,
    lemma_freq REAL,
    lemma_rank INTEGER
);

CREATE INDEX idx_lemmas_word ON lemmas(word);
CREATE INDEX idx_lemmas_lemma ON lemmas(lemma);

CREATE TABLE collocates (
    lemma TEXT,
    collocate TEXT,
    freq INTEGER,
    assoc REAL
);

CREATE INDEX idx_collocates_lemma ON collocates(lemma);

CREATE VIRTUAL TABLE entries_fts USING fts5(
    id UNINDEXED,
    coptic_name,
    coptic_clean,
    en_text,
    de_text,
    fr_text,
    etym,
    pos,
    origin,
    tokenize='trigram'
);
