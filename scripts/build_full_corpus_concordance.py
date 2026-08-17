#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-Performance Corpus Concordance Builder for CoptoLex.
Extracts verified Coptic sentences, lemma occurrences, English translations,
and Arabic translations from Sahidic New Testament, Old Testament, and Patristic corpora.
"""

import zipfile
import json
import re
import os
import sys
import unicodedata
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

# Ensure utils is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.bible_books import BOOK_MAP
from utils.arabic_lexicon import normalize_arabic

def strip_diacritics(text: str) -> str:
    if not text:
        return ""
    nfd = unicodedata.normalize('NFD', text)
    cleaned = re.sub(r'[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]', '', nfd)
    return unicodedata.normalize('NFC', cleaned).strip().lower()

# 1. Load English and Arabic Bibles for fast verse lookup
print("Loading English and Arabic Bibles...")
with open('d:/Copto/dictionary/data/corpora_raw/bibles/en_kjv.json', 'r', encoding='utf-8-sig') as f:
    en_bible_data = json.load(f)

with open('d:/Copto/dictionary/data/corpora_raw/bibles/ar_svd.json', 'r', encoding='utf-8-sig') as f:
    ar_bible_data = json.load(f)

# Map book names/abbrevs to chapters/verses
# Format: lookup[book_name.lower()][chapter_num][verse_num] = text
en_verse_lookup = defaultdict(lambda: defaultdict(dict))
for b in en_bible_data:
    bname = b.get('name', '').lower()
    babbrev = b.get('abbrev', '').lower()
    for ch_idx, ch in enumerate(b['chapters']):
        ch_num = ch_idx + 1
        for v_idx, v_text in enumerate(ch):
            v_num = v_idx + 1
            en_verse_lookup[bname][ch_num][v_num] = v_text
            if babbrev:
                en_verse_lookup[babbrev][ch_num][v_num] = v_text

ar_verse_lookup = defaultdict(lambda: defaultdict(dict))
for b in ar_bible_data:
    bname = b.get('name', '').lower()
    babbrev = b.get('abbrev', '').lower()
    for ch_idx, ch in enumerate(b['chapters']):
        ch_num = ch_idx + 1
        for v_idx, v_text in enumerate(ch):
            v_num = v_idx + 1
            ar_verse_lookup[bname][ch_num][v_num] = v_text
            if babbrev:
                ar_verse_lookup[babbrev][ch_num][v_num] = v_text

print(f"Loaded English Bible ({len(en_bible_data)} books) and Arabic Bible ({len(ar_bible_data)} books).")

# 2. Load all dictionary lemmas to ensure exact lemma matching
print("Loading Coptic dictionary entries...")
import sqlite3
con = sqlite3.connect('d:/Copto/dictionary/d1_coptic_dict.db')
cur = con.cursor()
dict_entries = cur.execute("SELECT id, coptic_name, xml_id FROM entries").fetchall()

known_lemmas = set()
lemma_to_entry_ids = defaultdict(list)
for eid, cname, xml_id in dict_entries:
    cname_clean = strip_diacritics(cname)
    known_lemmas.add(cname)
    known_lemmas.add(cname_clean)
    lemma_to_entry_ids[cname].append(eid)
    lemma_to_entry_ids[cname_clean].append(eid)

print(f"Loaded {len(dict_entries)} dictionary entries, tracking {len(known_lemmas)} distinct lemma forms.")

# 3. Parse a TT zip archive
def process_tt_zip(zip_path, genre, corpus_name, lemma_concordance, max_per_lemma=6):
    print(f"Processing {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        for fname in z.namelist():
            if not fname.endswith('.tt'):
                continue
            
            # Identify book and chapter from filename
            # e.g. '40_Matthew_01.tt', '01_Genesis_01.tt'
            m = re.match(r'^(\d+_[A-Za-z0-9]+)_(\d+)\.tt$', fname)
            book_prefix = m.group(1) if m else fname.replace('.tt', '')
            ch_num = int(m.group(2)) if m else 1
            
            book_info = BOOK_MAP.get(book_prefix, (book_prefix, book_prefix, 'bible'))
            en_book_name, ar_book_name, urn_prefix = book_info
            
            content = z.read(fname).decode('utf-8', errors='replace')
            
            # Split by verse_n
            # Format in TT: <verse_n verse_n="1"> ... </verse_n>
            verse_blocks = re.split(r'<verse_n verse_n="(\d+)">', content)
            for i in range(1, len(verse_blocks), 2):
                v_num = int(verse_blocks[i])
                v_body = verse_blocks[i+1]
                
                # Extract Coptic text from norm_group or orig_group
                norm_groups = re.findall(r'<norm_group norm_group="([^"]+)">', v_body)
                if norm_groups:
                    coptic_sent = " ".join(norm_groups)
                else:
                    origs = re.findall(r'<orig orig="([^"]+)">', v_body)
                    coptic_sent = " ".join(origs)
                
                coptic_sent = coptic_sent.strip()
                if not coptic_sent:
                    continue
                
                # Extract embedded translation or lookup from Bible
                trans_m = re.search(r'<translation translation="([^"]+)"', v_body)
                en_trans = trans_m.group(1) if trans_m else en_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                ar_trans = ar_verse_lookup[ar_book_name.lower()][ch_num].get(v_num, "") or ar_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                
                # Greek if present
                grk_m = re.search(r'<sbl_greek sbl_greek="([^"]+)"', v_body)
                greek = grk_m.group(1) if grk_m else ""
                
                # CTS URN
                urn_m = re.search(r'<vid_n vid_n="([^"]+)"', v_body)
                urn = urn_m.group(1) if urn_m else f"urn:cts:copticLit:{urn_prefix}:{ch_num}.{v_num}"
                
                # Reference
                reference_en = f"{en_book_name} {ch_num}:{v_num}"
                reference_ar = f"{ar_book_name} {ch_num}:{v_num}"
                
                # Extract all unique lemmas in this verse
                v_lemmas = set()
                for lem in re.findall(r'lemma="([^"]+)"', v_body):
                    lem = lem.strip()
                    if lem and len(lem) > 0 and lem != 'UNKNOWN' and lem != 'PUNCT':
                        v_lemmas.add(lem)
                        v_lemmas.add(strip_diacritics(lem))
                
                # Assign to lemma concordance
                verse_obj = {
                    'coptic': coptic_sent,
                    'english': en_trans,
                    'arabic': ar_trans,
                    'greek': greek,
                    'urn': urn,
                    'reference': reference_en,
                    'reference_ar': reference_ar,
                    'genre': genre,
                    'corpus': corpus_name
                }
                
                for lem in v_lemmas:
                    if lem in known_lemmas:
                        if len(lemma_concordance[lem]) < max_per_lemma:
                            # Avoid duplicate verses
                            if not any(x['urn'] == urn for x in lemma_concordance[lem]):
                                lemma_concordance[lem].append(verse_obj)

# 4. Main Concordance Collection
lemma_concordance = defaultdict(list)

# Process New Testament
nt_zip = 'd:/Copto/dictionary/data/corpora_raw/sahidica.nt_TT.zip'
if os.path.exists(nt_zip):
    process_tt_zip(nt_zip, 'Biblical', 'Sahidica New Testament', lemma_concordance, max_per_lemma=4)

# Process Old Testament
ot_zip = 'd:/Copto/dictionary/data/corpora_raw/sahidic.ot_TT.zip'
if os.path.exists(ot_zip):
    process_tt_zip(ot_zip, 'Biblical', 'Sahidic Old Testament (Septuagint)', lemma_concordance, max_per_lemma=4)

# Process Patristic & Monastic standalone TT files
patristic_dir = 'd:/Copto/dictionary/data/corpora_raw/patristic_tt'
if os.path.exists(patristic_dir):
    print("Processing Patristic TT files...")
    for pf in os.listdir(patristic_dir):
        if not pf.endswith('.tt'):
            continue
        filepath = os.path.join(patristic_dir, pf)
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            p_content = f.read()
        
        # Extract title and URN
        doc_title_m = re.search(r'title="([^"]+)"', p_content)
        doc_title = doc_title_m.group(1) if doc_title_m else pf.replace('.tt', '')
        
        doc_urn_m = re.search(r'document_cts_urn="([^"]+)"', p_content)
        doc_urn = doc_urn_m.group(1) if doc_urn_m else ""
        
        genre = "Shenoute & Monastic" if "shenoute" in pf.lower() or "besa" in pf.lower() else "Patristic"
        corpus_name = "Apophthegmata Patrum" if "ap" in pf.lower() else ("Works of Shenoute" if "shenoute" in pf.lower() else "Patristic Texts")
        
        # Split by verse_n or sentence
        p_blocks = re.split(r'<verse_n\b[^>]*verse_n="([^"]+)"[^>]*>', p_content)
        if len(p_blocks) > 1:
            for i in range(1, len(p_blocks), 2):
                v_num = p_blocks[i]
                v_body = p_blocks[i+1]
                
                norm_groups = re.findall(r'<norm_group norm_group="([^"]+)">', v_body)
                coptic_sent = " ".join(norm_groups).strip()
                if not coptic_sent:
                    continue
                
                trans_m = re.search(r'<translation translation="([^"]+)"', v_body)
                en_trans = trans_m.group(1) if trans_m else ""
                
                urn_m = re.search(r'<vid_n vid_n="([^"]+)"', v_body)
                urn = urn_m.group(1) if urn_m else f"{doc_urn}.{v_num}"
                
                v_lemmas = set()
                for lem in re.findall(r'lemma="([^"]+)"', v_body):
                    lem = lem.strip()
                    if lem and len(lem) > 0 and lem != 'UNKNOWN' and lem != 'PUNCT':
                        v_lemmas.add(lem)
                        v_lemmas.add(strip_diacritics(lem))
                
                verse_obj = {
                    'coptic': coptic_sent,
                    'english': en_trans,
                    'arabic': '',
                    'greek': '',
                    'urn': urn,
                    'reference': f"{doc_title} §{v_num}",
                    'reference_ar': f"{doc_title} §{v_num}",
                    'genre': genre,
                    'corpus': corpus_name
                }
                
                for lem in v_lemmas:
                    if lem in known_lemmas:
                        if len(lemma_concordance[lem]) < 6:
                            if not any(x['urn'] == urn for x in lemma_concordance[lem]):
                                lemma_concordance[lem].append(verse_obj)

print(f"Total unique Coptic lemmas indexed: {len(lemma_concordance)}")
total_citations = sum(len(v) for v in lemma_concordance.values())
print(f"Total manuscript citations: {total_citations}")

# 5. Export to corpus_concordance.json
out_path = 'd:/Copto/dictionary/data/corpus_concordance.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(lemma_concordance, f, ensure_ascii=False, indent=2)

print(f"Saved {os.path.getsize(out_path)} bytes to {out_path}!")
