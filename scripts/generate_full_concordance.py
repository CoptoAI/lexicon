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

# 1. Load English and Arabic Bibles
print("1/5: Loading English and Arabic Bibles...")
with open('d:/Copto/dictionary/data/corpora_raw/bibles/en_kjv.json', 'r', encoding='utf-8-sig') as f:
    en_bible_data = json.load(f)

with open('d:/Copto/dictionary/data/corpora_raw/bibles/ar_svd.json', 'r', encoding='utf-8-sig') as f:
    ar_bible_data = json.load(f)

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

# 2. Load Coptic Dictionary entries & inflections
print("2/5: Loading dictionary headwords & forms...")
import sqlite3
con = sqlite3.connect('d:/Copto/dictionary/d1_coptic_dict.db')
cur = con.cursor()

dict_entries = cur.execute("SELECT id, coptic_name, xml_id, inflection_json, dialects FROM entries").fetchall()

# Map any form/spelling/dialect/compound to its canonical lemma
lemma_alias_map = {} # alias_clean -> canonical_coptic_name
all_canonical_lemmas = set()

for row in dict_entries:
    eid, cname, xml_id, infl_json, dialects = row
    cname_clean = strip_diacritics(cname)
    all_canonical_lemmas.add(cname)
    
    lemma_alias_map[cname] = cname
    lemma_alias_map[cname_clean] = cname
    
    if infl_json:
        try:
            infls = json.loads(infl_json)
            for item in infls:
                orth = item.get('orth', '')
                if orth:
                    clean_orth = strip_diacritics(orth)
                    if clean_orth not in lemma_alias_map:
                        lemma_alias_map[clean_orth] = cname
                    if orth not in lemma_alias_map:
                        lemma_alias_map[orth] = cname
        except:
            pass

print(f"Tracking {len(all_canonical_lemmas)} canonical lemmas with {len(lemma_alias_map)} alias forms.")

# 3. Process Corpora
concordance_by_lemma = defaultdict(list)
seen_urns_by_lemma = defaultdict(set)

def add_citation(canonical_lemma, citation_obj, max_per_lemma=6):
    if len(concordance_by_lemma[canonical_lemma]) >= max_per_lemma:
        return
    urn = citation_obj.get('urn', '')
    if urn and urn in seen_urns_by_lemma[canonical_lemma]:
        return
    seen_urns_by_lemma[canonical_lemma].add(urn)
    concordance_by_lemma[canonical_lemma].append(citation_obj)

def parse_tt_tokens_and_lemmas(v_body):
    norm_groups = re.findall(r'<norm_group norm_group="([^"]+)">', v_body)
    if norm_groups:
        coptic_sent = " ".join(norm_groups)
    else:
        origs = re.findall(r'<orig orig="([^"]+)">', v_body)
        coptic_sent = " ".join(origs)
    coptic_sent = coptic_sent.strip()
    
    # Extract unique lemmas
    lemmas = set()
    for lem in re.findall(r'lemma="([^"]+)"', v_body):
        lem = lem.strip()
        if lem and len(lem) > 0 and lem not in ['UNKNOWN', 'PUNCT', '·', 'ⲻ', '.', ',']:
            lemmas.add(lem)
            lemmas.add(strip_diacritics(lem))
            
    return coptic_sent, lemmas

