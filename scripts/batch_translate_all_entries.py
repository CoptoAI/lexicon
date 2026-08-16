#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Academic Coptic-Arabic Batch Translation Engine (Incremental & Thread-Safe)
Translates all 11,272 Coptic Lexicon entries into high-precision, scholarly Arabic.
Uses curated patristic / liturgical concordances, contextual translation, and academic post-processing.
"""

import sqlite3
import json
import re
import os
import sys
import time
import threading
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any, Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.arabic_academic_lexicon import COPTIC_ACADEMIC_CURATED
from utils.arabic_translator import normalize_arabic

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'arabic_translations_cache.json')
DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'd1_coptic_dict.db')

cache_lock = threading.Lock()

# Academic Coptic Church & Ancient Egyptian Post-Processing Vocabulary Normalization
SCHOLARLY_REPLACEMENTS = [
    (r'\bchurch\b', 'كنيسة'),
    (r'\baltar\b', 'مذبح'),
    (r'\bmonastery\b', 'دير'),
    (r'\bmonk\b', 'راهب'),
    (r'\bdeacon\b', 'شماس'),
    (r'\bbishop\b', 'أسقف'),
    (r'\barchbishop\b', 'مطران'),
    (r'\bpatriarch\b', 'بطريرك'),
    (r'\bpriest\b', 'كاهن، قس'),
    (r'\barchpriest\b', 'قمص'),
    (r'\bliturgy\b', 'قداس إلهي، ليتورجيا'),
    (r'\beucharist\b', 'إفخارستيا، سر الشكر، التناول'),
    (r'\bbaptism\b', 'معمودية'),
    (r'\bconsecration\b', 'تدشين، تكريس'),
    (r'\bconsecrate\b', 'يدشن، يكرس'),
    (r'\bholiness\b', 'قداسة'),
    (r'\bsaint\b', 'قديس'),
    (r'\bmartyr\b', 'شهيد'),
    (r'\bcross\b', 'صليب'),
    (r'\bgospel\b', 'إنجيل'),
    (r'\bpsalm\b', 'مزمور'),
    (r'\bepistle\b', 'رسالة'),
    (r'\bresurrection\b', 'قيامة'),
    (r'\bsalvation\b', 'خلاص، فداء'),
    (r'\bredemption\b', 'فداء'),
    (r'\bpharaoh\b', 'فرعون'),
    (r'\bpapyrus\b', 'بردي، ورق البردي'),
    (r'\bdragnet\b', 'شبكة صيد، جرافة'),
    (r'\bmeaning unknown\b', 'معنى غير مؤكد في المخطوطات'),
    (r'\bunknown meaning\b', 'معنى غير محدد بدقة'),
    (r'\bspecific sense unclear\b', 'دلالة غير محددة بدقة في النصوص'),
    (r'\busage unclear\b', 'استعمال غير واضح السياق'),
    (r'\bverbal prefix perfect I\b', 'سابقة فعلية للماضي التام الأول'),
    (r'\bprefix of imperative\b', 'سابقة صيغة الأمر / النهي'),
    (r'\bmarking indefinitness\b', 'أداة تنكير'),
    (r'\battributive\b', 'نعت، صفة وصفية'),
    (r'\bsubstantive\b', 'اسم، جوهر'),
]

def load_cache() -> Dict[str, str]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: could not load cache: {e}", flush=True)
    return {}

def save_cache(cache: Dict[str, str]):
    with cache_lock:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        temp_file = CACHE_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        if os.path.exists(CACHE_FILE):
            try: os.remove(CACHE_FILE)
            except: pass
        os.rename(temp_file, CACHE_FILE)

def clean_english_def(raw: str) -> str:
    if not raw:
        return ""
    cleaned = re.sub(r'\b(CD|CED|KoptHwb|DELC|Wb|CRUM)\s*[\d\w\-\.,\s]*', '', raw, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[.*?\]', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def fetch_online_translation(text: str) -> str:
    if not text:
        return ""
    for attempt in range(3):
        try:
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=" + urllib.parse.quote(text)
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=6) as response:
                res = response.read().decode('utf-8')
                data = json.loads(res)
                return "".join([part[0] for part in data[0] if part[0]]).strip()
        except Exception as e:
            time.sleep(0.3 * (attempt + 1))
    return ""

def post_process_arabic_definition(ar_text: str, en_orig: str, pos: str) -> str:
    if not ar_text:
        return ""
    
    res = ar_text.strip()
    res = res.replace(';', '؛').replace(',', '،')
    res = re.sub(r'\s*([،؛])\s*', r'\1 ', res)
    res = re.sub(r'\s+', ' ', res).strip()
    
    en_low = en_orig.lower()
    for pattern, ar_term in SCHOLARLY_REPLACEMENTS:
        if re.search(pattern, en_low, re.IGNORECASE) and ar_term not in res:
            if len(en_orig.split()) <= 3:
                res = f"{ar_term}؛ {res}"
                
    return res

def process_entry(entry: Tuple[str, str, str, str, str, str], cache: Dict[str, str]) -> Tuple[str, List[Dict[str, Any]], str]:
    entry_id, coptic_name, pos, en_json, de_json, fr_json = entry
    
    # 1. Curated match
    curated = COPTIC_ACADEMIC_CURATED.get(coptic_name)
    if curated:
        citations = []
        if en_json:
            try:
                p = json.loads(en_json)
                if p and 'citations' in p[0]:
                    citations = p[0]['citations']
            except: pass
        ar_senses = [{
            'definition': curated,
            'citations': citations
        }]
        return entry_id, ar_senses, normalize_arabic(curated)
        
    # 2. English senses
    en_senses = []
    if en_json:
        try:
            en_senses = json.loads(en_json)
        except: pass
        
    ar_senses = []
    combined_defs = []
    
    if en_senses:
        for sense in en_senses:
            en_def = sense.get('definition', '')
            cleaned_en = clean_english_def(en_def)
            if not cleaned_en:
                continue
                
            ar_trans = ""
            with cache_lock:
                if cleaned_en in cache:
                    ar_trans = cache[cleaned_en]
                    
            if not ar_trans:
                raw_ar = fetch_online_translation(cleaned_en)
                ar_trans = post_process_arabic_definition(raw_ar, cleaned_en, pos)
                if ar_trans:
                    with cache_lock:
                        cache[cleaned_en] = ar_trans
                        
            if ar_trans:
                ar_senses.append({
                    'definition': ar_trans,
                    'citations': sense.get('citations', [])
                })
                combined_defs.append(ar_trans)
                
    # 3. German fallback
    if not ar_senses and de_json:
        try:
            de_senses = json.loads(de_json)
            if de_senses:
                de_def = clean_english_def(de_senses[0].get('definition', ''))
                if de_def:
                    ar_trans = ""
                    with cache_lock:
                        if de_def in cache:
                            ar_trans = cache[de_def]
                    if not ar_trans:
                        try:
                            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ar&dt=t&q=" + urllib.parse.quote(de_def)
                            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                            with urllib.request.urlopen(req, timeout=5) as response:
                                data = json.loads(response.read().decode('utf-8'))
                                raw_ar = "".join([part[0] for part in data[0] if part[0]]).strip()
                                ar_trans = post_process_arabic_definition(raw_ar, de_def, pos)
                                with cache_lock:
                                    cache[de_def] = ar_trans
                        except:
                            ar_trans = ""
                    if ar_trans:
                        ar_senses.append({
                            'definition': ar_trans,
                            'citations': de_senses[0].get('citations', [])
                        })
                        combined_defs.append(ar_trans)
        except: pass
        
    combined_str = " ".join(combined_defs)
    return entry_id, ar_senses, normalize_arabic(combined_str)

def main():
    print("=== Academic Coptic-Arabic Batch Translation Engine ===", flush=True)
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    
    cur.execute('SELECT id, coptic_name, pos, en_json, de_json, fr_json FROM entries')
    entries = cur.fetchall()
    total = len(entries)
    print(f"Loaded {total} lexicon entries from {DB_FILE}", flush=True)
    
    cache = load_cache()
    print(f"Loaded {len(cache)} pre-cached translations from {CACHE_FILE}", flush=True)
    
    start_time = time.time()
    translated_count = 0
    batch_updates = []
    
    print("Beginning fast thread-safe batch processing...", flush=True)
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(process_entry, e, cache): e for e in entries}
        
        count = 0
        for future in as_completed(futures):
            count += 1
            entry_id, ar_senses, ar_text = future.result()
            
            ar_json_str = json.dumps(ar_senses, ensure_ascii=False) if ar_senses else None
            ar_preview = ar_senses[0]['definition'] if ar_senses else ''
            
            if ar_senses and re.search(r'[\u0600-\u06FF]', ar_preview):
                translated_count += 1
                
            batch_updates.append((ar_preview, ar_json_str, ar_text, entry_id))
            
            if len(batch_updates) >= 500 or count == total:
                cur.executemany('''
                    UPDATE entries 
                    SET ar = ?, ar_json = ?, ar_text = ?
                    WHERE id = ?
                ''', batch_updates)
                conn.commit()
                batch_updates.clear()
                
                elapsed = time.time() - start_time
                print(f"Progress: {count}/{total} entries ({count/total*100:.1f}%) in {elapsed:.1f}s | Valid Arabic: {translated_count} ({translated_count/count*100:.1f}%)", flush=True)
                save_cache(cache)
                
    # Rebuild FTS5 Trigram Search Table
    print("\nRebuilding FTS5 Trigram Full-Text Search Table...", flush=True)
    try:
        cur.execute("DELETE FROM entries_fts")
        cur.execute("""
            INSERT INTO entries_fts(rowid, coptic_name, coptic_clean, en, de, fr, ar_text, pos, dialects, etym, origin)
            SELECT id, coptic_name, coptic_clean, 
                   COALESCE(en, ''), COALESCE(de, ''), COALESCE(fr, ''), COALESCE(ar_text, ''),
                   COALESCE(pos, ''), COALESCE(dialects, ''), COALESCE(etym, ''), COALESCE(origin, '')
            FROM entries
        """)
        conn.commit()
        print("FTS5 Trigram search index successfully updated.", flush=True)
    except Exception as e:
        print(f"Warning updating FTS table: {e}", flush=True)
        
    conn.close()
    save_cache(cache)
    
    print("\n=======================================================", flush=True)
    print(f"SUCCESS: Translated {translated_count} / {total} entries ({translated_count/total*100:.1f}% coverage)!", flush=True)
    print(f"Database: {DB_FILE}", flush=True)
    print(f"Cache: {CACHE_FILE}", flush=True)
    print("=======================================================", flush=True)

if __name__ == '__main__':
    main()
