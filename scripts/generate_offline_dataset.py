#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates a compact, highly optimized JSON dataset for client-side offline IndexedDB storage & search.
Outputs: public/data/dictionary_offline.json
"""

import sqlite3
import json
import os
import sys
import gzip
import re

def clean_search_text(text: str) -> str:
    if not text:
        return ""
    # Strip HTML tags and normalize whitespace
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[\'\"\*\^~;]', ' ', text)
    return " ".join(text.split()).strip()

def build_offline_dataset():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'd1_coptic_dict.db')
    out_dir = os.path.join(base_dir, 'public', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'dictionary_offline.json')

    if not os.path.exists(db_path):
        print(f"Error: {db_path} does not exist. Run build_d1_database.py first.")
        sys.exit(1)

    print(f"Reading entries from {db_path}...")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            id, coptic_name, coptic_clean, pos, origin, freq_rank, 
            ipa_sahidic, ipa_bohairic, dialects, 
            en_json, de_json, fr_json, ar_json, 
            egyptian_json, inflection_json, citations_json, forms_json,
            etym, xml_id, ascii
        FROM entries
        ORDER BY freq_rank ASC, id ASC
    """)
    rows = cur.fetchall()

    entries = []
    for r in rows:
        d = dict(r)
        
        # Build quick search string for client full-text matching
        search_tokens = [d['coptic_name'], d['coptic_clean']]
        if d['ascii']:
            search_tokens.append(d['ascii'])

        # Extract plain definition strings
        def extract_defs(json_str):
            if not json_str:
                return ""
            try:
                parsed = json.loads(json_str)
                if isinstance(parsed, list):
                    return " ".join([s.get('definition', '') for s in parsed if isinstance(s, dict)])
            except Exception:
                pass
            return ""

        en_plain = extract_defs(d.get('en_json'))
        ar_plain = extract_defs(d.get('ar_json'))
        de_plain = extract_defs(d.get('de_json'))
        fr_plain = extract_defs(d.get('fr_json'))

        d['search_en'] = clean_search_text(en_plain)
        d['search_ar'] = clean_search_text(ar_plain)
        d['search_de'] = clean_search_text(de_plain)
        d['search_fr'] = clean_search_text(fr_plain)
        if d.get('etym'):
            d['search_etym'] = clean_search_text(d['etym'])

        entries.append(d)

    print(f"Extracted {len(entries)} entries. Writing to {out_file}...")
    
    # Write JSON
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, separators=(',', ':'))

    raw_size_mb = os.path.getsize(out_file) / (1024 * 1024)
    print(f"Generated {out_file}: {raw_size_mb:.2f} MB (uncompressed)")

    # Measure gzip size
    with open(out_file, 'rb') as f:
        gzipped_data = gzip.compress(f.read())
        print(f"Gzipped transfer size: {len(gzipped_data) / (1024 * 1024):.2f} MB")

    conn.close()

if __name__ == '__main__':
    build_offline_dataset()
