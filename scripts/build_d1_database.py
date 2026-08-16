#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Migration & Exporter for Cloudflare D1 (Coptic Dictionary)
Reads alpha_*.db, egyptian_etymologies.tab, inflections.tab, and citations_manual.tab,
producing a fully enriched, FTS5-enabled SQLite database for Cloudflare D1.
"""

import sqlite3
import json
import re
import os
import sys
import unicodedata
import glob

def strip_diacritics(text: str) -> str:
    """Normalize Coptic text by removing supralinear strokes, macrons, jinkim, hyphens, and equal signs."""
    if not text:
        return ""
    nfd = unicodedata.normalize('NFD', text)
    cleaned = re.sub(r'[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]', '', nfd)
    cleaned = unicodedata.normalize('NFC', cleaned).strip().lower()
    return cleaned

def parse_senses(s_str: str):
    """Parse definitions and citations from raw sense string."""
    if not s_str:
        return []
    senses = []
    for part in s_str.split('|||'):
        part = part.strip()
        if not part:
            continue
        m = re.search(r'~~~(.*?)(?:;;;(.*))?$', part)
        if m:
            def_text = m.group(1).strip()
            raw_cits = m.group(2) or ''
            citations = [c.strip() for c in raw_cits.split(';') if c.strip()]
            senses.append({'definition': def_text, 'citations': citations})
        else:
            clean = re.sub(r'^\d+\|', '', part).strip()
            senses.append({'definition': clean, 'citations': []})
    return senses

def parse_forms(name_str: str):
    """Parse forms, dialects, grammatical info, and form IDs from Name string."""
    if not name_str:
        return [], []
    forms = []
    dialects_set = set()
    
    for block in name_str.split('|||'):
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue
        gram = lines[0]
        for l in lines[1:]:
            m = re.match(r'^(.*?)~(.?\^\^([A-Za-z0-9_]*))$', l)
            if m:
                orth = m.group(1).strip()
                dialect_raw = m.group(2).strip()
                form_id = m.group(3).strip()
                dialect = dialect_raw.split('^^')[0].replace('~', '').strip()
                if dialect:
                    dialects_set.add(dialect)
                forms.append({
                    'orth': orth,
                    'dialect': dialect,
                    'form_id': form_id,
                    'gram': gram
                })
            else:
                forms.append({
                    'orth': l,
                    'dialect': '',
                    'form_id': '',
                    'gram': gram
                })
    return forms, sorted(list(dialects_set))

def determine_origin(etym: str, grk_id: str, pos: str) -> str:
    """Classify origin of word into 'egyptian', 'greek', or 'semitic'."""
    if grk_id or (etym and ('greek' in etym.lower() or 'gr.' in etym.lower() or 'grk' in etym.lower())):
        return 'greek'
    if etym and ('hebr' in etym.lower() or 'arab' in etym.lower() or 'aram' in etym.lower()):
        return 'semitic'
    return 'egyptian'

def generate_ipa(coptic_word: str, dialect: str = 'S') -> str:
    """Generate phonetic IPA representation for Sahidic (S) or Bohairic (B)."""
    if not coptic_word:
        return ""
    clean = strip_diacritics(coptic_word)
    
    # Character phonetic mapping
    ipa_map_sahidic = {
        'ⲁ': 'a', 'ⲃ': 'β', 'ⲅ': 'g', 'ⲇ': 'd', 'ⲉ': 'e', 'ⲍ': 'z',
        'ⲏ': 'eː', 'ⲑ': 'tʰ', 'ⲓ': 'i', 'ⲕ': 'k', 'ⲗ': 'l', 'ⲙ': 'm',
        'ⲛ': 'n', 'ⲝ': 'ks', 'ⲟ': 'o', 'ⲡ': 'p', 'ⲣ': 'r', 'ⲥ': 's',
        'ⲧ': 't', 'ⲩ': 'u', 'ⲫ': 'pʰ', 'ⲭ': 'kʰ', 'ⲯ': 'ps', 'ⲱ': 'oː',
        'ϣ': 'ʃ', 'ϥ': 'f', 'ϧ': 'x', 'ⳉ': 'x', 'ϩ': 'h', 'ϫ': 'tʃ',
        'ϭ': 'c', 'ϯ': 'ti'
    }
    
    ipa_map_bohairic = {
        'ⲁ': 'a', 'ⲃ': 'v', 'ⲅ': 'ɣ', 'ⲇ': 'ð', 'ⲉ': 'e', 'ⲍ': 'z',
        'ⲏ': 'iː', 'ⲑ': 'tʰ', 'ⲓ': 'i', 'ⲕ': 'k', 'ⲗ': 'l', 'ⲙ': 'm',
        'ⲛ': 'n', 'ⲝ': 'ks', 'ⲟ': 'o', 'ⲡ': 'p', 'ⲣ': 'r', 'ⲥ': 's',
        'ⲧ': 't', 'ⲩ': 'i', 'ⲫ': 'f', 'ⲭ': 'x', 'ⲯ': 'ps', 'ⲱ': 'oː',
        'ϣ': 'ʃ', 'ϥ': 'f', 'ϧ': 'x', 'ⳉ': 'x', 'ϩ': 'h', 'ϫ': 'dʒ',
        'ϭ': 'tʃ', 'ϯ': 'di'
    }

    cur_map = ipa_map_bohairic if dialect == 'B' else ipa_map_sahidic
    ipa_chars = []
    for ch in clean:
        ipa_chars.append(cur_map.get(ch, ch))
    return '/' + ''.join(ipa_chars) + '/'

def load_egyptian_etymologies(filepath: str):
    """Load Ancient Egyptian & Demotic Gardiner etymologies."""
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found")
        return {}
    etyms = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 10:
                tla = parts[0].strip()
                etyms[tla] = {
                    'tla': tla,
                    'cop': parts[1].strip(),
                    'egy_num': parts[2].strip() if parts[2] != 'NA' else '',
                    'egy_lemma': parts[3].strip() if parts[3] != 'NA' else '',
                    'demo_num': parts[4].strip() if parts[4] != 'NA' else '',
                    'demo_lemma': parts[5].strip() if parts[5] != 'NA' else '',
                    'english': parts[6].strip(),
                    'german': parts[7].strip(),
                    'tla_link': parts[8].strip() if parts[8] != '_' else '',
                    'tla_link_d': parts[9].strip() if parts[9] != '_' else ''
                }
    print(f"Loaded {len(etyms)} Egyptian/Demotic etymologies.")
    return etyms

def load_inflections(filepath: str):
    """Load verbal and nominal inflection paradigms."""
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found")
        return {}
    inflections = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                tla = parts[0].strip()
                inflections[tla] = {
                    'tla': tla,
                    'lemma': parts[1].strip(),
                    'alt_infinitives': parts[2].strip() if parts[2] != '_' else '',
                    'prenominal': parts[3].strip() if parts[3] != '_' else '',
                    'prepronominal': parts[4].strip() if parts[4] != '_' else '',
                    'stative': parts[5].strip() if parts[5] != '_' else '',
                    'imperative': parts[6].strip() if parts[6] != '_' else ''
                }
    print(f"Loaded {len(inflections)} inflection paradigms.")
    return inflections

def load_citations(filepath: str):
    """Load manuscript citations with CTS URNs."""
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found")
        return {}
    citations = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('TLA') or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 6:
                tla = parts[0].strip()
                cit = {
                    'lemma': parts[1].strip(),
                    'urn': parts[2].strip(),
                    'chapter': parts[3].strip() if len(parts) > 3 else '',
                    'verse': parts[4].strip() if len(parts) > 4 else '',
                    'priority': int(parts[5].strip()) if len(parts) > 5 and parts[5].strip().isdigit() else 1,
                    'notes': parts[7].strip() if len(parts) > 7 else ''
                }
                if tla not in citations:
                    citations[tla] = []
                citations[tla].append(cit)
    print(f"Loaded {sum(len(v) for v in citations.values())} manuscript citations.")
    return citations

def find_latest_source_db(base_dir: str) -> str:
    """Find the newest alpha_*.db or custom source database in the project directory."""
    db_candidates = glob.glob(os.path.join(base_dir, 'alpha_*.db'))
    if db_candidates:
        db_candidates.sort(key=lambda p: (os.path.getmtime(p), p), reverse=True)
        return db_candidates[0]
    return os.path.join(base_dir, 'alpha_kyima_rc1.db')

def build_d1_database(base_dir: str, custom_src_db: str = None):
    src_db_path = custom_src_db if custom_src_db else find_latest_source_db(base_dir)
    target_db_path = os.path.join(base_dir, 'd1_coptic_dict.db')
    schema_sql_path = os.path.join(base_dir, 'migrations', '0001_initial_schema.sql')
    egy_etym_path = os.path.join(base_dir, 'utils', 'egyptian_etymologies.tab')
    inflections_path = os.path.join(base_dir, 'utils', 'inflections.tab')
    citations_path = os.path.join(base_dir, 'utils', 'citations_manual.tab')

    print(f"Connecting to source database: {src_db_path}")
    if not os.path.exists(src_db_path):
        raise FileNotFoundError(f"Source database not found: {src_db_path}")
    src_con = sqlite3.connect(src_db_path)
    src_cur = src_con.cursor()

    egyptian_etyms = load_egyptian_etymologies(egy_etym_path)
    inflections_data = load_inflections(inflections_path)
    citations_data = load_citations(citations_path)

    # Load lemma frequencies for ranking
    src_cur.execute("SELECT lemma, MIN(lemma_rank) as rank FROM lemmas WHERE lemma_rank > 0 GROUP BY lemma")
    lemma_ranks = {row[0]: row[1] for row in src_cur.fetchall()}

    if os.path.exists(target_db_path):
        os.remove(target_db_path)

    tgt_con = sqlite3.connect(target_db_path)
    tgt_cur = tgt_con.cursor()

    print("Creating Enriched D1 SQLite Schema with FTS5 virtual tables...")
    schema_sql = """