# Process New Testament
print("3/5: Processing Sahidica New Testament (all 27 books)...")
nt_zip = 'd:/Copto/dictionary/data/corpora_raw/sahidica.nt_TT.zip'
if os.path.exists(nt_zip):
    with zipfile.ZipFile(nt_zip, 'r') as z:
        for fname in z.namelist():
            if not fname.endswith('.tt'):
                continue
            m = re.match(r'^(\d+_[A-Za-z0-9]+)_(\d+)\.tt$', fname)
            book_prefix = m.group(1) if m else fname.replace('.tt', '')
            ch_num = int(m.group(2)) if m else 1
            
            book_info = BOOK_MAP.get(book_prefix, (book_prefix, book_prefix, 'nt.bible'))
            en_book_name, ar_book_name, urn_prefix = book_info
            
            content = z.read(fname).decode('utf-8', errors='replace')
            verse_blocks = re.split(r'<verse_n verse_n="(\d+)">', content)
            
            for i in range(1, len(verse_blocks), 2):
                v_num = int(verse_blocks[i])
                v_body = verse_blocks[i+1]
                
                coptic_sent, v_lemmas = parse_tt_tokens_and_lemmas(v_body)
                if not coptic_sent:
                    continue
                
                trans_m = re.search(r'<translation translation="([^"]+)"', v_body)
                en_trans = trans_m.group(1) if trans_m else en_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                ar_trans = ar_verse_lookup[ar_book_name.lower()][ch_num].get(v_num, "") or ar_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                
                urn_m = re.search(r'<vid_n vid_n="([^"]+)"', v_body)
                urn = urn_m.group(1) if urn_m else f"urn:cts:copticLit:{urn_prefix}:{ch_num}.{v_num}"
                
                cit_id = f"nt_{urn_prefix}_{ch_num}_{v_num}"
                
                cit_obj = {
                    'id': cit_id,
                    'reference': f"{en_book_name} {ch_num}:{v_num}",
                    'reference_ar': f"{ar_book_name} {ch_num}:{v_num}",
                    'urn': urn,
                    'genre': 'biblical',
                    'dialect': 'Sahidic',
                    'source_name': 'Sahidica New Testament',
                    'coptic_text': coptic_sent,
                    'english_translation': en_trans,
                    'arabic_translation': ar_trans
                }
                
                for lem in v_lemmas:
                    canonical = lemma_alias_map.get(lem) or lemma_alias_map.get(strip_diacritics(lem))
                    if canonical:
                        add_citation(canonical, cit_obj, max_per_lemma=4)

# Process Old Testament
print("4/5: Processing Sahidic Old Testament Septuagint...")
ot_zip = 'd:/Copto/dictionary/data/corpora_raw/sahidic.ot_TT.zip'
if os.path.exists(ot_zip):
    with zipfile.ZipFile(ot_zip, 'r') as z:
        for fname in z.namelist():
            if not fname.endswith('.tt'):
                continue
            m = re.match(r'^(\d+_[A-Za-z0-9]+)_(\d+)\.tt$', fname)
            book_prefix = m.group(1) if m else fname.replace('.tt', '')
            ch_num = int(m.group(2)) if m else 1
            
            book_info = BOOK_MAP.get(book_prefix, (book_prefix, book_prefix, 'ot.bible'))
            en_book_name, ar_book_name, urn_prefix = book_info
            
            content = z.read(fname).decode('utf-8', errors='replace')
            verse_blocks = re.split(r'<verse_n verse_n="(\d+)">', content)
            
            for i in range(1, len(verse_blocks), 2):
                v_num = int(verse_blocks[i])
                v_body = verse_blocks[i+1]
                
                coptic_sent, v_lemmas = parse_tt_tokens_and_lemmas(v_body)
                if not coptic_sent:
                    continue
                
                trans_m = re.search(r'<translation translation="([^"]+)"', v_body)
                en_trans = trans_m.group(1) if trans_m else en_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                ar_trans = ar_verse_lookup[ar_book_name.lower()][ch_num].get(v_num, "") or ar_verse_lookup[en_book_name.lower()][ch_num].get(v_num, "")
                
                urn_m = re.search(r'<vid_n vid_n="([^"]+)"', v_body)
                urn = urn_m.group(1) if urn_m else f"urn:cts:copticLit:{urn_prefix}:{ch_num}.{v_num}"
                
                cit_id = f"ot_{urn_prefix}_{ch_num}_{v_num}"
                
                cit_obj = {
                    'id': cit_id,
                    'reference': f"{en_book_name} {ch_num}:{v_num}",
                    'reference_ar': f"{ar_book_name} {ch_num}:{v_num}",
                    'urn': urn,
                    'genre': 'biblical',
                    'dialect': 'Sahidic',
                    'source_name': 'Sahidic Old Testament (Septuagint)',
                    'coptic_text': coptic_sent,
                    'english_translation': en_trans,
                    'arabic_translation': ar_trans
                }
                
                for lem in v_lemmas:
                    canonical = lemma_alias_map.get(lem) or lemma_alias_map.get(strip_diacritics(lem))
                    if canonical:
                        add_citation(canonical, cit_obj, max_per_lemma=4)

