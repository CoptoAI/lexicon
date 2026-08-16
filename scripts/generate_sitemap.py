#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sitemap Generator for CoptoLex (https://lexicon.copto.org) - Copto.org
Extracts lemma entries and generates valid XML sitemap for search engines.
"""

import sqlite3
import os
import urllib.parse
from datetime import datetime, timezone

def generate_sitemap():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'd1_coptic_dict.db')
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)
    sitemap_path = os.path.join(public_dir, 'sitemap.xml')

    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    base_url = "https://lexicon.copto.org"

    urls = [
        {"loc": f"{base_url}/", "changefreq": "daily", "priority": "1.0"},
        {"loc": f"{base_url}/?dialect=S", "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/?dialect=B", "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/?dialect=F", "changefreq": "weekly", "priority": "0.7"},
        {"loc": f"{base_url}/?dialect=A", "changefreq": "weekly", "priority": "0.7"},
        {"loc": f"{base_url}/?origin=egyptian", "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/?origin=greek", "changefreq": "weekly", "priority": "0.8"},
    ]

    if os.path.exists(db_path):
        con = sqlite3.connect(db_path)
        cur = con.cursor()
        
        # Add entries with high frequency / distinct lemmas
        cur.execute("SELECT xml_id, coptic_name FROM entries ORDER BY freq_rank ASC LIMIT 2500")
        rows = cur.fetchall()
        for tla_id, name in rows:
            clean_word = urllib.parse.quote(name)
            urls.append({
                "loc": f"{base_url}/?q={clean_word}",
                "changefreq": "monthly",
                "priority": "0.6"
            })
        con.close()

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    for u in urls:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{u['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{today}</lastmod>")
        xml_lines.append(f"    <changefreq>{u['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{u['priority']}</priority>")
        xml_lines.append("  </url>")

    xml_lines.append("</urlset>")

    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(xml_lines) + "\n")

    print(f"SUCCESS: Generated {len(urls)} sitemap entries at {sitemap_path}")

if __name__ == '__main__':
    generate_sitemap()
