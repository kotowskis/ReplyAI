-- ReplyAI — Initial Database Schema
-- Run this migration in Supabase SQL Editor

-- ============================================================
-- 1. PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. COMPANIES (business profiles)
-- ============================================================
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry        TEXT NOT NULL,
  tone            TEXT NOT NULL DEFAULT 'friendly',
  language        TEXT DEFAULT 'pl',
  description     TEXT,
  owner_name      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own companies"
  ON companies FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE USING (owner_id = auth.uid());

CREATE INDEX idx_companies_owner ON companies(owner_id);

-- ============================================================
-- 3. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT DEFAULT 'free',
  status                  TEXT DEFAULT 'active',
  current_period_end      TIMESTAMPTZ,
  generations_used        INT DEFAULT 0,
  generations_limit       INT DEFAULT 5,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

-- ============================================================
-- 4. GENERATIONS (AI-generated replies)
-- ============================================================
CREATE TABLE generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  review_text     TEXT NOT NULL,
  review_rating   INT,
  review_platform TEXT DEFAULT 'google',
  reply_text      TEXT NOT NULL,
  was_edited      BOOLEAN DEFAULT FALSE,
  tokens_used     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generations"
  ON generations FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_generations_company ON generations(company_id);
CREATE INDEX idx_generations_created ON generations(created_at DESC);

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Increment generations counter
CREATE OR REPLACE FUNCTION increment_generations(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET generations_used = generations_used + 1,
      updated_at = NOW()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly generation counters (call via Supabase cron)
CREATE OR REPLACE FUNCTION reset_monthly_generations()
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET generations_used = 0,
      updated_at = NOW()
  WHERE plan = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create subscription when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (company_id, plan, status, generations_limit)
  VALUES (NEW.id, 'free', 'active', 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();