# Process Patristic & Monastic texts
print("5/5: Processing Patristic, Shenoute, and Desert Fathers corpora...")
patristic_dir = 'd:/Copto/dictionary/data/corpora_raw/patristic_tt'
if os.path.exists(patristic_dir):
    for pf in os.listdir(patristic_dir):
        if not pf.endswith('.tt'):
            continue
        filepath = os.path.join(patristic_dir, pf)
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            p_content = f.read()
            
        doc_title_m = re.search(r'title="([^"]+)"', p_content)
        doc_title = doc_title_m.group(1) if doc_title_m else pf.replace('.tt', '')
        
        doc_urn_m = re.search(r'document_cts_urn="([^"]+)"', p_content)
        doc_urn = doc_urn_m.group(1) if doc_urn_m else ""
        
        is_shenoute = "shenoute" in pf.lower() or "besa" in pf.lower()
        is_ap = "ap" in pf.lower() or "apophthegmata" in pf.lower()
        genre = "monastic" if is_shenoute else ("patristic" if is_ap else "patristic")
        source_name = "Works of Shenoute" if is_shenoute else ("Desert Fathers (Apophthegmata Patrum)" if is_ap else "Patristic Texts")
        
        p_blocks = re.split(r'<verse_n\b[^>]*verse_n="([^"]+)"[^>]*>', p_content)
        if len(p_blocks) > 1:
            for i in range(1, len(p_blocks), 2):
                v_num = p_blocks[i]
                v_body = p_blocks[i+1]
                
                coptic_sent, v_lemmas = parse_tt_tokens_and_lemmas(v_body)
                if not coptic_sent:
                    continue
                
                trans_m = re.search(r'<translation translation="([^"]+)"', v_body)
                en_trans = trans_m.group(1) if trans_m else ""
                
                urn_m = re.search(r'<vid_n vid_n="([^"]+)"', v_body)
                urn = urn_m.group(1) if urn_m else f"{doc_urn}.{v_num}"
                
                cit_id = f"pat_{pf[:15]}_{v_num}"
                
                cit_obj = {
                    'id': cit_id,
                    'reference': f"{doc_title} §{v_num}",
                    'reference_ar': f"{doc_title} فقرة {v_num}",
                    'urn': urn,
                    'genre': genre,
                    'dialect': 'Sahidic',
                    'source_name': source_name,
                    'coptic_text': coptic_sent,
                    'english_translation': en_trans,
                    'arabic_translation': ''
                }
                
                for lem in v_lemmas:
                    canonical = lemma_alias_map.get(lem) or lemma_alias_map.get(strip_diacritics(lem))
                    if canonical:
                        add_citation(canonical, cit_obj, max_per_lemma=6)

print(f"\nSUCCESS: Indexed {len(concordance_by_lemma)} unique Coptic dictionary headwords with {sum(len(v) for v in concordance_by_lemma.values())} manuscript citations!")

# Also ensure clean lemma key normalization in JSON
final_output = {}
for canonical_lem, cits in concordance_by_lemma.items():
    final_output[canonical_lem] = cits
    clean = strip_diacritics(canonical_lem)
    if clean != canonical_lem:
        final_output[clean] = cits

out_path = 'd:/Copto/dictionary/data/corpus_concordance.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(final_output, f, ensure_ascii=False, indent=2)

print(f"Exported clean concordance map to {out_path} ({os.path.getsize(out_path)} bytes).")
