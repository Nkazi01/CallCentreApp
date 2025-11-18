-- ============================================
-- Fix RLS Policies for Users Table
-- This script fixes the infinite recursion issue
-- ============================================

-- Step 1: Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_agents_read" ON users;
DROP POLICY IF EXISTS "users_managers_read" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Step 2: Create helper functions
-- Function 1: Check if current user is a manager (bypasses RLS to avoid recursion)
-- IMPORTANT: This function MUST be owned by a superuser (like postgres) for SECURITY DEFINER
-- to properly bypass RLS. In Supabase, functions created via SQL editor should be owned by
-- the service_role or postgres user, which bypasses RLS.
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- SECURITY DEFINER functions run with the privileges of the function owner.
  -- When owned by a superuser (postgres/service_role), this bypasses RLS entirely.
  -- This query should NOT trigger RLS policies because we're running as the function owner.
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'manager', false);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN false;
  WHEN OTHERS THEN
    -- If any error occurs (including recursion), return false to fail safe
    -- This prevents infinite recursion if something goes wrong
    RETURN false;
END;
$$;

-- Ensure the function is owned by postgres (or service_role in Supabase)
-- This is critical for SECURITY DEFINER to properly bypass RLS
-- Note: This may fail if you don't have superuser privileges, but that's okay
-- if the function is already owned correctly (which it should be in Supabase SQL editor)
DO $$
BEGIN
  ALTER FUNCTION is_manager() OWNER TO postgres;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Function is likely already owned correctly, continue
    NULL;
  WHEN OTHERS THEN
    -- Any other error is ignored
    NULL;
END $$;

-- Function 2: Check if username or email exists (for registration validation)
-- This allows checking without revealing other user data
CREATE OR REPLACE FUNCTION user_exists(check_username text DEFAULT NULL, check_email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  exists_count integer;
BEGIN
  SELECT COUNT(*) INTO exists_count
  FROM users
  WHERE (check_username IS NOT NULL AND username = check_username)
     OR (check_email IS NOT NULL AND email = check_email);
  
  RETURN exists_count > 0;
END;
$$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3.5: Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager() TO anon;
GRANT EXECUTE ON FUNCTION user_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION user_exists(text, text) TO anon;

-- Step 4: Create new policies that avoid recursion
-- Policy 1: Users can read their own profile (using auth.uid() directly, no table lookup)
CREATE POLICY "users_select_own"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Managers can read all agent profiles (using helper function)
CREATE POLICY "users_select_agents_for_managers"
ON users
FOR SELECT
USING (is_manager() AND users.role = 'agent');

-- Policy 3: Managers can read all manager profiles
CREATE POLICY "users_select_managers_for_managers"
ON users
FOR SELECT
USING (is_manager() AND users.role = 'manager');

-- Policy 4: Allow authenticated users to insert their own profile during registration
-- This uses auth.uid() directly, matching the id being inserted
CREATE POLICY "users_insert_own"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 5: Managers can insert agent profiles (using helper function)
CREATE POLICY "users_insert_agents_for_managers"
ON users
FOR INSERT
WITH CHECK (is_manager() AND users.role = 'agent');

-- Policy 6: Users can update their own profile
-- Note: Restriction on role/active changes should be enforced via trigger or application logic
-- as OLD is not available in WITH CHECK clause of RLS policies
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 7: Managers can update agent profiles (using helper function)
CREATE POLICY "users_update_agents_for_managers"
ON users
FOR UPDATE
USING (is_manager() AND users.role = 'agent')
WITH CHECK (is_manager() AND users.role = 'agent');

-- Policy 8: Managers can update manager profiles (for other managers)
CREATE POLICY "users_update_managers_for_managers"
ON users
FOR UPDATE
USING (is_manager() AND users.role = 'manager' AND auth.uid() != users.id)
WITH CHECK (is_manager() AND users.role = 'manager' AND auth.uid() != users.id);

-- Policy 9: Only managers can delete users (and not themselves)
CREATE POLICY "users_delete_for_managers"
ON users
FOR DELETE
USING (is_manager() AND auth.uid() != users.id);

-- ============================================
-- Additional: Fix RLS for other tables
-- ============================================

-- Fix leads table policies (if they exist and cause issues)
DROP POLICY IF EXISTS "leads_agents_read" ON leads;
DROP POLICY IF EXISTS "leads_managers_read" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

-- Agents can read their own leads
CREATE POLICY "leads_agents_read"
ON leads
FOR SELECT
USING (
  auth.uid() = captured_by
  OR auth.uid() = assigned_to
);

-- Managers can read all leads (using helper function)
CREATE POLICY "leads_managers_read"
ON leads
FOR SELECT
USING (is_manager());

-- Authenticated users can insert leads
CREATE POLICY "leads_insert"
ON leads
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update leads they captured or are assigned to
CREATE POLICY "leads_update"
ON leads
FOR UPDATE
USING (
  auth.uid() = captured_by
  OR auth.uid() = assigned_to
  OR is_manager()
)
WITH CHECK (
  auth.uid() = captured_by
  OR auth.uid() = assigned_to
  OR is_manager()
);

-- Only managers can delete leads
CREATE POLICY "leads_delete"
ON leads
FOR DELETE
USING (is_manager());

-- Fix bank_details table policies
DROP POLICY IF EXISTS "bank_details_agents_read" ON bank_details;
DROP POLICY IF EXISTS "bank_details_managers_read" ON bank_details;
DROP POLICY IF EXISTS "bank_details_insert" ON bank_details;
DROP POLICY IF EXISTS "bank_details_update" ON bank_details;
DROP POLICY IF EXISTS "bank_details_delete" ON bank_details;

-- Agents can read bank details for their leads
CREATE POLICY "bank_details_agents_read"
ON bank_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = bank_details.lead_id
    AND (auth.uid() = leads.captured_by OR auth.uid() = leads.assigned_to)
  )
);

-- Managers can read all bank details
CREATE POLICY "bank_details_managers_read"
ON bank_details
FOR SELECT
USING (is_manager());

-- Authenticated users can insert bank details
CREATE POLICY "bank_details_insert"
ON bank_details
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update bank details for their leads
CREATE POLICY "bank_details_update"
ON bank_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = bank_details.lead_id
    AND (auth.uid() = leads.captured_by OR auth.uid() = leads.assigned_to)
  )
  OR is_manager()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = bank_details.lead_id
    AND (auth.uid() = leads.captured_by OR auth.uid() = leads.assigned_to)
  )
  OR is_manager()
);

-- Only managers can delete bank details
CREATE POLICY "bank_details_delete"
ON bank_details
FOR DELETE
USING (is_manager());

