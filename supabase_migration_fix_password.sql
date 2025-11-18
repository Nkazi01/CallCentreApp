-- ============================================
-- Migration: Fix password field in users table
-- Run this if your users table has password NOT NULL constraint
-- This makes password optional since we use Supabase Auth
-- ============================================

-- Make password field nullable with default empty string
ALTER TABLE public.users 
  ALTER COLUMN password DROP NOT NULL,
  ALTER COLUMN password SET DEFAULT '';

-- Update existing rows to have empty password if NULL
UPDATE public.users 
SET password = '' 
WHERE password IS NULL;

