-- ReplyAI — Google Business Profile Integration
-- Tydzień 9-10: OAuth, konta, lokalizacje

-- ============================================================
-- 1. Rozszerzenie tabeli COMPANIES o dane Google
-- ============================================================
ALTER TABLE companies
  ADD COLUMN google_account_id    TEXT,
  ADD COLUMN google_location_id   TEXT,
  ADD COLUMN google_location_name TEXT,
  ADD COLUMN google_oauth_tokens  TEXT,           -- zaszyfrowany JSON (AES-256-GCM)
  ADD COLUMN google_connected_at  TIMESTAMPTZ;

-- Indeks do szybkiego wyszukiwania połączonych firm
CREATE INDEX idx_companies_google ON companies(google_account_id)
  WHERE google_account_id IS NOT NULL;

-- ============================================================
-- 2. Tabela GOOGLE_REVIEWS (cache opinii — przygotowanie na tyg. 11-12)
-- ============================================================
CREATE TABLE google_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  google_review_id    TEXT NOT NULL,
  reviewer_name       TEXT,
  reviewer_photo_url  TEXT,
  star_rating         INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  comment             TEXT,
  review_created_at   TIMESTAMPTZ,
  review_updated_at   TIMESTAMPTZ,
  reply_text          TEXT,
  reply_updated_at    TIMESTAMPTZ,
  reply_source        TEXT DEFAULT 'google' CHECK (reply_source IN ('google', 'replyai')),
  generation_id       UUID REFERENCES generations(id) ON DELETE SET NULL,
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, google_review_id)
);

-- Indeksy dla filtrowania i sortowania
CREATE INDEX idx_google_reviews_company ON google_reviews(company_id);
CREATE INDEX idx_google_reviews_rating ON google_reviews(company_id, star_rating);
CREATE INDEX idx_google_reviews_unreplied ON google_reviews(company_id)
  WHERE reply_text IS NULL;
CREATE INDEX idx_google_reviews_synced ON google_reviews(synced_at DESC);

-- ============================================================
-- 3. RLS dla google_reviews
-- ============================================================
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own google reviews"
  ON google_reviews FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert own google reviews"
  ON google_reviews FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update own google reviews"
  ON google_reviews FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admins can read all google reviews"
  ON google_reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
