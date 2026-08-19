-- ============================================================================
-- Migration 0002: Parallel Coptic Bible Verses (Sahidic & Bohairic)
-- Supports copshc (Sahidic), copbhc (Bohairic), copcnt (Liturgical Bohairic)
-- and Parallel Arabic & English Translations
-- ============================================================================

CREATE TABLE IF NOT EXISTS bible_verses (
    verse_id TEXT PRIMARY KEY,       -- e.g. "MAT.1.1", "JHN.3.16"
    canon_order INTEGER NOT NULL,    -- Sort order 1..7959
    book TEXT NOT NULL,              -- 3-letter code: MAT, MAR, LUK, JOH, etc.
    book_name_en TEXT NOT NULL,      -- "Matthew", "John", etc.
    book_name_ar TEXT NOT NULL,      -- "متى", "يوحنا", etc.
    book_name_cop TEXT NOT NULL,     -- "ⲕⲁⲧⲁ ⲙⲁⲧⲑⲁⲓⲟⲛ", etc.
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    coptic_sahidic TEXT NOT NULL,     -- copshc_vpl
    coptic_bohairic TEXT NOT NULL,    -- copcnt_vpl (Vocalized with Jinikim)
    coptic_bohairic_plain TEXT,      -- copbhc_vpl (Standard unvocalized)
    arabic_nav TEXT,                 -- Ketab El Hayat (arbnav)
    arabic_svd TEXT,                 -- Smith & Van Dyck
    arabic_wbtc TEXT,                -- WBTC Easy-to-Read (arbwbtc)
    english_kjv TEXT                 -- King James Version
);

CREATE INDEX IF NOT EXISTS idx_bv_book_chapter ON bible_verses(book, chapter);
CREATE INDEX IF NOT EXISTS idx_bv_canon ON bible_verses(canon_order);
CREATE INDEX IF NOT EXISTS idx_bv_book ON bible_verses(book);

CREATE VIRTUAL TABLE IF NOT EXISTS bible_verses_fts USING fts5(
    verse_id UNINDEXED,
    coptic_sahidic,
    coptic_bohairic,
    coptic_bohairic_plain,
    arabic_nav,
    arabic_svd,
    english_kjv,
    tokenize='trigram'
);
