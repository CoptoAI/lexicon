#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Master Coptic Bible VPL Ingestion & Multi-Dialect Concordance Pipeline
Processes:
  - copshc_vpl: Sahidic Coptic New Testament
  - copbhc_vpl: Standard Bohairic Coptic New Testament
  - copcnt_vpl: Liturgical Vocalized Bohairic New Testament (with Jinikim)
  - arbnav_vpl: Ketab El Hayat (New Arabic Version)
  - arbwbtc_vpl: WBTC Arabic Easy-to-Read Version
  - ar_svd.json: Smith & Van Dyck Arabic Bible
  - en_kjv.json: King James Version English Bible

Outputs:
  - SQLite table `bible_verses` and `bible_verses_fts` in d1_coptic_dict.db
  - Multi-dialect attested citations in `citations` table
  - Static offline chapter cache in `public/data/bible/`
"""

import os
import sys
import re
import json
import sqlite3
import unicodedata
from collections import defaultdict

# Windows stdout utf-8 compatibility
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'd1_coptic_dict.db')
BIBLE_DATA_DIR = r'D:\Copto\Bible data'

# 27 New Testament Books Metadata
NT_BOOKS = [
    {"code": "MAT", "canon_order": 1, "name_en": "Matthew", "name_ar": "إنجيل متى", "name_cop": "ⲡⲉⲩⲁⲅⲅⲉⲗⲓⲟⲛ ⲕⲁⲧⲁ ⲙⲁⲧⲑⲁⲓⲟⲛ", "chapters": 28, "kjv_idx": 39},
    {"code": "MAR", "canon_order": 2, "name_en": "Mark", "name_ar": "إنجيل مرقس", "name_cop": "ⲡⲉⲩⲁⲅⲅⲉⲗⲓⲟⲛ ⲕⲁⲧⲁ ⲙⲁⲣⲕⲟⲛ", "chapters": 16, "kjv_idx": 40},
    {"code": "LUK", "canon_order": 3, "name_en": "Luke", "name_ar": "إنجيل لوقا", "name_cop": "ⲡⲉⲩⲁⲅⲅⲉⲗⲓⲟⲛ ⲕⲁⲧⲁ ⲗⲟⲩⲕⲁⲛ", "chapters": 24, "kjv_idx": 41},
    {"code": "JOH", "canon_order": 4, "name_en": "John", "name_ar": "إنجيل يوحنا", "name_cop": "ⲡⲉⲩⲁⲅⲅⲉⲗⲓⲟⲛ ⲕⲁⲧⲁ ⲓⲱϩⲁⲛⲛⲏⲛ", "chapters": 21, "kjv_idx": 42},
    {"code": "ACT", "canon_order": 5, "name_en": "Acts", "name_ar": "سفر أعمال الرسل", "name_cop": "ⲛⲉⲡⲣⲁⲝⲓⲥ ⲛⲛⲁⲡⲟⲥⲧⲟⲗⲟⲥ", "chapters": 28, "kjv_idx": 43},
    {"code": "ROM", "canon_order": 6, "name_en": "Romans", "name_ar": "الرسالة إلى أهل رومية", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲣⲱⲙⲁⲓⲟⲩⲥ", "chapters": 16, "kjv_idx": 44},
    {"code": "1CO", "canon_order": 7, "name_en": "1 Corinthians", "name_ar": "الرسالة الأولى إلى أهل كورنثوس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲕⲟⲣⲓⲛⲑⲓⲟⲩⲥ ⲁ", "chapters": 16, "kjv_idx": 45},
    {"code": "2CO", "canon_order": 8, "name_en": "2 Corinthians", "name_ar": "الرسالة الثانية إلى أهل كورنثوس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲕⲟⲣⲓⲛⲑⲓⲟⲩⲥ ⲃ", "chapters": 13, "kjv_idx": 46},
    {"code": "GAL", "canon_order": 9, "name_en": "Galatians", "name_ar": "الرسالة إلى أهل غلاطية", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲅⲁⲗⲁⲧⲁⲥ", "chapters": 6, "kjv_idx": 47},
    {"code": "EPH", "canon_order": 10, "name_en": "Ephesians", "name_ar": "الرسالة إلى أهل أفسس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲉⲫⲉⲥⲓⲟⲩⲥ", "chapters": 6, "kjv_idx": 48},
    {"code": "PHI", "canon_order": 11, "name_en": "Philippians", "name_ar": "الرسالة إلى أهل فيلبي", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲫⲓⲗⲓⲡⲡⲏⲥⲓⲟⲩⲥ", "chapters": 4, "kjv_idx": 49},
    {"code": "COL", "canon_order": 12, "name_en": "Colossians", "name_ar": "الرسالة إلى أهل كولوسي", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲕⲟⲗⲟⲥⲥⲁⲉⲓⲥ", "chapters": 4, "kjv_idx": 50},
    {"code": "1TH", "canon_order": 13, "name_en": "1 Thessalonians", "name_ar": "الرسالة الأولى إلى أهل تسالونيكي", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲑⲉⲥⲥⲁⲗⲟⲛⲓⲕⲉⲩⲥ ⲁ", "chapters": 5, "kjv_idx": 51},
    {"code": "2TH", "canon_order": 14, "name_en": "2 Thessalonians", "name_ar": "الرسالة الثانية إلى أهل تسالونيكي", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲑⲉⲥⲥⲁⲗⲟⲛⲓⲕⲉⲩⲥ ⲃ", "chapters": 3, "kjv_idx": 52},
    {"code": "1TI", "canon_order": 15, "name_en": "1 Timothy", "name_ar": "الرسالة الأولى إلى تيموثاوس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲧⲓⲙⲟⲑⲉⲟⲛ ⲁ", "chapters": 6, "kjv_idx": 53},
    {"code": "2TI", "canon_order": 16, "name_en": "2 Timothy", "name_ar": "الرسالة الثانية إلى تيموثاوس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲧⲓⲙⲟⲑⲉⲟⲛ ⲃ", "chapters": 4, "kjv_idx": 54},
    {"code": "TIT", "canon_order": 17, "name_en": "Titus", "name_ar": "الرسالة إلى تيطس", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲧⲓⲧⲟⲛ", "chapters": 3, "kjv_idx": 55},
    {"code": "PHM", "canon_order": 18, "name_en": "Philemon", "name_ar": "الرسالة إلى فليمون", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ⲫⲓⲗⲏⲙⲟⲛⲁ", "chapters": 1, "kjv_idx": 56},
    {"code": "HEB", "canon_order": 19, "name_en": "Hebrews", "name_ar": "الرسالة إلى العبرانيين", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲡⲣⲟⲥ ϩⲉⲃⲣⲁⲓⲟⲩⲥ", "chapters": 13, "kjv_idx": 57},
    {"code": "JAM", "canon_order": 20, "name_en": "James", "name_ar": "رسالة يعقوب الرسول", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲛⲓⲁⲕⲱⲃⲟⲥ", "chapters": 5, "kjv_idx": 58},
    {"code": "1PE", "canon_order": 21, "name_en": "1 Peter", "name_ar": "رسالة بطرس الرسول الأولى", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲙⲡⲉⲧⲣⲟⲥ ⲁ", "chapters": 5, "kjv_idx": 59},
    {"code": "2PE", "canon_order": 22, "name_en": "2 Peter", "name_ar": "رسالة بطرس الرسول الثانية", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲙⲡⲉⲧⲣⲟⲥ ⲃ", "chapters": 3, "kjv_idx": 60},
    {"code": "1JO", "canon_order": 23, "name_en": "1 John", "name_ar": "رسالة يوحنا الرسول الأولى", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲛⲓⲱϩⲁⲛⲛⲏⲥ ⲁ", "chapters": 5, "kjv_idx": 61},
    {"code": "2JO", "canon_order": 24, "name_en": "2 John", "name_ar": "رسالة يوحنا الرسول الثانية", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲛⲓⲱϩⲁⲛⲛⲏⲥ ⲃ", "chapters": 1, "kjv_idx": 62},
    {"code": "3JO", "canon_order": 25, "name_en": "3 John", "name_ar": "رسالة يوحنا الرسول الثالثة", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲛⲓⲱϩⲁⲛⲛⲏⲥ ⲅ", "chapters": 1, "kjv_idx": 63},
    {"code": "JUD", "canon_order": 26, "name_en": "Jude", "name_ar": "رسالة يهوذا الرسول", "name_cop": "ⲧⲉⲡⲓⲥⲧⲟⲗⲏ ⲛⲓⲟⲩⲇⲁ", "chapters": 1, "kjv_idx": 64},
    {"code": "REV", "canon_order": 27, "name_en": "Revelation", "name_ar": "سفر رؤيا يوحنا اللاهوتي", "name_cop": "ⲧⲁⲡⲟⲕⲁⲗⲩⲯⲓⲥ ⲛⲓⲱϩⲁⲛⲛⲏⲥ", "chapters": 22, "kjv_idx": 65}
]

BOOK_MAP = {b['code']: b for b in NT_BOOKS}

def strip_diacritics(text: str) -> str:
    """Removes combining diacritics, jinikim, and punctuation for lexical matching."""
    if not text:
        return ""
    nfd = unicodedata.normalize('NFD', text)
    cleaned = re.sub(r'[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd\u2cfd\u2cfe`\'\-\=⸗·\*\.\?\[\]\(\)\:\;\,\!]', '', nfd)
    return unicodedata.normalize('NFC', cleaned).strip().lower()

def clean_punctuation(text: str) -> str:
    """Clean terminal punctuation for display."""
    if not text: return ""
    return text.strip()

COPTIC_PROCLITICS = [
    'ⲛⲧⲁⲣⲉ', 'ⲙⲡⲁⲧⲉ', 'ϣⲁⲛⲧⲉ', 'ⲡⲉⲧⲉ', 'ⲧⲉⲧⲉ', 'ⲛⲉⲧⲉ',
    'ⲉⲛⲧⲁ', 'ϣⲁⲛⲧ', 'ⲡⲉⲧ', 'ⲧⲉⲧ', 'ⲛⲉⲧ', 'ⲉⲧⲉ', 'ϣⲁⲣⲉ', 'ⲙⲉⲣⲉ', 'ⲙⲡⲉ', 'ⲛⲧⲁ',
    'ⲡⲉϥ', 'ⲧⲉϥ', 'ⲛⲉϥ', 'ⲡⲉⲥ', 'ⲧⲉⲥ', 'ⲛⲉⲥ', 'ⲡⲉⲩ', 'ⲧⲉⲩ', 'ⲛⲉⲩ', 'ⲡⲉⲛ', 'ⲧⲉⲛ', 'ⲛⲉⲛ', 'ⲡⲉⲕ', 'ⲧⲉⲕ', 'ⲛⲉⲕ',
    'ⲡⲟⲩ', 'ⲧⲟⲩ', 'ⲛⲟⲩ', 'Ϧⲉⲛ', 'ϩⲉⲛ', 'ⲛⲉⲙ',
    'ⲡⲓ', 'ϯ', 'ⲛⲓ', 'ⲫⲓ', 'ⲑⲓ', 'ⲡⲉ', 'ⲧⲉ', 'ⲛⲉ', 'ⲡⲁ', 'ⲧⲁ', 'ⲛⲁ',
    'ⲁϥ', 'ⲁⲥ', 'ⲁⲩ', 'ⲁⲓ', 'ⲁⲕ', 'ⲁⲛ', 'ⲉϥ', 'ⲉⲥ', 'ⲉⲩ', 'ⲉⲓ', 'ⲉⲕ', 'ⲉⲛ', 'ⲉⲣ',
    'ⲉⲧ', 'ϩⲛ', 'ϩⲓ', 'ⲙⲛ', 'ⲟⲩ',
    'ⲡ', 'ⲧ', 'ⲛ', 'ⲫ', 'ⲑ', 'ⲙ', 'ⲉ', 'ⲁ'
]

COPTIC_ENCLITICS = ['ⲧⲏⲩⲧⲛ', 'ⲧⲏⲛⲟⲩ', 'ⲟⲩ', 'ϥ', 'ⲥ', 'ⲕ', 'ⲧⲉ', 'ⲧ', 'ⲓ', 'ⲛ']

def get_coptic_token_candidates(clean_tok: str) -> list:
    """Generates stem candidates for an agglutinated Coptic token by stripping proclitics/enclitics."""
    candidates = [clean_tok]
    if len(clean_tok) < 3:
        return candidates

    stripped_once = set()
    # Level 1 prefix stripping
    for p in COPTIC_PROCLITICS:
        if clean_tok.startswith(p) and len(clean_tok) - len(p) >= 2:
            s1 = clean_tok[len(p):]
            if s1 not in candidates:
                candidates.append(s1)
            stripped_once.add(s1)

    # Level 2 prefix stripping (e.g. ⲛ-ⲧ-ⲉⲕⲕⲗⲏⲥⲓⲁ -> ⲧ-ⲉⲕⲕⲗⲏⲥⲓⲁ -> ⲉⲕⲕⲗⲏⲥⲓⲁ)
    for s1 in list(stripped_once):
        if len(s1) >= 3:
            for p in COPTIC_PROCLITICS:
                if s1.startswith(p) and len(s1) - len(p) >= 2:
                    s2 = s1[len(p):]
                    if s2 not in candidates:
                        candidates.append(s2)

    # Level 3 pronominal suffix stripping
    for cand in list(candidates):
        if len(cand) >= 4:
            for s in COPTIC_ENCLITICS:
                if cand.endswith(s) and len(cand) - len(s) >= 2:
                    stem_s = cand[:-len(s)]
                    if stem_s not in candidates:
                        candidates.append(stem_s)

    return candidates

def parse_vpl_file(filepath: str) -> dict:
    """Parses a Verse-Per-Line (VPL) file into a dict of key -> text."""
    verses = {}
    if not os.path.exists(filepath):
        print(f"Warning: File not found: {filepath}")
        return verses
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(' ', 2)
            if len(parts) >= 2:
                book = parts[0].upper()
                cv = parts[1]
                text = parts[2] if len(parts) > 2 else ''
                key = f"{book} {cv}"
                verses[key] = text.strip()
    return verses

def load_json_bible(filepath: str) -> dict:
    """Loads a structured JSON bible (en_kjv.json or ar_svd.json)."""
    verses = {}
    if not os.path.exists(filepath):
        return verses
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    for b_item in data:
        # Match NT book
        for nt_book in NT_BOOKS:
            if b_item.get('name', '').lower() == nt_book['name_en'].lower() or \
               b_item.get('abbrev', '').lower() == nt_book['code'].lower():
                code = nt_book['code']
                for ch_idx, chapter in enumerate(b_item.get('chapters', [])):
                    ch_num = ch_idx + 1
                    for v_idx, verse_text in enumerate(chapter):
                        v_num = v_idx + 1
                        key = f"{code} {ch_num}:{v_num}"
                        verses[key] = verse_text.strip()
                break
    return verses

def main():
    print("=" * 70)
    print(" MASTER COPTIC BIBLE INGESTION & MULTI-DIALECT CONCORDANCE PIPELINE")
    print("=" * 70)

    # 1. Load VPL source datasets
    print("1/5: Loading Coptic and Arabic VPL files...")
    shc_verses = parse_vpl_file(os.path.join(BIBLE_DATA_DIR, 'copshc_vpl', 'copshc_vpl.txt'))
    bhc_verses = parse_vpl_file(os.path.join(BIBLE_DATA_DIR, 'copbhc_vpl', 'copbhc_vpl.txt'))
    cnt_verses = parse_vpl_file(os.path.join(BIBLE_DATA_DIR, 'copcnt_vpl', 'copcnt_vpl.txt'))
    nav_verses = parse_vpl_file(os.path.join(BIBLE_DATA_DIR, 'arbnav_vpl', 'arbnav_vpl.txt'))
    wbtc_verses = parse_vpl_file(os.path.join(BIBLE_DATA_DIR, 'arbwbtc_vpl', 'arbwbtc_vpl.txt'))

    # Load JSON bibles
    kjv_verses = load_json_bible(os.path.join(BASE_DIR, 'data', 'corpora_raw', 'bibles', 'en_kjv.json'))
    svd_verses = load_json_bible(os.path.join(BASE_DIR, 'data', 'corpora_raw', 'bibles', 'ar_svd.json'))

    print(f"  Loaded Sahidic (copshc): {len(shc_verses)} verses")
    print(f"  Loaded Bohairic (copbhc): {len(bhc_verses)} verses")
    print(f"  Loaded Bohairic Vocalized (copcnt): {len(cnt_verses)} verses")
    print(f"  Loaded Arabic Ketab El Hayat: {len(nav_verses)} verses")
    print(f"  Loaded English KJV: {len(kjv_verses)} verses")

    # 2. Open SQLite Database and initialize schema
    print("\n2/5: Initializing SQLite database schema...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS bible_verses;")
    cur.execute("DROP TABLE IF EXISTS bible_verses_fts;")

    cur.execute("""
    CREATE TABLE bible_verses (
        verse_id TEXT PRIMARY KEY,
        canon_order INTEGER NOT NULL,
        book TEXT NOT NULL,
        book_name_en TEXT NOT NULL,
        book_name_ar TEXT NOT NULL,
        book_name_cop TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        coptic_sahidic TEXT NOT NULL,
        coptic_bohairic TEXT NOT NULL,
        coptic_bohairic_plain TEXT,
        arabic_nav TEXT,
        arabic_svd TEXT,
        arabic_wbtc TEXT,
        english_kjv TEXT
    );
    """)

    cur.execute("CREATE INDEX idx_bv_book_chapter ON bible_verses(book, chapter);")
    cur.execute("CREATE INDEX idx_bv_canon ON bible_verses(canon_order);")
    cur.execute("CREATE INDEX idx_bv_book ON bible_verses(book);")

    cur.execute("""
    CREATE VIRTUAL TABLE bible_verses_fts USING fts5(
        verse_id UNINDEXED,
        coptic_sahidic,
        coptic_bohairic,
        coptic_bohairic_plain,
        arabic_nav,
        arabic_svd,
        english_kjv,
        tokenize='trigram'
    );
    """)

    # 3. Populate bible_verses table
    print("\n3/5: Populating parallel bible_verses table...")
    all_keys = set(shc_verses.keys()) | set(bhc_verses.keys()) | set(cnt_verses.keys())
    
    # Sort keys canonically
    def sort_key(k):
        parts = k.split(' ')
        b_code = parts[0]
        c, v = map(int, parts[1].split(':'))
        b_order = BOOK_MAP.get(b_code, {}).get('canon_order', 99)
        return (b_order, c, v)

    sorted_keys = sorted(list(all_keys), key=sort_key)
    
    insert_rows = []
    fts_rows = []
    chapter_cache = defaultdict(list)

    for order_idx, k in enumerate(sorted_keys, start=1):
        parts = k.split(' ')
        book_code = parts[0]
        c_num, v_num = map(int, parts[1].split(':'))

        b_meta = BOOK_MAP.get(book_code, {
            "name_en": book_code,
            "name_ar": book_code,
            "name_cop": book_code
        })

        verse_id = f"{book_code}.{c_num}.{v_num}"
        c_shc = clean_punctuation(shc_verses.get(k, ''))
        c_cnt = clean_punctuation(cnt_verses.get(k, ''))
        c_bhc = clean_punctuation(bhc_verses.get(k, ''))
        a_nav = clean_punctuation(nav_verses.get(k, ''))
        a_wbtc = clean_punctuation(wbtc_verses.get(k, ''))
        a_svd = clean_punctuation(svd_verses.get(k, ''))
        e_kjv = clean_punctuation(kjv_verses.get(k, ''))

        # If plain Bohairic is missing, fallback to stripped vocalized
        if not c_bhc and c_cnt:
            c_bhc = strip_diacritics(c_cnt).upper()

        row_tuple = (
            verse_id,
            order_idx,
            book_code,
            b_meta['name_en'],
            b_meta['name_ar'],
            b_meta['name_cop'],
            c_num,
            v_num,
            c_shc,
            c_cnt,
            c_bhc,
            a_nav,
            a_svd,
            a_wbtc,
            e_kjv
        )
        insert_rows.append(row_tuple)

        fts_rows.append((
            verse_id,
            c_shc,
            c_cnt,
            c_bhc,
            a_nav,
            a_svd,
            e_kjv
        ))

        # Add to static chapter cache
        chapter_key = f"{book_code}_{c_num}"
        chapter_cache[chapter_key].append({
            "verse_id": verse_id,
            "verse": v_num,
            "coptic_sahidic": c_shc,
            "coptic_bohairic": c_cnt,
            "coptic_bohairic_plain": c_bhc,
            "arabic_nav": a_nav,
            "arabic_svd": a_svd,
            "arabic_wbtc": a_wbtc,
            "english_kjv": e_kjv
        })

    cur.executemany("""
    INSERT INTO bible_verses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, insert_rows)

    cur.executemany("""
    INSERT INTO bible_verses_fts VALUES (?, ?, ?, ?, ?, ?, ?);
    """, fts_rows)

    conn.commit()
    print(f"  Inserted {len(insert_rows)} parallel verses into `bible_verses` and FTS5 table.")

    # 4. Multi-Dialect Concordance Extraction & Lemma Linking
    print("\n4/5: Extracting multi-dialect concordance & linking to dictionary lemmas...")
    
    # Load all dictionary lemmas & inflected forms
    dict_rows = cur.execute("SELECT id, coptic_name, dialects, pos, inflection_json FROM entries").fetchall()
    
    lemma_map = {} # clean_form -> list of (id, canonical_coptic_name, primary_dialect)
    canonical_lemmas = set()

    for r in dict_rows:
        eid, cname, dialects, pos, infl_json = r
        clean_cname = strip_diacritics(cname)
        canonical_lemmas.add(cname)
        
        if clean_cname not in lemma_map:
            lemma_map[clean_cname] = []
        lemma_map[clean_cname].append((eid, cname, dialects or ''))

        # Add inflected forms
        if infl_json:
            try:
                infl_list = json.loads(infl_json)
                for item in infl_list:
                    orth = item.get('orth', '')
                    if orth:
                        clean_orth = strip_diacritics(orth)
                        if clean_orth not in lemma_map:
                            lemma_map[clean_orth] = []
                        lemma_map[clean_orth].append((eid, cname, dialects or ''))
            except Exception:
                pass

    print(f"  Loaded {len(dict_rows)} entries with {len(lemma_map)} indexed surface form keys.")

    # Match biblical verses to create rich citations
    # Limit max 5 biblical citations per lemma per dialect to keep DB lean and fast
    lemma_citations_sahidic = defaultdict(list)
    lemma_citations_bohairic = defaultdict(list)

    for row in insert_rows:
        verse_id, order_idx, book_code, book_name_en, book_name_ar, book_name_cop, c_num, v_num, c_shc, c_cnt, c_bhc, a_nav, a_svd, a_wbtc, e_kjv = row
        ref_en = f"{book_name_en} {c_num}:{v_num}"
        ref_ar = f"{book_name_ar} {c_num}:{v_num}"
        urn_shc = f"urn:cts:copticLit:nt.{book_code.lower()}.sahidica:{c_num}.{v_num}"
        urn_bhc = f"urn:cts:copticLit:nt.{book_code.lower()}.bohairica:{c_num}.{v_num}"

        best_ar = a_nav or a_svd or a_wbtc
        best_en = e_kjv

        # 4a. Process Sahidic Verse Tokens
        if c_shc:
            tokens_shc = re.findall(r'[\w\u0300-\u036f\ufe20-\ufe2f]+', c_shc)
            matched_lemmas_in_verse = set()
            for tok in tokens_shc:
                clean_tok = strip_diacritics(tok)
                if len(clean_tok) < 2:
                    continue
                
                # Generate morphological stem candidates
                candidates = get_coptic_token_candidates(clean_tok)
                for cand in candidates:
                    if cand in lemma_map:
                        for eid, canonical_lemma, entry_dialects in lemma_map[cand]:
                            if canonical_lemma not in matched_lemmas_in_verse:
                                matched_lemmas_in_verse.add(canonical_lemma)
                                if len(lemma_citations_sahidic[canonical_lemma]) < 8:
                                    lemma_citations_sahidic[canonical_lemma].append({
                                        "id": f"bib_shc_{book_code.lower()}_{c_num}_{v_num}_{eid}",
                                        "lemma": canonical_lemma,
                                        "lemma_clean": strip_diacritics(canonical_lemma),
                                        "reference": ref_en,
                                        "reference_ar": ref_ar,
                                        "urn": urn_shc,
                                        "genre": "biblical",
                                        "dialect": "Sahidic",
                                        "source_name": f"{book_name_en} ({book_name_cop})",
                                        "coptic_text": c_shc,
                                        "english_translation": best_en,
                                        "arabic_translation": best_ar
                                    })

        # 4b. Process Bohairic Verse Tokens (using vocalized c_cnt)
        if c_cnt:
            tokens_bhc = re.findall(r'[\w\u0300-\u036f\ufe20-\ufe2f\u2cfd\u2cfe]+', c_cnt)
            matched_lemmas_in_verse = set()
            for tok in tokens_bhc:
                clean_tok = strip_diacritics(tok)
                if len(clean_tok) < 2:
                    continue
                
                # Generate morphological stem candidates
                candidates = get_coptic_token_candidates(clean_tok)
                for cand in candidates:
                    if cand in lemma_map:
                        for eid, canonical_lemma, entry_dialects in lemma_map[cand]:
                            if canonical_lemma not in matched_lemmas_in_verse:
                                matched_lemmas_in_verse.add(canonical_lemma)
                                if len(lemma_citations_bohairic[canonical_lemma]) < 8:
                                    lemma_citations_bohairic[canonical_lemma].append({
                                        "id": f"bib_bhc_{book_code.lower()}_{c_num}_{v_num}_{eid}",
                                        "lemma": canonical_lemma,
                                        "lemma_clean": strip_diacritics(canonical_lemma),
                                        "reference": ref_en,
                                        "reference_ar": ref_ar,
                                        "urn": urn_bhc,
                                        "genre": "biblical",
                                        "dialect": "Bohairic",
                                        "source_name": f"{book_name_en} ({book_name_cop})",
                                        "coptic_text": c_cnt,
                                        "english_translation": best_en,
                                        "arabic_translation": best_ar
                                    })

    # Insert citations into database
    all_citations = []
    for lem, cit_list in lemma_citations_sahidic.items():
        all_citations.extend(cit_list)
    for lem, cit_list in lemma_citations_bohairic.items():
        all_citations.extend(cit_list)

    print(f"  Generated {len(all_citations)} verified multi-dialect biblical citations.")
    
    # Check if citations table exists, create if not
    cur.execute("""
    CREATE TABLE IF NOT EXISTS citations (
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
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_citations_lemma_clean ON citations(lemma_clean);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_citations_dialect ON citations(dialect);")

    # Clear prior biblical citations to ensure clean sync
    cur.execute("DELETE FROM citations WHERE genre = 'biblical';")

    # Insert or replace newly extracted multi-dialect biblical citations
    citation_tuples = [
        (c['id'], c['lemma'], c['lemma_clean'], c['reference'], c['reference_ar'],
         c['urn'], c['genre'], c['dialect'], c['source_name'], c['coptic_text'],
         c['english_translation'], c['arabic_translation'])
        for c in all_citations
    ]
    cur.executemany("""
    INSERT OR REPLACE INTO citations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, citation_tuples)
    conn.commit()

    # 5. Export Static JSON Assets for Offline PWA and Fast Frontend Reader
    print("\n5/5: Exporting static JSON files to public/data/bible/...")
    out_bible_dir = os.path.join(BASE_DIR, 'public', 'data', 'bible')
    out_chapters_dir = os.path.join(out_bible_dir, 'chapters')
    os.makedirs(out_chapters_dir, exist_ok=True)

    # 5a. Save books.json
    books_json_path = os.path.join(out_bible_dir, 'books.json')
    with open(books_json_path, 'w', encoding='utf-8') as f:
        json.dump(NT_BOOKS, f, indent=2, ensure_ascii=False)
    print(f"  Saved {books_json_path}")

    # 5b. Save individual chapter JSON files for instant lazy loading
    for ch_key, v_list in chapter_cache.items():
        ch_file = os.path.join(out_chapters_dir, f"{ch_key}.json")
        with open(ch_file, 'w', encoding='utf-8') as f:
            json.dump(v_list, f, ensure_ascii=False)
    print(f"  Saved {len(chapter_cache)} static chapter JSON files in {out_chapters_dir}")

    # 5c. Update public/data/corpus_concordance.json
    concordance_dict = defaultdict(list)
    for c in all_citations:
        concordance_dict[c['lemma_clean']].append(c)

    concordance_json_path = os.path.join(BASE_DIR, 'public', 'data', 'corpus_concordance.json')
    with open(concordance_json_path, 'w', encoding='utf-8') as f:
        json.dump(concordance_dict, f, ensure_ascii=False)
    print(f"  Updated static concordance index: {concordance_json_path}")

    conn.close()
    print("\n" + "=" * 70)
    print(" ✅ MASTER BIBLE INGESTION COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    main()
