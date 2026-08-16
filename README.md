# Coptic Dictionary Online (Modernized for Cloudflare D1 & Pages)

The **Coptic Dictionary Online** is a modern, high-performance digital lexicon powered by **Cloudflare Pages**, **Workers (Hono Edge API)**, and **Cloudflare D1 (Serverless SQLite with FTS5 Full-Text Search)**.

It provides instantaneous search across the complete **Comprehensive Coptic Lexicon** (11,272 entries, 8,358 lemmas, and 32,452 collocation networks) compiled by BBAW, DDGLC, and Coptic Scriptorium.

---

## ✨ Features & Enhancements

- ⚡ **Cloudflare D1 + FTS5 Search**: Sub-millisecond full-text trigram search across Coptic headwords, English, German, and French definitions.
- 🎨 **Modern Design System**: Obsidian Gold (Dark Mode) & Papyrus Linen (Light Mode) themes with glassmorphism, responsive mobile-first layout, and smooth animations.
- 🔤 **Antinoou WebFont Typography**: Native embedded Coptic webfonts for accurate rendering of combining diacritics, supralinear strokes, and jinkim.
- ⌨️ **Interactive Coptic Virtual Keyboard**: Touch-friendly virtual keyboard with full Coptic alphabet, demotic additions, diacritics, and real-time phonetic Latin typing mode.
- 🌐 **Interactive Collocation Network Graph**: Force-directed phrase dependency visualizer showing syntactic and lexical co-occurrences from the Coptic Universal Dependency Treebank.
- 🌍 **Multi-Dialect & POS Filters**: Instant filtering across **Sahidic (S)**, **Bohairic (B)**, **Akhmimic (A)**, **Fayyumic (F)**, **Lycopolitan (L)**, **Mesokemic (M)**, and **Old Coptic (K)**.
- 📖 **Comprehensive Academic Tooling**: Attestation tables by dialect, Greek root links to Perseus/LSJ, and deep links to the Coptic Scriptorium corpus (ANNIS).
- 🔌 **Cloudflare Edge Hono API**: Serverless REST API with endpoints for `/api/search`, `/api/entries/:id`, `/api/network/:word`, and `/api/stats`.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build or Rebuild the D1 Database (SQLite + FTS5)
```bash
npm run d1:build-db
```
*Reads `alpha_kyima_rc1.db` and generates `d1_coptic_dict.db` with FTS5 virtual tables and trigram indexes.*

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## ☁️ Deploying to Cloudflare Pages & D1

### 1. Create Cloudflare D1 Database
```bash
npx wrangler d1 create coptic-dict
```
Copy the generated `database_id` into [wrangler.jsonc](file:///d:/Copto/dictionary/wrangler.jsonc).

### 2. Apply Schema & Migrations to Remote D1
```bash
npm run d1:migrate:remote
# Or execute the dump file directly:
npx wrangler d1 execute coptic-dict --file=./migrations/d1_full_dump.sql --remote
```

### 3. Build & Deploy to Cloudflare Pages
```bash
npm run build
npm run deploy
```

---

## 📁 Project Structure

```
├── functions/
│   └── api/
│       └── [[route]].ts         # Hono Edge API on Cloudflare Pages Functions
├── migrations/
│   ├── 0001_initial_schema.sql  # D1 SQLite Schema + FTS5 Virtual Table
│   └── d1_full_dump.sql        # Full dataset SQL dump for remote D1 import
├── public/
│   └── fonts/                  # Antinoou & Annistools Coptic WebFonts
├── scripts/
│   ├── build_d1_database.py    # Automated SQLite -> D1 migration & FTS5 builder
│   └── export_sql_dump.py      # D1 SQL statement exporter
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Navbar, stats badge, theme switcher
│   │   ├── SearchBar.tsx        # Instant search, dialect pills, POS selector
│   │   ├── CopticKeyboard.tsx   # Virtual Coptic keyboard & phonetic input
│   │   ├── SearchResults.tsx    # Rich lexical cards with dialect tags
│   │   ├── EntryDetailModal.tsx # Detailed forms table, citations, etymologies
│   │   ├── TermNetworkView.tsx  # Force-directed collocation canvas graph
│   │   ├── HowToModal.tsx       # Search guide & dialect abbreviations
│   │   └── AboutModal.tsx       # Academic credits & license information
│   ├── services/
│   │   └── api.ts               # Client edge API fetcher
│   ├── types/
│   │   └── dictionary.ts        # TypeScript schemas & interfaces
│   ├── utils/
│   │   └── coptic.ts            # Coptic alphabet, phonetic transliteration
│   ├── App.tsx                  # Main React application
│   ├── index.css                # Obsidian Gold / Papyrus Linen design system
│   └── main.tsx                 # App mount
├── vite.config.ts               # Vite configuration with local SQLite API bridge
├── wrangler.jsonc               # Cloudflare Pages & D1 configuration
└── package.json                 # Project scripts & dependencies
```

---

## 📜 Academic Credits & License

- **Lexicon Data**: Licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) by BBAW & DDGLC.
- **Software Interface**: Licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
- **Participating Projects**: [Coptic Scriptorium](https://copticscriptorium.org), [BBAW](https://www.saw-leipzig.de), [DDGLC](https://www.geschkult.fu-berlin.de/en/e/ddglc), [KELLIA](http://kellia.uni-goettingen.de/).
