-- ReplyAI — Fix infinite recursion in profiles RLS policy
-- Run this migration in Supabase SQL Editor if you already applied 00002

-- ============================================================
-- 1. Recreate is_admin() with SECURITY DEFINER (bypasses RLS)
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
-- 2. Drop the recursive policy and recreate using is_admin()
-- ============================================================
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT USING (
    is_admin(auth.uid())
  );

-- Also fix admin policies on other tables for consistency
DROP POLICY IF EXISTS "Admins can read all companies" ON companies;
CREATE POLICY "Admins can read all companies"
  ON companies FOR SELECT USING (
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read all subscriptions" ON subscriptions;
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT USING (
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read all generations" ON generations;
CREATE POLICY "Admins can read all generations"
  ON generations FOR SELECT USING (
    is_admin(auth.uid())
  );
