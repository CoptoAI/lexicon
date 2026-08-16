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
              const cleanQ = q.replace(/[\'\"\*\^]/g, '').trim();
              let ftsTarget = '';
              if (lang === 'en') ftsTarget = `en_text:${cleanQ}*`;
              else if (lang === 'de') ftsTarget = `de_text:${cleanQ}*`;
              else if (lang === 'fr') ftsTarget = `fr_text:${cleanQ}*`;
              else ftsTarget = `"${cleanQ}"*`;

              if (conditions.length > 0) {
                sql = `
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
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
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
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
                SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id, e.ascii
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
                SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id
                FROM entries e
                WHERE (e.coptic_name LIKE ? OR e.en LIKE ? OR e.de LIKE ? OR e.fr LIKE ?)
                ${orderBy}
                LIMIT ?
              `;
              const likeParam = `%${q}%`;
              results = db.prepare(fallbackSql).all(likeParam, likeParam, likeParam, likeParam, limit);
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
