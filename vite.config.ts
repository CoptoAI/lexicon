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
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.etym, e.xml_id, e.ascii
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
                  SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.etym, e.xml_id, e.ascii
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
                SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.etym, e.xml_id, e.ascii
                FROM entries e
                ${whereClause}
                ${orderBy}
                LIMIT ?
              `;
              params.push(limit);
            }

            const rows = db.prepare(sql).all(...params);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ results: rows || [], count: rows ? rows.length : 0 }));
          } catch (err: any) {
            try {
              const fallbackSql = `SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.etym, e.xml_id FROM entries e WHERE (e.coptic_name LIKE ? OR e.en LIKE ? OR e.de LIKE ? OR e.fr LIKE ?) LIMIT ?`;
              const fRows = db.prepare(fallbackSql).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ results: fRows || [], count: fRows ? fRows.length : 0 }));
            } catch (fErr: any) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ results: [], count: 0, error: fErr.message }));
            }
          }
        }

        if (pathname.startsWith('/api/entries/')) {
          if (!db) return res.end(JSON.stringify({ error: 'DB not loaded' }));
          const id = pathname.replace('/api/entries/', '').trim();
          try {
            const isNumeric = /^\d+$/.test(id);
            const sql = isNumeric
              ? `SELECT * FROM entries WHERE id = ? LIMIT 1`
              : `SELECT * FROM entries WHERE xml_id = ? OR coptic_name = ? LIMIT 1`;

            const row = db.prepare(sql).get(isNumeric ? parseInt(id, 10) : id);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(row || null));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (pathname.startsWith('/api/network/')) {
          if (!db) return res.end(JSON.stringify({ nodes: [], links: [] }));
          const word = decodeURIComponent(pathname.replace('/api/network/', '').trim());
          try {
            const rows: any[] = db.prepare(
              `SELECT lemma, collocate, freq, assoc FROM collocates WHERE lemma = ? OR collocate = ? ORDER BY freq DESC LIMIT 25`
            ).all(word, word);

            if (!rows || rows.length === 0) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ nodes: [{ id: word, label: word, isRoot: true }], links: [] }));
            }

            const nodesMap = new Map();
            nodesMap.set(word, { id: word, label: word, isRoot: true, freq: 100 });

            const links: any[] = [];
            rows.forEach((r) => {
              const other = r.lemma === word ? r.collocate : r.lemma;
              if (!nodesMap.has(other)) {
                nodesMap.set(other, { id: other, label: other, isRoot: false, freq: r.freq, assoc: r.assoc });
              }
              links.push({
                source: r.lemma,
                target: r.collocate,
                freq: r.freq,
                assoc: r.assoc
              });
            });

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ nodes: Array.from(nodesMap.values()), links }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ nodes: [{ id: word, label: word, isRoot: true }], links: [] }));
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
    sourcemap: false
  }
});
