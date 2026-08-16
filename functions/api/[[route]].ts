import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', runtime: 'cloudflare-pages-d1', timestamp: new Date().toISOString() }));

// Database stats
app.get('/stats', async (c) => {
  try {
    const entriesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM entries').first<number>('count');
    const lemmasCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM lemmas').first<number>('count');
    const collocatesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM collocates').first<number>('count');
    const egyCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM egyptian_etymologies').first<number>('count');
    return c.json({
      entries: entriesCount || 0,
      lemmas: lemmasCount || 0,
      collocates: collocatesCount || 0,
      egyptian_roots: egyCount || 0
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Autocomplete suggestions
app.get('/suggest', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q) return c.json({ suggestions: [] });

  try {
    const cleanQ = q.replace(/[\'\"\*\^]/g, '');
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT coptic_name, pos, en_json, origin, freq_rank
      FROM entries
      WHERE coptic_name LIKE ? OR coptic_clean LIKE ?
      ORDER BY freq_rank ASC
      LIMIT 10
    `).bind(`${cleanQ}%`, `${cleanQ}%`).all();

    return c.json({ suggestions: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Full search endpoint with FTS5, dialect, POS, language, origin and sort filtering
app.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim();
  const dialect = c.req.query('dialect') || 'any';
  const pos = c.req.query('pos') || 'any';
  const lang = c.req.query('lang') || 'any';
  const origin = c.req.query('origin') || 'all';
  const sortBy = c.req.query('sort') || 'alpha';
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);

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

    try {
      const stmt = c.env.DB.prepare(sql);
      const { results } = await stmt.bind(...params).all();
      return c.json({ results, count: results.length });
    } catch (ftsError) {
      // Fallback to LIKE if FTS query encountered unexpected characters
      const fallbackSql = `
        SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.egyptian_json, e.inflection_json, e.etym, e.xml_id
        FROM entries e
        WHERE (e.coptic_name LIKE ? OR e.en LIKE ? OR e.de LIKE ? OR e.fr LIKE ?)
        ${orderBy}
        LIMIT ?
      `;
      const { results } = await c.env.DB.prepare(fallbackSql).bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit).all();
      return c.json({ results, count: results.length });
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Single entry detail
app.get('/entries/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const isNumeric = /^\d+$/.test(id);
    const sql = isNumeric
      ? `SELECT * FROM entries WHERE id = ? LIMIT 1`
      : `SELECT * FROM entries WHERE xml_id = ? OR coptic_name = ? LIMIT 1`;

    const entry = await c.env.DB.prepare(sql).bind(isNumeric ? parseInt(id, 10) : id).first();
    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }
    return c.json(entry);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Word collocation network graph
app.get('/network/:word', async (c) => {
  const word = decodeURIComponent(c.req.param('word'));
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT lemma, collocate, freq, assoc
      FROM collocates
      WHERE lemma = ? OR collocate = ?
      ORDER BY freq DESC
      LIMIT 25
    `).bind(word, word).all<{ lemma: string; collocate: string; freq: number; assoc: number }>();

    if (!results || results.length === 0) {
      return c.json({
        nodes: [{ id: word, label: word, isRoot: true, freq: 100 }],
        links: []
      });
    }

    const nodesMap = new Map();
    nodesMap.set(word, { id: word, label: word, isRoot: true, freq: 100 });

    const links: any[] = [];
    results.forEach((r) => {
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

    return c.json({
      nodes: Array.from(nodesMap.values()),
      links
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Export Cloudflare Pages fetch handler
export const onRequest = handle(app);
