-- ReplyAI — Add user roles
-- Run this migration in Supabase SQL Editor AFTER 00001_initial_schema.sql

-- ============================================================
-- 1. ADD ROLE COLUMN TO PROFILES
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Only allow known role values
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- ============================================================
-- 2. SET ALL EXISTING USERS TO 'user' ROLE
-- ============================================================
UPDATE profiles SET role = 'user' WHERE role IS NULL OR role = '';

-- ============================================================
-- 3. UPDATE TRIGGER — new users always get 'user' role
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. RLS — admins can read all profiles
-- ============================================================
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can read all companies (for admin panel)
CREATE POLICY "Admins can read all companies"
  ON companies FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can read all generations
CREATE POLICY "Admins can read all generations"
  ON generations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. HELPER FUNCTION — check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. PROMOTE USER TO ADMIN (run manually for first admin)
-- ============================================================
-- To promote a user to admin, run:
--   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