-- ============================================================================
-- Coptic Dictionary Online - Cloudflare D1 Full Lexicon Schema
-- Includes FTS5 Trigram Search, Egyptian Etymology, Inflections & Citations
-- ============================================================================

DROP TABLE IF EXISTS entries;
DROP TABLE IF EXISTS lemmas;
DROP TABLE IF EXISTS collocates;
DROP TABLE IF EXISTS egyptian_etymologies;
DROP TABLE IF EXISTS inflections;
DROP TABLE IF EXISTS citations;
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
    inflection_json TEXT,
    citations_json TEXT
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

CREATE TABLE citations (
    tla TEXT,
    lemma TEXT,
    urn TEXT,
    chapter TEXT,
    verse TEXT,
    priority INTEGER,
    notes TEXT
);

CREATE INDEX idx_citations_tla ON citations(tla);

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
"""
    tgt_cur.executescript(schema_sql)

    # Save initial schema migration file
    os.makedirs(os.path.dirname(schema_sql_path), exist_ok=True)
    with open(schema_sql_path, 'w', encoding='utf-8') as f:
        f.write(schema_sql)

    print("Extracting entries from source database...")
    src_cur.execute("""
        SELECT Id, Super_Ref, Name, POS, De, En, Fr, Etym, Ascii, Search, oRef, grkId, xml_id
        FROM entries
        ORDER BY Id
    """)
    raw_entries = src_cur.fetchall()

    entries_to_insert = []
    fts_to_insert = []

    for row in raw_entries:
        entry_id, super_ref, name_raw, pos, de, en, fr, etym, ascii_code, search, oref, grk_id, tla_id = row
        forms, dialects_list = parse_forms(name_raw)

        coptic_name = forms[0]['orth'] if forms else (search or "")
        coptic_clean = strip_diacritics(coptic_name)
        dialects_str = ",".join(dialects_list)

        en_senses = parse_senses(en)
        de_senses = parse_senses(de)
        fr_senses = parse_senses(fr)

        en_text = " ".join([s['definition'] for s in en_senses])
        de_text = " ".join([s['definition'] for s in de_senses])
        fr_text = " ".join([s['definition'] for s in fr_senses])

        origin = determine_origin(etym, grk_id, pos)
        freq_rank = lemma_ranks.get(coptic_name, lemma_ranks.get(coptic_clean, 99999))

        ipa_s = generate_ipa(coptic_name, 'S')
        ipa_b = generate_ipa(coptic_name, 'B')

        egy_obj = egyptian_etyms.get(tla_id)
        inflection_obj = inflections_data.get(tla_id)
        citations_obj = citations_data.get(tla_id, [])

        entries_to_insert.append((
            entry_id,
            super_ref,
            name_raw or "",
            coptic_name,
            coptic_clean,
            pos or "",
            origin,
            freq_rank,
            ipa_s,
            ipa_b,
            de,
            en,
            fr,
            etym or "",
            ascii_code or "",
            search or "",
            oref or "",
            grk_id or "",
            tla_id,
            dialects_str,
            json.dumps(en_senses, ensure_ascii=False),
            json.dumps(de_senses, ensure_ascii=False),
            json.dumps(fr_senses, ensure_ascii=False),
            json.dumps(forms, ensure_ascii=False),
            json.dumps(egy_obj, ensure_ascii=False) if egy_obj else "",
            json.dumps(inflection_obj, ensure_ascii=False) if inflection_obj else "",
            json.dumps(citations_obj, ensure_ascii=False) if citations_obj else ""
        ))

        fts_to_insert.append((
            entry_id,
            coptic_name,
            coptic_clean,
            en_text,
            de_text,
            fr_text,
            etym or "",
            pos or "",
            origin
        ))

    tgt_cur.executemany("""
        INSERT INTO entries (
            id, super_ref, name, coptic_name, coptic_clean, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic,
            de, en, fr, etym, ascii, search, oref, grk_id, xml_id, dialects,
            en_json, de_json, fr_json, forms_json, egyptian_json, inflection_json, citations_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, entries_to_insert)

    tgt_cur.executemany("""
        INSERT INTO entries_fts (id, coptic_name, coptic_clean, en_text, de_text, fr_text, etym, pos, origin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, fts_to_insert)

    print(f"Migrated {len(entries_to_insert)} enriched entries + FTS5 rows.")

    # Ingest Egyptian etymologies table
    egy_records = [
        (v['tla'], v['cop'], v['egy_num'], v['egy_lemma'], v['demo_num'], v['demo_lemma'], v['english'], v['german'], v['tla_link'], v['tla_link_d'])
        for v in egyptian_etyms.values()
    ]
    tgt_cur.executemany("""
        INSERT INTO egyptian_etymologies (tla, coptic, egy_num, egy_lemma, demo_num, demo_lemma, english, german, tla_link, tla_link_d)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, egy_records)
    print(f"Inserted {len(egy_records)} Egyptian etymology records.")

    # Ingest inflections table
    infl_records = [
        (v['tla'], v['lemma'], v['alt_infinitives'], v['prenominal'], v['prepronominal'], v['stative'], v['imperative'])
        for v in inflections_data.values()
    ]
    tgt_cur.executemany("""
        INSERT INTO inflections (tla, lemma, alt_infinitives, prenominal, prepronominal, stative, imperative)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, infl_records)
    print(f"Inserted {len(infl_records)} inflection paradigm records.")

    # Ingest citations table
    all_cit_records = []
    for tla, cits in citations_data.items():
        for c in cits:
            all_cit_records.append((tla, c['lemma'], c['urn'], c['chapter'], c['verse'], c['priority'], c['notes']))
    tgt_cur.executemany("""
        INSERT INTO citations (tla, lemma, urn, chapter, verse, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, all_cit_records)
    print(f"Inserted {len(all_cit_records)} manuscript citations.")

    print("Migrating lemmas...")
    src_cur.execute("SELECT word, pos, lemma, word_count, word_freq, word_rank, lemma_count, lemma_freq, lemma_rank FROM lemmas")
    raw_lemmas = src_cur.fetchall()
    tgt_cur.executemany("""
        INSERT INTO lemmas (word, pos, lemma, word_count, word_freq, word_rank, lemma_count, lemma_freq, lemma_rank)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, raw_lemmas)
    print(f"Migrated {len(raw_lemmas)} lemmas.")

    print("Migrating collocates...")
    src_cur.execute("SELECT lemma, collocate, freq, assoc FROM collocates")
    raw_collocates = src_cur.fetchall()
    tgt_cur.executemany("""
        INSERT INTO collocates (lemma, collocate, freq, assoc)
        VALUES (?, ?, ?, ?)
    """, raw_collocates)
    print(f"Migrated {len(raw_collocates)} collocates.")

    tgt_con.commit()
    
    print("Optimizing SQLite database with VACUUM & ANALYZE...")
    tgt_cur.execute("ANALYZE;")
    tgt_cur.execute("VACUUM;")
    tgt_con.commit()

    tgt_con.close()
    src_con.close()

    db_size = os.path.getsize(target_db_path) / (1024 * 1024)
    print(f"SUCCESS: Generated enriched D1 database at {target_db_path} ({db_size:.2f} MB)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    build_d1_database(base_dir)
