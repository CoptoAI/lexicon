import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

function copticDbDevPlugin() {
  let db: any = null;

  return {
    name: 'coptic-db-dev-plugin',
    configureServer(server: any) {
      const dbPath = path.resolve(__dirname, 'd1_coptic_dict.db');
      if (fs.existsSync(dbPath)) {
        try {
          db = new DatabaseSync(dbPath, { readOnly: true });
          console.log('[Vite Dev DB] Connected to enriched SQLite database at', dbPath);
        } catch (err: any) {
          console.warn('[Vite Dev DB] Failed to open SQLite DB:', err.message);
        }
      } else {
        console.warn('[Vite Dev DB] d1_coptic_dict.db does not exist yet.');
      }

      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname === '/api/stats') {
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ entries: 11272, lemmas: 8358, collocates: 32452 }));
          }
          try {
            const stats = db.prepare('SELECT (SELECT COUNT(*) FROM entries) as entries, (SELECT COUNT(*) FROM lemmas) as lemmas, (SELECT COUNT(*) FROM collocates) as collocates').get();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(stats));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname === '/api/search') {
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results: [], count: 0 }));
          }
          const q = (parsedUrl.searchParams.get('q') || '').trim();
          const dialect = parsedUrl.searchParams.get('dialect') || 'any';
          const pos = parsedUrl.searchParams.get('pos') || 'any';
          const lang = parsedUrl.searchParams.get('lang') || 'any';
          const origin = parsedUrl.searchParams.get('origin') || 'all';
          const sortBy = parsedUrl.searchParams.get('sort') || 'alpha';
          const limit = Math.min(parseInt(parsedUrl.searchParams.get('limit') || '50', 10), 100);

          try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (dialect !== 'any') {
              conditions.push(`e.dialects LIKE ?`);
              params.push(`%${dialect}%`);
            }

            if (pos !== 'any') {
              conditions.push(`e.pos = ?`);
              params.push(pos);
            }

            if (origin !== 'all') {
              conditions.push(`e.origin = ?`);
              params.push(origin);
            }

            const orderBy = sortBy === 'freq' ? `ORDER BY e.freq_rank ASC, e.id ASC` : `ORDER BY e.ascii ASC, e.id ASC`;

            let sql = '';
            if (q) {
              const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(q);
              let cleanQ = q.replace(/[\'\"\*\^]/g, '').trim();
              if (isArabic) {
                cleanQ = cleanQ
                  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
                  .replace(/[أإآٱ]/g, 'ا')
                  .replace(/ى/g, 'ي')
                  .replace(/ة/g, 'ه');
              }

              let ftsTarget = '';
              if (lang === 'ar' || isArabic) ftsTarget = `ar_text:"${cleanQ}"*`;
              else if (lang === 'en') ftsTarget = `en_text:${cleanQ}*`;
              else if (lang === 'de') ftsTarget = `de_text:${cleanQ}*`;
              else if (lang === 'fr') ftsTarget = `fr_text:${cleanQ}*`;
              else ftsTarget = `"${cleanQ}"*`;

              if (conditions.length > 0) {
                sql = `
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.ar_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
                  FROM entries_fts f
                  JOIN entries e ON e.id = f.id
                  WHERE entries_fts MATCH ? AND ${conditions.join(' AND ')}
                  ${orderBy}
                  LIMIT ?
                `;
                params.unshift(ftsTarget);
                params.push(limit);
              } else {
                sql = `
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.ar_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
                  FROM entries_fts f
                  JOIN entries e ON e.id = f.id
                  WHERE entries_fts MATCH ?
                  ${orderBy}
                  LIMIT ?
                `;
                params.push(ftsTarget, limit);
              }
            } else {
              const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
              sql = `
                SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.ar_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
                FROM entries e
                ${whereClause}
                ${orderBy}
                LIMIT ?
              `;
              params.push(limit);
            }

            let results: any[] = [];
            try {
              results = db.prepare(sql).all(...params);
            } catch (e) {
              const fallbackSql = `
                SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.ar_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id
                FROM entries e
                WHERE (e.coptic_name LIKE ? OR e.en LIKE ? OR e.de LIKE ? OR e.fr LIKE ? OR e.ar LIKE ?)
                ${orderBy}
                LIMIT ?
              `;
              const likeParam = `%${q}%`;
              results = db.prepare(fallbackSql).all(likeParam, likeParam, likeParam, likeParam, likeParam, limit);
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ results, count: results.length }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname.startsWith('/api/entries/')) {
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Database not initialized' }));
          }
          const id = pathname.replace('/api/entries/', '');
          const isNumeric = /^\d+$/.test(id);
          const sql = isNumeric
            ? `SELECT * FROM entries WHERE id = ? LIMIT 1`
            : `SELECT * FROM entries WHERE xml_id = ? OR coptic_name = ? LIMIT 1`;

          try {
            const entry = db.prepare(sql).get(isNumeric ? parseInt(id, 10) : id);
            if (!entry) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Entry not found' }));
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(entry));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname.startsWith('/api/network/')) {
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ nodes: [], links: [] }));
          }
          const rawWord = pathname.replace('/api/network/', '');
          const word = decodeURIComponent(rawWord);

          try {
            const rows = db.prepare(`
              SELECT lemma, collocate, freq, assoc
              FROM collocates
              WHERE lemma = ? OR collocate = ?
              ORDER BY freq DESC
              LIMIT 25
            `).all(word, word);

            const nodesMap = new Map<string, { id: string; label: string; isRoot: boolean; freq: number }>();
            nodesMap.set(word, { id: word, label: word, isRoot: true, freq: 100 });

            const links: Array<{ source: string; target: string; value: number }> = [];

            for (const row of rows) {
              const other = row.lemma === word ? row.collocate : row.lemma;
              if (!nodesMap.has(other)) {
                nodesMap.set(other, {
                  id: other,
                  label: other,
                  isRoot: false,
                  freq: row.freq
                });
              }
              links.push({
                source: word,
                target: other,
                value: Math.max(1, Math.min(10, Math.round(row.assoc * 2)))
              });
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({
              nodes: Array.from(nodesMap.values()),
              links
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname.startsWith('/api/suggest')) {
          const q = (parsedUrl.searchParams.get('q') || '').trim();
          if (!q) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ suggestions: [] }));
          }

          try {
            const cleanQ = q.replace(/[\'\"\*\^]/g, '');
            const rows = db.prepare(`
              SELECT coptic_name, pos, xml_id
              FROM entries
              WHERE coptic_clean LIKE ? OR coptic_name LIKE ?
              LIMIT 8
            `).all(`${cleanQ}%`, `${cleanQ}%`);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ suggestions: rows }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ suggestions: [] }));
          }
        }

        if (pathname.startsWith('/api/widget/lookup')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Cache-Control', 'public, max-age=86400');

          if (!db) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Database not initialized' }));
          }

          const rawWord = (parsedUrl.searchParams.get('word') || '').trim();
          const lang = parsedUrl.searchParams.get('lang') || 'en';

          if (!rawWord) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Missing word parameter' }));
          }

          const cleanWord = rawWord
            .normalize('NFD')
            .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
            .normalize('NFC')
            .trim()
            .toLowerCase();

          const candidates: string[] = [cleanWord];
          const prefixes = [
            'ⲡⲉⲧⲉ', 'ⲧⲉⲧⲉ', 'ⲛⲉⲧⲉ', 'ⲡⲉⲧ', 'ⲧⲉⲧ', 'ⲛⲉⲧ', 'ⲉⲧⲉ', 'ⲉⲧ',
            'ⲛⲧⲁⲣⲉ', 'ⲙⲡⲁⲧⲉ', 'ϣⲁⲣⲉ', 'ⲙⲉⲣⲉ', 'ⲛⲛⲉ', 'ⲉⲣⲉ', 'ⲛⲧⲁ', 'ⲙⲡⲉ',
            'ⲛⲉϥ', 'ⲛⲉⲥ', 'ⲛⲉⲩ', 'ⲛⲉⲕ', 'ⲛⲉⲛ', 'ⲛⲉⲓ',
            'ⲡⲉϥ', 'ⲧⲉϥ', 'ⲡⲉⲕ', 'ⲧⲉⲕ', 'ⲡⲟⲩ', 'ⲧⲟⲩ', 'ⲛⲟⲩ', 'ⲡⲉⲥ', 'ⲧⲉⲥ', 'ⲡⲉⲛ', 'ⲧⲉⲛ', 'ⲡⲉⲩ', 'ⲧⲉⲩ',
            'ⲡⲁ', 'ⲧⲁ', 'ⲛⲁ', 'ⲡⲓ', 'ϯ', 'ⲛⲓ', 'ⲡⲉ', 'ⲧⲉ', 'ⲛⲉ',
            'ⲁϥ', 'ⲁⲥ', 'ⲁⲩ', 'ⲁⲓ', 'ⲁⲕ', 'ⲁⲛ',
            'ϩⲉⲛ', 'ⲟⲩ', 'ϩⲛ', 'ϩⲓ', 'ⲙⲛ', 'ⲉⲃⲟⲗ',
            'ⲡ', 'ⲧ', 'ⲛ', 'ⲉ', 'ⲁ'
          ];

          for (const p of prefixes) {
            if (cleanWord.startsWith(p) && cleanWord.length - p.length >= 2) {
              const stem = cleanWord.slice(p.length);
              candidates.push(stem);
              if (stem.endsWith('ⲉ') && stem.length >= 3) {
                candidates.push(stem.slice(0, -1));
              }
            }
          }

          const suffixes = ['ⲧⲏⲩⲧⲛ', 'ⲟⲩ', 'ϥ', 'ⲥ', 'ⲕ', 'ⲧⲉ', 'ⲧ', 'ⲓ', 'ⲛ', 'ⲉ'];
          for (const s of suffixes) {
            if (cleanWord.endsWith(s) && cleanWord.length - s.length >= 2) {
              candidates.push(cleanWord.slice(0, -s.length));
            }
          }

          try {
            let matchedEntry: any = null;
            let matchedStem = cleanWord;

            for (const cand of candidates) {
              const row = db.prepare(`
                SELECT id, coptic_name, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic, dialects, en_json, de_json, fr_json, ar_json, egyptian_json, etym, xml_id
                FROM entries
                WHERE coptic_clean = ? OR coptic_name = ?
                ORDER BY freq_rank ASC, id ASC
                LIMIT 1
              `).get(cand, cand);

              if (row) {
                matchedEntry = row;
                matchedStem = cand;
                break;
              }
            }

            if (!matchedEntry) {
              const fallbackRow = db.prepare(`
                SELECT id, coptic_name, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic, dialects, en_json, de_json, fr_json, ar_json, egyptian_json, etym, xml_id
                FROM entries
                WHERE coptic_clean LIKE ? OR coptic_name LIKE ?
                ORDER BY freq_rank ASC, id ASC
                LIMIT 1
              `).get(`${cleanWord}%`, `${cleanWord}%`);

              if (fallbackRow) {
                matchedEntry = fallbackRow;
                matchedStem = cleanWord;
              }
            }

            if (!matchedEntry) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ found: false, query: rawWord, clean: cleanWord }));
            }

            let enDef = '';
            let deDef = '';
            let frDef = '';
            let arDef = '';

            if (matchedEntry.en_json) {
              try {
                const parsed = JSON.parse(matchedEntry.en_json);
                if (Array.isArray(parsed) && parsed.length > 0) enDef = parsed[0].definition || '';
              } catch (e) {}
            }
            if (matchedEntry.de_json) {
              try {
                const parsed = JSON.parse(matchedEntry.de_json);
                if (Array.isArray(parsed) && parsed.length > 0) deDef = parsed[0].definition || '';
              } catch (e) {}
            }
            if (matchedEntry.fr_json) {
              try {
                const parsed = JSON.parse(matchedEntry.fr_json);
                if (Array.isArray(parsed) && parsed.length > 0) frDef = parsed[0].definition || '';
              } catch (e) {}
            }
            if (matchedEntry.ar_json) {
              try {
                const parsed = JSON.parse(matchedEntry.ar_json);
                if (Array.isArray(parsed) && parsed.length > 0) arDef = parsed[0].definition || '';
              } catch (e) {}
            }

            const dialectsList = matchedEntry.dialects
              ? matchedEntry.dialects.split(',').map((d: string) => d.trim()).filter(Boolean)
              : [];

            let primaryDef = enDef;
            if (lang === 'ar' && arDef) primaryDef = arDef;
            else if (lang === 'de' && deDef) primaryDef = deDef;
            else if (lang === 'fr' && frDef) primaryDef = frDef;
            else if (!primaryDef) primaryDef = arDef || deDef || frDef || '';

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({
              found: true,
              id: matchedEntry.id,
              xml_id: matchedEntry.xml_id,
              coptic_name: matchedEntry.coptic_name,
              pos: matchedEntry.pos,
              origin: matchedEntry.origin,
              dialects: dialectsList,
              freq_rank: matchedEntry.freq_rank,
              ipa: matchedEntry.ipa_sahidic || matchedEntry.ipa_bohairic || '',
              ipa_sahidic: matchedEntry.ipa_sahidic || '',
              ipa_bohairic: matchedEntry.ipa_bohairic || '',
              definition: primaryDef,
              en_definition: enDef,
              de_definition: deDef,
              fr_definition: frDef,
              ar_definition: arDef,
              etym: matchedEntry.etym ? matchedEntry.etym.replace(/#/g, '') : null,
              url: `https://lexicon.copto.org/?q=${encodeURIComponent(matchedEntry.coptic_name)}`,
              matched_stem: matchedStem,
              original_query: rawWord
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname.startsWith('/api/concordance')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Cache-Control', 'public, max-age=86400');

          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ citations: [], count: 0 }));
          }

          const lemma = (parsedUrl.searchParams.get('lemma') || '').trim();
          const dialect = parsedUrl.searchParams.get('dialect') || 'all';
          if (!lemma) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ citations: [], count: 0 }));
          }

          const cleanLemma = lemma
            .normalize('NFD')
            .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd\u2cfd\u2cfe`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
            .normalize('NFC')
            .trim()
            .toLowerCase();

          try {
            let dialectFilter = '';
            const params: any[] = [cleanLemma, lemma];
            if (dialect !== 'all') {
              dialectFilter = 'AND dialect = ?';
              params.push(dialect);
            }

            let rows = db.prepare(`
              SELECT id, reference, reference_ar, urn, genre, dialect, source_name, coptic_text, english_translation, arabic_translation
              FROM citations
              WHERE (lemma_clean = ? OR lemma = ?) ${dialectFilter}
              ORDER BY CASE WHEN dialect = 'Sahidic' THEN 1 WHEN dialect = 'Bohairic' THEN 2 ELSE 3 END, id ASC
              LIMIT 20
            `).all(...params);

            if (rows.length === 0) {
              const compoundPrefixes = ['ⲙⲛⲧ', 'ⲙⲉⲧ', 'ⲣⲉϥ', 'ⲣⲉϥϫⲓ', 'ⲁⲧ', 'ⲥⲁ', 'ϫⲓⲛ', 'ⲙⲁⲛ', 'ⲡⲓ', 'ϯ', 'ⲛⲓ'];
              for (const pfx of compoundPrefixes) {
                const cleanPfx = pfx.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (cleanLemma.startsWith(cleanPfx) && cleanLemma.length > cleanPfx.length + 2) {
                  const stem = cleanLemma.slice(cleanPfx.length);
                  const fallbackParams: any[] = [stem];
                  if (dialect !== 'all') fallbackParams.push(dialect);
                  const stemRows = db.prepare(`
                    SELECT id, reference, reference_ar, urn, genre, dialect, source_name, coptic_text, english_translation, arabic_translation
                    FROM citations
                    WHERE lemma_clean = ? ${dialectFilter}
                    LIMIT 10
                  `).all(...fallbackParams);
                  if (stemRows.length > 0) {
                    rows = stemRows;
                    break;
                  }
                }
              }
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ citations: rows, count: rows.length }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname === '/api/bible/books') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ books: [] }));
          }
          try {
            const rows = db.prepare(`
              SELECT book as code, MIN(canon_order) as canon_order, book_name_en as name_en, book_name_ar as name_ar, book_name_cop as name_cop, MAX(chapter) as chapters
              FROM bible_verses
              GROUP BY book
              ORDER BY MIN(canon_order) ASC
            `).all();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ books: rows }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname === '/api/bible/chapter') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ book: null, chapter: 1, verses: [] }));
          }
          const book = (parsedUrl.searchParams.get('book') || 'JOH').toUpperCase().trim();
          const chapter = parseInt(parsedUrl.searchParams.get('chapter') || '1', 10);

          try {
            const bookInfo = db.prepare(`
              SELECT book as code, MIN(canon_order) as canon_order, book_name_en as name_en, book_name_ar as name_ar, book_name_cop as name_cop, MAX(chapter) as chapters
              FROM bible_verses
              WHERE book = ?
              GROUP BY book
            `).get(book);

            const verses = db.prepare(`
              SELECT verse_id, canon_order, book, book_name_en, book_name_ar, book_name_cop, chapter, verse,
                     coptic_sahidic, coptic_bohairic, coptic_bohairic_plain, arabic_nav, arabic_svd, arabic_wbtc, english_kjv
              FROM bible_verses
              WHERE book = ? AND chapter = ?
              ORDER BY verse ASC
            `).all(book, chapter);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({
              book: bookInfo || { code: book, name_en: book, name_ar: book, name_cop: book, chapters: 1 },
              chapter,
              total_chapters: bookInfo?.chapters || 1,
              verses
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname === '/api/bible/search') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (!db) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results: [], count: 0 }));
          }
          const q = (parsedUrl.searchParams.get('q') || '').trim();
          const limit = Math.min(parseInt(parsedUrl.searchParams.get('limit') || '30', 10), 100);
          if (!q) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results: [], count: 0 }));
          }

          try {
            const cleanQ = q.replace(/[\'\"\*\^]/g, '').trim();
            const ftsQuery = `"${cleanQ}"*`;

            const rows = db.prepare(`
              SELECT b.verse_id, b.book, b.book_name_en, b.book_name_ar, b.book_name_cop, b.chapter, b.verse,
                     b.coptic_sahidic, b.coptic_bohairic, b.arabic_nav, b.english_kjv
              FROM bible_verses_fts f
              JOIN bible_verses b ON b.verse_id = f.verse_id
              WHERE bible_verses_fts MATCH ?
              ORDER BY b.canon_order ASC
              LIMIT ?
            `).all(ftsQuery, limit);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ results: rows, count: rows.length }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), copticDbDevPlugin()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
