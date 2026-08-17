import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Helper to register route for both /path and /api/path to guarantee matching
const registerRoutes = (prefix: string = '') => {
  // Stats
  app.get(`${prefix}/stats`, async (c) => {
    try {
      const entriesCount = await c.env.DB.prepare('SELECT count(*) as count FROM entries').first<{ count: number }>();
      const lemmasCount = await c.env.DB.prepare('SELECT count(*) as count FROM lemmas').first<{ count: number }>();
      const collocatesCount = await c.env.DB.prepare('SELECT count(*) as count FROM collocates').first<{ count: number }>();

      return c.json({
        entries: entriesCount?.count || 0,
        lemmas: lemmasCount?.count || 0,
        collocates: collocatesCount?.count || 0
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Search
  app.get(`${prefix}/search`, async (c) => {
    const q = c.req.query('q')?.trim() || '';
    const dialect = c.req.query('dialect') || 'any';
    const pos = c.req.query('pos') || 'any';
    const lang = c.req.query('lang') || 'any';
    const origin = c.req.query('origin') || 'all';
    const sortBy = c.req.query('sort') || 'alpha';
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);

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

      try {
        const stmt = c.env.DB.prepare(sql);
        const { results } = await stmt.bind(...params).all();
        return c.json({ results, count: results.length });
      } catch (ftsError) {
        const fallbackSql = `
          SELECT e.id, e.coptic_name, e.pos, e.origin, e.freq_rank, e.ipa_sahidic, e.ipa_bohairic, e.dialects, e.en_json, e.de_json, e.fr_json, e.ar_json, e.egyptian_json, e.inflection_json, e.citations_json, e.etym, e.xml_id
          FROM entries e
          WHERE (e.coptic_name LIKE ? OR e.en LIKE ? OR e.de LIKE ? OR e.fr LIKE ? OR e.ar LIKE ?)
          ${orderBy}
          LIMIT ?
        `;
        const likeParam = `%${q}%`;
        const { results } = await c.env.DB.prepare(fallbackSql).bind(likeParam, likeParam, likeParam, likeParam, likeParam, limit).all();
        return c.json({ results, count: results.length });
      }
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Entry detail
  app.get(`${prefix}/entries/:id`, async (c) => {
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

  // Collocation network
  app.get(`${prefix}/network/:word`, async (c) => {
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

      const nodesMap = new Map<string, { id: string; label: string; isRoot: boolean; freq: number }>();
      nodesMap.set(word, { id: word, label: word, isRoot: true, freq: 100 });

      const links: Array<{ source: string; target: string; value: number }> = [];

      for (const row of results) {
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

      return c.json({
        nodes: Array.from(nodesMap.values()),
        links
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Suggest
  app.get(`${prefix}/suggest`, async (c) => {
    const q = c.req.query('q')?.trim();
    if (!q || q.length < 1) return c.json({ suggestions: [] });

    try {
      const cleanQ = q.replace(/[\'\"\*\^]/g, '');
      const { results } = await c.env.DB.prepare(`
        SELECT coptic_name, pos, xml_id
        FROM entries
        WHERE coptic_clean LIKE ? OR coptic_name LIKE ?
        LIMIT 8
      `).bind(`${cleanQ}%`, `${cleanQ}%`).all<{ coptic_name: string; pos: string; xml_id: string }>();

      return c.json({ suggestions: results });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });
  // Concordance lookup
  app.get(`${prefix}/concordance`, async (c) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Cache-Control', 'public, max-age=86400, s-maxage=604800');

    const lemma = c.req.query('lemma')?.trim() || '';
    if (!lemma) return c.json({ citations: [], count: 0 });

    const cleanLemma = lemma
      .normalize('NFD')
      .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
      .normalize('NFC')
      .trim()
      .toLowerCase();

    try {
      // 1. Query exact lemma or clean lemma
      const sql = `
        SELECT id, reference, reference_ar, urn, genre, dialect, source_name, coptic_text, english_translation, arabic_translation
        FROM citations
        WHERE lemma_clean = ? OR lemma = ?
        LIMIT 10
      `;
      const stmt = await c.env.DB.prepare(sql).bind(cleanLemma, lemma).all();
      let results = stmt.results || [];

      // 2. Prefix/Compound fallback if 0 results
      if (results.length === 0) {
        const compoundPrefixes = ['ⲙⲛⲧ', 'ⲙⲉⲧ', 'ⲣⲉϥ', 'ⲣⲉϥϫⲓ', 'ⲁⲧ', 'ⲥⲁ', 'ϫⲓⲛ', 'ⲙⲁⲛ'];
        for (const pfx of compoundPrefixes) {
          const cleanPfx = pfx.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (cleanLemma.startsWith(cleanPfx) && cleanLemma.length > cleanPfx.length + 2) {
            const stem = cleanLemma.slice(cleanPfx.length);
            const stemStmt = await c.env.DB.prepare(`
              SELECT id, reference, reference_ar, urn, genre, dialect, source_name, coptic_text, english_translation, arabic_translation
              FROM citations
              WHERE lemma_clean = ?
              LIMIT 6
            `).bind(stem).all();
            if (stemStmt.results && stemStmt.results.length > 0) {
              results = stemStmt.results;
              break;
            }
          }
        }
      }

      return c.json({ citations: results, count: results.length });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // CORS Preflight
  app.options('*', (c) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    return c.body(null, 204);
  });

  // Widget instant word lookup with morphological fallback
  app.get(`${prefix}/widget/lookup`, async (c) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');

    const rawWord = c.req.query('word')?.trim() || '';
    const lang = c.req.query('lang') || 'en';

    if (!rawWord) {
      return c.json({ error: 'Missing word parameter' }, 400);
    }

    // Clean diacritics and punctuation
    const cleanWord = rawWord
      .normalize('NFD')
      .replace(/[\u0300-\u036f\ufe20-\ufe2f\u02bc\u02bd`\'\-\=⸗·\*\.\?\[\]\(\)]/g, '')
      .normalize('NFC')
      .trim()
      .toLowerCase();

    // Generate morphological stem candidates
    const candidates: string[] = [cleanWord];

    // Common Coptic prefixes (articles, prepositions, converters, tense bases)
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
        // Also check if stem has an attached ending like -ⲉ
        if (stem.endsWith('ⲉ') && stem.length >= 3) {
          candidates.push(stem.slice(0, -1));
        }
      }
    }

    // Common pronominal suffixes
    const suffixes = ['ⲧⲏⲩⲧⲛ', 'ⲟⲩ', 'ϥ', 'ⲥ', 'ⲕ', 'ⲧⲉ', 'ⲧ', 'ⲓ', 'ⲛ', 'ⲉ'];
    for (const s of suffixes) {
      if (cleanWord.endsWith(s) && cleanWord.length - s.length >= 2) {
        candidates.push(cleanWord.slice(0, -s.length));
      }
    }

    try {
      let matchedEntry: any = null;
      let matchedStem = cleanWord;

      // 1. Try candidates in order
      for (const cand of candidates) {
        const row = await c.env.DB.prepare(`
          SELECT id, coptic_name, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic, dialects, en_json, de_json, fr_json, ar_json, egyptian_json, etym, xml_id
          FROM entries
          WHERE coptic_clean = ? OR coptic_name = ?
          ORDER BY freq_rank ASC, id ASC
          LIMIT 1
        `).bind(cand, cand).first();

        if (row) {
          matchedEntry = row;
          matchedStem = cand;
          break;
        }
      }

      // 2. Fallback: Prefix / LIKE match
      if (!matchedEntry) {
        const fallbackRow = await c.env.DB.prepare(`
          SELECT id, coptic_name, pos, origin, freq_rank, ipa_sahidic, ipa_bohairic, dialects, en_json, de_json, fr_json, ar_json, egyptian_json, etym, xml_id
          FROM entries
          WHERE coptic_clean LIKE ? OR coptic_name LIKE ?
          ORDER BY freq_rank ASC, id ASC
          LIMIT 1
        `).bind(`${cleanWord}%`, `${cleanWord}%`).first();

        if (fallbackRow) {
          matchedEntry = fallbackRow;
          matchedStem = cleanWord;
        }
      }

      if (!matchedEntry) {
        return c.json({
          found: false,
          query: rawWord,
          clean: cleanWord
        }, 404);
      }

      // Extract primary definitions
      let enDef = '';
      let deDef = '';
      let frDef = '';
      let arDef = '';

      if (matchedEntry.en_json) {
        try {
          const parsed = JSON.parse(matchedEntry.en_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            enDef = parsed[0].definition || '';
          }
        } catch (e) {}
      }

      if (matchedEntry.de_json) {
        try {
          const parsed = JSON.parse(matchedEntry.de_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            deDef = parsed[0].definition || '';
          }
        } catch (e) {}
      }

      if (matchedEntry.fr_json) {
        try {
          const parsed = JSON.parse(matchedEntry.fr_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            frDef = parsed[0].definition || '';
          }
        } catch (e) {}
      }

      if (matchedEntry.ar_json) {
        try {
          const parsed = JSON.parse(matchedEntry.ar_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            arDef = parsed[0].definition || '';
          }
        } catch (e) {}
      }

      const dialectsList = matchedEntry.dialects
        ? matchedEntry.dialects.split(',').map((d: string) => d.trim()).filter(Boolean)
        : [];

      // Determine best definition for requested language
      let primaryDef = enDef;
      if (lang === 'ar' && arDef) primaryDef = arDef;
      else if (lang === 'de' && deDef) primaryDef = deDef;
      else if (lang === 'fr' && frDef) primaryDef = frDef;
      else if (!primaryDef) primaryDef = arDef || deDef || frDef || '';

      return c.json({
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
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });
};

// Register for both patterns
registerRoutes('');
registerRoutes('/api');

export const onRequest = handle(app);
