#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Populate `citations` table in SQLite/D1 database with all 14,874 citations.
"""

import sqlite3
import json
import os
import sys
import unicodedata
import re

sys.stdout.reconfigure(encoding='utf-8')

def strip_diacritics(text: str) -> str:
    if not text:
        return ""
    nfd = unicodedata.normalize('NFD', text)
    cleaned = re.sub(r'[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]', '', nfd)
    return unicodedata.normalize('NFC', cleaned).strip().lower()

db_path = 'd:/Copto/dictionary/d1_coptic_dict.db'
con = sqlite3.connect(db_path)
cur = con.cursor()

# Recreate citations table with modern rich schema
print("Creating citations table...")
cur.execute("DROP TABLE IF EXISTS citations")
cur.execute("""
CREATE TABLE citations (
    id TEXT PRIMARY KEY,
    lemma TEXT NOT NULL,
    lemma_clean TEXT NOT NULL,
    reference TEXT NOT NULL,
    reference_ar TEXT,
    urn TEXT NOT NULL,
    genre TEXT NOT NULL,
    dialect TEXT NOT NULL,
    source_name TEXT NOT NULL,
    coptic_text TEXT NOT NULL,
    english_translation TEXT,
    arabic_translation TEXT
)
""")
cur.execute("CREATE INDEX idx_citations_lemma_clean ON citations(lemma_clean)")
cur.execute("CREATE INDEX idx_citations_genre ON citations(genre)")

# Load Master Concordance JSON
with open('d:/Copto/dictionary/data/corpus_concordance.json', 'r', encoding='utf-8') as f:
    conc_data = json.load(f)

print("Ingesting citations into SQLite...")
inserted_ids = set()
rows_to_insert = []

for lemma, citations in conc_data.items():
    lemma_clean = strip_diacritics(lemma)
    for cit in citations:
        cit_id = cit.get('id') or f"{cit['urn']}_{lemma_clean}"
        # Make id unique per lemma if needed
        full_id = f"{lemma_clean}_{cit_id}"
        if full_id in inserted_ids:
            continue
        inserted_ids.add(full_id)
        
        rows_to_insert.append((
            full_id,
            lemma,
            lemma_clean,
            cit.get('reference', ''),
            cit.get('reference_ar', ''),
            cit.get('urn', ''),
            cit.get('genre', 'biblical'),
            cit.get('dialect', 'Sahidic'),
            cit.get('source_name', ''),
            cit.get('coptic_text', ''),
            cit.get('english_translation', ''),
            cit.get('arabic_translation', '')
        ))

cur.executemany("""
INSERT INTO citations (
    id, lemma, lemma_clean, reference, reference_ar, urn, genre, dialect,
    source_name, coptic_text, english_translation, arabic_translation
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", rows_to_insert)

con.commit()
print(f"Successfully inserted {len(rows_to_insert)} citations into {db_path}!")

# Verify counts
total = cur.execute("SELECT COUNT(*) FROM citations").fetchone()[0]
print(f"Verified total citations in DB: {total}")
sample = cur.execute("SELECT * FROM citations WHERE lemma_clean='ⲛⲟⲩⲧⲉ' LIMIT 2").fetchall()
print(f"Sample ⲛⲟⲩⲧⲉ citations: {len(sample)}")
