-- ReplyAI — Email templates (admin-editable)
-- Run this migration in Supabase SQL Editor AFTER 00003_audit_logs.sql

-- ============================================================
-- 1. EMAIL TEMPLATES TABLE
-- ============================================================
CREATE TABLE email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL UNIQUE,       -- 'welcome' | 'limit_reached' | 'pro_confirmation' | 'payment_failed'
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT email_templates_type_check CHECK (
    type IN ('welcome', 'limit_reached', 'pro_confirmation', 'payment_failed')
  )
);

-- ============================================================
-- 2. RLS — only admins can read and write
-- ============================================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email templates"
  ON email_templates FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert email templates"
  ON email_templates FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update email templates"
  ON email_templates FOR UPDATE USING (is_admin(auth.uid()));

-- ============================================================
-- 3. INDEX
-- ============================================================
CREATE UNIQUE INDEX idx_email_templates_type ON email_templates(type);
