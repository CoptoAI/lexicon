#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exports clean, Cloudflare D1-compliant SQL statements with small batch sizes
to prevent SQLITE_TOOBIG limits. Includes citations table.
"""

import sqlite3
import os
import sys

def sql_escape(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    # String escape
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_d1_export():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'd1_coptic_dict.db')
    out_dir = os.path.join(base_dir, 'migrations')
    os.makedirs(out_dir, exist_ok=True)
    dump_file = os.path.join(out_dir, 'd1_full_dump.sql')

    print(f"Connecting to {db_path}...")
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    with open(dump_file, 'w', encoding='utf-8') as f:
        f.write("-- ============================================================================\n")
        f.write("-- Coptic Dictionary Online - Cloudflare D1 Optimized Export\n")
        f.write("-- ============================================================================\n\n")

        # 1. Drop existing tables
        f.write("DROP TABLE IF EXISTS entries;\n")
        f.write("DROP TABLE IF EXISTS egyptian_etymologies;\n")
        f.write("DROP TABLE IF EXISTS inflections;\n")
        f.write("DROP TABLE IF EXISTS citations;\n")
        f.write("DROP TABLE IF EXISTS lemmas;\n")
        f.write("DROP TABLE IF EXISTS collocates;\n")
        f.write("DROP TABLE IF EXISTS entries_fts;\n\n")

        # 2. Create tables
        f.write("""CREATE TABLE entries (
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
\n""")

        # 3. Export entries (batch of 10)
        print("Exporting entries...")
        cur.execute("SELECT id, super_ref, name, coptic_name, coptic_clean, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic, de, en, fr, etym, ascii, search, oref, grk_id, xml_id, dialects, en_json, de_json, fr_json, forms_json, egyptian_json, inflection_json, citations_json FROM entries ORDER BY id")
        entries = cur.fetchall()
        for i in range(0, len(entries), 10):
            batch = entries[i:i+10]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO entries VALUES {', '.join(val_strs)};\n")

        # 4. Export egyptian_etymologies (batch of 20)
        print("Exporting egyptian_etymologies...")
        cur.execute("SELECT tla, coptic, egy_num, egy_lemma, demo_num, demo_lemma, english, german, tla_link, tla_link_d FROM egyptian_etymologies")
        egy = cur.fetchall()
        for i in range(0, len(egy), 20):
            batch = egy[i:i+20]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO egyptian_etymologies VALUES {', '.join(val_strs)};\n")

        # 5. Export inflections (batch of 20)
        print("Exporting inflections...")
        cur.execute("SELECT tla, lemma, alt_infinitives, prenominal, prepronominal, stative, imperative FROM inflections")
        infl = cur.fetchall()
        for i in range(0, len(infl), 20):
            batch = infl[i:i+20]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO inflections VALUES {', '.join(val_strs)};\n")

        # 6. Export citations (batch of 20)
        print("Exporting citations...")
        cur.execute("SELECT tla, lemma, urn, chapter, verse, priority, notes FROM citations")
        cits = cur.fetchall()
        for i in range(0, len(cits), 20):
            batch = cits[i:i+20]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO citations VALUES {', '.join(val_strs)};\n")

        # 7. Export lemmas (batch of 50)
        print("Exporting lemmas...")
        cur.execute("SELECT word, pos, lemma, word_count, word_freq, word_rank, lemma_count, lemma_freq, lemma_rank FROM lemmas")
        lemmas = cur.fetchall()
        for i in range(0, len(lemmas), 50):
            batch = lemmas[i:i+50]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO lemmas VALUES {', '.join(val_strs)};\n")

        # 8. Export collocates (batch of 50)
        print("Exporting collocates...")
        cur.execute("SELECT lemma, collocate, freq, assoc FROM collocates")
        collocates = cur.fetchall()
        for i in range(0, len(collocates), 50):
            batch = collocates[i:i+50]
            val_strs = ["(" + ", ".join(sql_escape(v) for v in row) + ")" for row in batch]
            f.write(f"INSERT INTO collocates VALUES {', '.join(val_strs)};\n")

        # 9. Populate entries_fts via server-side SELECT query
        f.write("\n-- Populate Trigram FTS5 index from entries\n")
        f.write("INSERT INTO entries_fts(id, coptic_name, coptic_clean, en_text, de_text, fr_text, etym, pos, origin) SELECT id, coptic_name, coptic_clean, en, de, fr, etym, pos, origin FROM entries;\n")

    con.close()
    file_size_mb = os.path.getsize(dump_file) / (1024 * 1024)
    print(f"SUCCESS: Generated D1 clean export at {dump_file} ({file_size_mb:.2f} MB)")

if __name__ == '__main__':
    generate_d1_export()
