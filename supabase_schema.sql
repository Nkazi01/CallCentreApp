-- ============================================
-- Call Centre App - Complete Database Schema
-- This file creates all required tables for the application
-- Run this BEFORE running supabase_rls_clean.sql
-- ============================================

-- Drop existing tables if needed (uncomment to reset database)
-- DROP TABLE IF EXISTS call_notes CASCADE;
-- DROP TABLE IF EXISTS bank_details CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('agent', 'manager');
CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Converted', 'Lost');
CREATE TYPE lead_priority AS ENUM ('Low', 'Medium', 'High');

-- ============================================
-- USERS TABLE
-- Stores agent and manager accounts
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text DEFAULT '', -- Optional: Only used for legacy/migration. Supabase Auth handles passwords.
  role user_role NOT NULL DEFAULT 'agent',
  full_name text NOT NULL,
  email text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_username_idx ON public.users (username);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

-- ============================================
-- SERVICES TABLE
-- Catalog of available financial services
-- ============================================

CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  cost text NOT NULL,
  requirements text[] NOT NULL,
  additional_notes text
);

-- ============================================
-- LEADS TABLE
-- Main lead/client records
-- ============================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number text UNIQUE NOT NULL, -- Format: "LEAD-2024-0001"
  full_name text NOT NULL,
  id_number text NOT NULL, -- 13-digit South African ID
  cell_number text NOT NULL,
  email text,
  residential_address text NOT NULL,
  source text NOT NULL CHECK (source IN ('Walk-in', 'Phone Call', 'Referral', 'Marketing')),
  services_interested text[] NOT NULL, -- Array of service IDs
  notes text,
  status lead_status NOT NULL DEFAULT 'New',
  priority lead_priority NOT NULL DEFAULT 'Medium',
  captured_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  next_follow_up date,
  call_history jsonb NOT NULL DEFAULT '[]'::jsonb -- Array of call notes
);

CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_captured_by_idx ON public.leads (captured_by);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at);
CREATE INDEX IF NOT EXISTS leads_lead_number_idx ON public.leads (lead_number);

-- ============================================
-- BANK_DETAILS TABLE
-- Banking information for leads
-- ============================================

CREATE TABLE IF NOT EXISTS public.bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  branch_code text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('Savings', 'Cheque', 'Transmission', 'Business', 'Other')),
  captured_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_details_lead_id_unique UNIQUE (lead_id) -- One bank detail per lead
);

CREATE INDEX IF NOT EXISTS bank_details_lead_id_idx ON public.bank_details (lead_id);

-- ============================================
-- CALL_NOTES TABLE
-- Optional: Separate table for call notes (if not using JSONB in leads)
-- ============================================

CREATE TABLE IF NOT EXISTS public.call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_notes_lead_idx ON public.call_notes (lead_id);
CREATE INDEX IF NOT EXISTS call_notes_created_at_idx ON public.call_notes (created_at);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Sample Users
INSERT INTO public.users (id, username, password, role, full_name, email, active, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'agent1', 'agent123', 'agent', 'Thabo Khumalo', 'thabo@iyfinance.co.za', true, '2024-01-15T08:00:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'agent2', 'agent123', 'agent', 'Nomsa Dlamini', 'nomsa@iyfinance.co.za', true, '2024-01-20T08:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'agent3', 'agent123', 'agent', 'Sipho Ndlovu', 'sipho@iyfinance.co.za', true, '2024-02-01T08:00:00Z'),
  ('00000000-0000-0000-0000-0000000000aa', 'manager', 'manager123', 'manager', 'Zanele Mthembu', 'zanele@iyfinance.co.za', true, '2024-01-01T08:00:00Z')
ON CONFLICT (username) DO NOTHING;

-- Sample Services
INSERT INTO public.services (id, name, cost, requirements, additional_notes) VALUES
  ('judgement', 'JUDGEMENT', 'R 4,500', ARRAY['Power of attorney', 'Income and expenditure', 'Creditors list', 'Identity document', 'Bank statement', 'Proof of address'], NULL),
  ('debt-review', 'DEBT REVIEW', 'R 9,000', ARRAY['Power of attorney', 'Letter from debt counsellor', 'Creditors list', 'Income and expenditure', 'Identity document', 'Bank statement', 'Proof of address'], NULL),
  ('default-adverse', 'DEFAULT/ADVERSE LISTING', 'R 4,500', ARRAY['Power of attorney', 'Income and expenditure', 'Creditors list'], NULL),
  ('admin-order', 'ADMIN ORDER', 'R 9,000', ARRAY['Court letter if applicable', 'Proof of address', 'Bank statement', 'Income and expenditure', 'Identity document', 'Creditors list'], NULL),
  ('account-negotiations', 'ACCOUNT NEGOTIATIONS', 'R 850 per creditor (R 3,200 if >3)', ARRAY['Power of attorney', 'Income and expenditure', 'Identity document', 'Proof of address'], NULL),
  ('assessment', 'ASSESSMENT', 'R 350', ARRAY['Power of attorney', 'Identity document', 'Bank statement', 'Proof of address'], NULL),
  ('garnishment', 'GARNISHMENT', 'R 7,000', ARRAY['Power of attorney', 'Identity document', 'Proof of address', 'Income and expenditure', 'Payslip', 'Bank statement'], NULL),
  ('updating-disputes', 'UPDATING/DISPUTES', 'R 4,000', ARRAY['Power of attorney', 'Identity document', 'Paid Up Letters', '17.W Form (Counsellor)'], 'Clearance Certificate included')
ON CONFLICT (id) DO NOTHING;

