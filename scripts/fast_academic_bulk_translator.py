#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-Speed Academic Coptic-Arabic Bulk Translator
Applies all 13,646 cached translations to SQLite and rebuilds FTS5 trigram table.
"""

import sqlite3
import json
import re
import os
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.arabic_academic_lexicon import COPTIC_ACADEMIC_CURATED
from utils.arabic_translator import normalize_arabic, clean_gloss

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'arabic_translations_cache.json')
DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'd1_coptic_dict.db')

def main():
    print("=== Applying Academic Coptic-Arabic Translations ===", flush=True)
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    
    cur.execute('SELECT id, coptic_name, coptic_clean, pos, en, de, fr, etym, origin, en_json, de_json, fr_json FROM entries')
    entries = cur.fetchall()
    total = len(entries)
    print(f"Loaded {total} entries from database.", flush=True)
    
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        cache = json.load(f)
    print(f"Loaded {len(cache)} cached translations from {CACHE_FILE}.", flush=True)
    
    updates_entries = []
    updates_fts = []
    success_count = 0
    
    for entry in entries:
        (entry_id, coptic_name, coptic_clean, pos, en, de, fr, etym, origin, en_json, de_json, fr_json) = entry
        
        # 1. Check curated Coptic table
        curated = COPTIC_ACADEMIC_CURATED.get(coptic_name) or COPTIC_ACADEMIC_CURATED.get(coptic_clean)
        if curated:
            citations = []
            if en_json:
                try:
                    p = json.loads(en_json)
                    if p and 'citations' in p[0]: citations = p[0]['citations']
                except: pass
            ar_senses = [{'definition': curated, 'citations': citations}]
            ar_json_str = json.dumps(ar_senses, ensure_ascii=False)
            ar_norm = normalize_arabic(curated)
            
            updates_entries.append((curated, ar_json_str, entry_id))
            updates_fts.append((
                entry_id, coptic_name, coptic_clean or coptic_name,
                en or '', de or '', fr or '', ar_norm,
                etym or '', pos or '', origin or ''
            ))
            success_count += 1
            continue
            
        # 2. Parse English senses
        en_senses = json.loads(en_json) if en_json else []
        ar_senses = []
        combined_defs = []
        
        for sense in en_senses:
            cleaned = clean_gloss(sense.get('definition', ''))
            ar_trans = cache.get(cleaned, '')
            if ar_trans:
                ar_senses.append({
                    'definition': ar_trans,
                    'citations': sense.get('citations', [])
                })
                combined_defs.append(ar_trans)
                
        # 3. Fallback to German senses
        if not ar_senses and de_json:
            try:
                de_s = json.loads(de_json)
                for sense in de_s:
                    cleaned = clean_gloss(sense.get('definition', ''))
                    ar_trans = cache.get(cleaned, '')
                    if ar_trans:
                        ar_senses.append({
                            'definition': ar_trans,
                            'citations': sense.get('citations', [])
                        })
                        combined_defs.append(ar_trans)
            except: pass
            
        if ar_senses:
            ar_preview = ar_senses[0]['definition']
            ar_json_str = json.dumps(ar_senses, ensure_ascii=False)
            ar_norm = normalize_arabic(" ".join(combined_defs))
            
            updates_entries.append((ar_preview, ar_json_str, entry_id))
            updates_fts.append((
                entry_id, coptic_name, coptic_clean or coptic_name,
                en or '', de or '', fr or '', ar_norm,
                etym or '', pos or '', origin or ''
            ))
            success_count += 1
        else:
            updates_entries.append(('', '[]', entry_id))
            updates_fts.append((
                entry_id, coptic_name, coptic_clean or coptic_name,
                en or '', de or '', fr or '', '',
                etym or '', pos or '', origin or ''
            ))
            
    print(f"Applying updates to 'entries' table...", flush=True)
    cur.executemany('''
        UPDATE entries 
        SET ar = ?, ar_json = ?
        WHERE id = ?
    ''', updates_entries)
    conn.commit()
    print(f"Updated {success_count} / {total} entries with Arabic definitions ({success_count/total*100:.1f}% coverage).", flush=True)
    
    print("\nRebuilding 'entries_fts' Trigram Table...", flush=True)
    cur.execute("DELETE FROM entries_fts")
    cur.executemany('''
        INSERT INTO entries_fts(id, coptic_name, coptic_clean, en_text, de_text, fr_text, ar_text, etym, pos, origin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', updates_fts)
    conn.commit()
    print("FTS5 table successfully rebuilt with full Arabic trigram indexing.", flush=True)
    
    conn.close()
    print("\n=======================================================", flush=True)
    print(f"COMPLETED: {success_count} / {total} entries ({success_count/total*100:.1f}%) now have academic Arabic definitions!", flush=True)
    print("=======================================================", flush=True)

if __name__ == '__main__':
    main()
