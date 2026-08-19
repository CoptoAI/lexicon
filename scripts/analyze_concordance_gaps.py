#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Concordance Gap & Quality Analyzer for CoptoLex.
Analyzes entry-to-citation mapping, identifying:
  - Lemmas with zero attested citations.
  - Dialect-specific attestation mismatches (e.g. Bohairic lemmas lacking Bohairic citations).
  - High-frequency words lacking context sentences.
"""

import sqlite3
import os
import sys
import json
import unicodedata
import re

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'd1_coptic_dict.db')

def strip_diacritics(text: str) -> str:
    if not text:
        return ""
    nfd = unicodedata.normalize('NFD', text)
    cleaned = re.sub(r'[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd\u2cfd\u2cfe`\'\-\=⸗·\*\.\?\[\]\(\)]', '', nfd)
    return unicodedata.normalize('NFC', cleaned).strip().lower()

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get total numbers
    total_entries = cur.execute("SELECT COUNT(*) FROM entries").fetchone()[0]
    total_citations = cur.execute("SELECT COUNT(*) FROM citations").fetchone()[0]
    
    # Group citations by dialect
    cits_by_dialect = cur.execute("SELECT dialect, COUNT(*) FROM citations GROUP BY dialect").fetchall()
    
    # 1. Find entries with zero citations
    # First, let's load all citations to see which lemmas are covered
    cited_lemmas = set()
    cited_lemma_cleans = set()
    for row in cur.execute("SELECT DISTINCT lemma, lemma_clean FROM citations"):
        cited_lemmas.add(row[0])
        cited_lemma_cleans.add(row[1])

    # Now inspect entries
    entries = cur.execute("SELECT id, coptic_name, dialects, pos, freq_rank FROM entries").fetchall()
    
    uncited_entries = []
    uncited_by_dialect = {"S": 0, "B": 0, "Other/Multiple": 0}
    uncited_high_freq = [] # Rank < 1000 but uncited

    for eid, cname, dialects, pos, freq_rank in entries:
        clean_name = strip_diacritics(cname)
        
        # Check if lemma is cited
        is_cited = (cname in cited_lemmas) or (clean_name in cited_lemma_cleans)
        
        if not is_cited:
            uncited_entries.append((eid, cname, dialects, pos, freq_rank))
            
            # Dialect category
            dial_str = dialects or ''
            if 'S' in dial_str and 'B' not in dial_str:
                uncited_by_dialect["S"] += 1
            elif 'B' in dial_str and 'S' not in dial_str:
                uncited_by_dialect["B"] += 1
            else:
                uncited_by_dialect["Other/Multiple"] += 1
                
            if freq_rank and freq_rank < 1500:
                uncited_high_freq.append((cname, dialects, pos, freq_rank))

    # 2. Dialect-specific gaps
    # E.g. Bohairic headword has Sahidic citations, but no Bohairic citations (or vice versa)
    dialect_gaps = []
    
    # Load which lemmas have which dialect citations
    lemma_dialect_coverage = {}
    for row in cur.execute("SELECT DISTINCT lemma, dialect FROM citations"):
        lem, dial = row
        if lem not in lemma_dialect_coverage:
            lemma_dialect_coverage[lem] = set()
        lemma_dialect_coverage[lem].add(dial)

    for eid, cname, dialects, pos, freq_rank in entries:
        dial_str = dialects or ''
        has_sahidic_lex = 'S' in dial_str
        has_bohairic_lex = 'B' in dial_str
        
        cleansed_name = strip_diacritics(cname)
        citations_dialects = lemma_dialect_coverage.get(cname, set()) | lemma_dialect_coverage.get(cleansed_name, set())
        
        if not citations_dialects:
            continue
            
        # Check for gap: listed in lexicon as Bohairic, but no Bohairic citation exists
        if has_bohairic_lex and 'Bohairic' not in citations_dialects:
            dialect_gaps.append({
                "id": eid,
                "lemma": cname,
                "dialects": dialects,
                "missing": "Bohairic",
                "pos": pos,
                "freq": freq_rank
            })
        # Listed as Sahidic, but no Sahidic citation exists
        elif has_sahidic_lex and 'Sahidic' not in citations_dialects:
            dialect_gaps.append({
                "id": eid,
                "lemma": cname,
                "dialects": dialects,
                "missing": "Sahidic",
                "pos": pos,
                "freq": freq_rank
            })

    # Sort gaps & uncited
    uncited_high_freq = sorted(uncited_high_freq, key=lambda x: x[3])
    dialect_gaps = sorted(dialect_gaps, key=lambda x: x['freq'] or 99999)

    print("\n==========================================")
    print(" CONCORDANCE ATTRIBUTION & GAP REPORT")
    print("==========================================")
    print(f"Total Entries in Lexicon: {total_entries}")
    print(f"Total Citations in DB   : {total_citations}")
    for dial, count in cits_by_dialect:
        print(f"  - {dial}: {count} citations")
    
    print("\n--- 1. Citations Coverage Gaps ---")
    print(f"Entries without ANY citations: {len(uncited_entries)} / {total_entries} ({len(uncited_entries)/total_entries*100:.1f}%)")
    print(f"  - Exclusively Sahidic (S)   : {uncited_by_dialect['S']}")
    print(f"  - Exclusively Bohairic (B)  : {uncited_by_dialect['B']}")
    print(f"  - Multi-dialect/Other       : {uncited_by_dialect['Other/Multiple']}")
    
    print(f"\nTop High-Frequency Words Lacking Context (Rank < 1500): {len(uncited_high_freq)}")
    for item in uncited_high_freq[:20]:
        print(f"  - {item[0]} (Dialect: {item[1]}, POS: {item[2]}, Freq Rank: {item[3]})")

    print("\n--- 2. Dialect Attestation Mismatches ---")
    print(f"Entries with citations, but missing their primary dialect's citations: {len(dialect_gaps)}")
    print(f"Top 20 dialect-mismatched gaps:")
    for gap in dialect_gaps[:20]:
        print(f"  - {gap['lemma']} (POS: {gap['pos']}, Lexicon: {gap['dialects']}, Missing Citation: {gap['missing']}, Rank: {gap['freq']})")

    conn.close()

if __name__ == '__main__':
    main()
