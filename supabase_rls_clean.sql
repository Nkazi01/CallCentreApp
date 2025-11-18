-- ============================================
-- Clean RLS Policies Setup
-- This script drops all existing policies and creates new ones
-- Run this in Supabase SQL Editor to avoid conflicts
-- ============================================

-- Drop ALL existing policies to start fresh
-- USERS TABLE
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_agents_for_managers" ON public.users;
DROP POLICY IF EXISTS "users_select_managers_for_managers" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_agents_for_managers" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_agents_for_managers" ON public.users;
DROP POLICY IF EXISTS "users_update_managers_for_managers" ON public.users;
DROP POLICY IF EXISTS "users_delete_for_managers" ON public.users;
DROP POLICY IF EXISTS "users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "managers can view all users" ON public.users;
DROP POLICY IF EXISTS "managers can manage users" ON public.users;
DROP POLICY IF EXISTS "managers can update users" ON public.users;
DROP POLICY IF EXISTS "managers can delete users" ON public.users;
DROP POLICY IF EXISTS "users_read_self" ON public.users;
DROP POLICY IF EXISTS "users_read_manager" ON public.users;

-- LEADS TABLE
DROP POLICY IF EXISTS "leads_agents_read" ON public.leads;
DROP POLICY IF EXISTS "leads_managers_read" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
DROP POLICY IF EXISTS "agents can read their leads" ON public.leads;
DROP POLICY IF EXISTS "agents can insert their leads" ON public.leads;
DROP POLICY IF EXISTS "agents can update their leads" ON public.leads;
DROP POLICY IF EXISTS "managers can delete leads" ON public.leads;

-- BANK_DETAILS TABLE
DROP POLICY IF EXISTS "bank_details_agents_read" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_managers_read" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_insert" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_update" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_delete" ON public.bank_details;
DROP POLICY IF EXISTS "agents can read bank details for their leads" ON public.bank_details;
DROP POLICY IF EXISTS "agents can upsert bank details for their leads" ON public.bank_details;
DROP POLICY IF EXISTS "agents can update bank details for their leads" ON public.bank_details;
DROP POLICY IF EXISTS "managers can delete bank details" ON public.bank_details;

-- CALL_NOTES TABLE
DROP POLICY IF EXISTS "notes_read" ON public.call_notes;
DROP POLICY IF EXISTS "notes_insert" ON public.call_notes;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS auth_is_manager() CASCADE;
DROP FUNCTION IF EXISTS is_manager() CASCADE;

-- ============================================
-- Helper Functions
-- ============================================

-- IMPORTANT: This function MUST be SECURITY DEFINER to bypass RLS and avoid recursion
-- When called from RLS policies, it runs with the privileges of the function owner (postgres)
-- This prevents infinite recursion when checking if a user is a manager
CREATE OR REPLACE FUNCTION auth_is_manager()
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
  -- When owned by a superuser (postgres/service_role in Supabase), this bypasses RLS entirely.
  SELECT role::text INTO user_role
  FROM public.users
  WHERE id = auth.uid()
    AND active = true;
  
  RETURN COALESCE(user_role = 'manager', false);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN false;
  WHEN OTHERS THEN
    -- If any error occurs (including recursion), return false to fail safe
    RETURN false;
END;
$$;

-- Ensure the function is owned by postgres (or service_role in Supabase)
-- This is critical for SECURITY DEFINER to properly bypass RLS
DO $$
BEGIN
  ALTER FUNCTION auth_is_manager() OWNER TO postgres;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Function is likely already owned correctly, continue
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth_is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_manager() TO anon;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_self"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Managers can read all users
CREATE POLICY "users_read_managers"
ON public.users
FOR SELECT
USING (auth_is_manager());

-- Users can insert their own profile during registration
CREATE POLICY "users_insert_self"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Managers can insert user profiles
CREATE POLICY "users_insert_managers"
ON public.users
FOR INSERT
WITH CHECK (auth_is_manager());

-- Users can update their own profile
CREATE POLICY "users_update_self"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Managers can update any user profile
CREATE POLICY "users_update_managers"
ON public.users
FOR UPDATE
USING (auth_is_manager())
WITH CHECK (auth_is_manager());

-- Managers can delete users (but not themselves - handled in USING clause)
CREATE POLICY "users_delete_managers"
ON public.users
FOR DELETE
USING (auth_is_manager() AND auth.uid() != id);

-- ============================================
-- LEADS TABLE POLICIES
-- ============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Agents can read leads they captured or are assigned to, managers can read all
CREATE POLICY "leads_read"
ON public.leads
FOR SELECT
USING (
  captured_by = auth.uid()
  OR assigned_to = auth.uid()
  OR auth_is_manager()
);

-- Agents can insert leads (must set captured_by and assigned_to to themselves), managers can insert any
CREATE POLICY "leads_insert"
ON public.leads
FOR INSERT
WITH CHECK (
  (captured_by = auth.uid() AND assigned_to = auth.uid())
  OR auth_is_manager()
);

-- Agents can update leads they captured or are assigned to, managers can update any
CREATE POLICY "leads_update"
ON public.leads
FOR UPDATE
USING (
  captured_by = auth.uid()
  OR assigned_to = auth.uid()
  OR auth_is_manager()
)
WITH CHECK (
  captured_by = auth.uid()
  OR auth_is_manager()
);

-- Only managers can delete leads
CREATE POLICY "leads_delete"
ON public.leads
FOR DELETE
USING (auth_is_manager());

-- ============================================
-- BANK_DETAILS TABLE POLICIES
-- ============================================

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- Agents can read bank details for their leads, managers can read all
CREATE POLICY "bank_details_read"
ON public.bank_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = bank_details.lead_id
      AND (
        l.captured_by = auth.uid()
        OR l.assigned_to = auth.uid()
        OR auth_is_manager()
      )
  )
);

-- Agents can insert bank details for leads they captured, managers can insert any
CREATE POLICY "bank_details_insert"
ON public.bank_details
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = bank_details.lead_id
      AND (
        l.captured_by = auth.uid()
        OR auth_is_manager()
      )
  )
);

-- Agents can update bank details for their leads, managers can update any
CREATE POLICY "bank_details_update"
ON public.bank_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = bank_details.lead_id
      AND (
        l.captured_by = auth.uid()
        OR auth_is_manager()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = bank_details.lead_id
      AND (
        l.captured_by = auth.uid()
        OR auth_is_manager()
      )
  )
);

-- Only managers can delete bank details
CREATE POLICY "bank_details_delete"
ON public.bank_details
FOR DELETE
USING (auth_is_manager());

-- ============================================
-- CALL_NOTES TABLE POLICIES
-- ============================================

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

-- Users can read notes for leads they can see
CREATE POLICY "call_notes_read"
ON public.call_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = call_notes.lead_id
      AND (
        l.captured_by = auth.uid()
        OR l.assigned_to = auth.uid()
        OR auth_is_manager()
      )
  )
);

-- Authenticated users can insert notes
CREATE POLICY "call_notes_insert"
ON public.call_notes
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

