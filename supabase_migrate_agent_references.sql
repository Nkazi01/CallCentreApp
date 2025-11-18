-- ============================================
-- Migration Script: Convert Username References to UUIDs
-- 
-- This script migrates leads table to use UUID references
-- instead of username strings for captured_by and assigned_to
-- ============================================

-- Step 1: Audit - Find leads with non-UUID values
-- Run this first to see what needs to be migrated
SELECT 
  id,
  lead_number,
  captured_by,
  assigned_to,
  CASE 
    WHEN captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'captured_by is not UUID'
    ELSE 'OK'
  END as captured_by_status,
  CASE 
    WHEN assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'assigned_to is not UUID'
    ELSE 'OK'
  END as assigned_to_status
FROM leads
WHERE captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Migrate captured_by from username to UUID
-- This updates leads where captured_by contains a username string
UPDATE leads l
SET captured_by = u.id
FROM users u
WHERE l.captured_by::text = u.username
  AND l.captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Migrate assigned_to from username to UUID
-- This updates leads where assigned_to contains a username string
UPDATE leads l
SET assigned_to = u.id
FROM users u
WHERE l.assigned_to::text = u.username
  AND l.assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 4: Handle orphaned records (usernames that don't match any user)
-- Set to NULL if username doesn't exist in users table
UPDATE leads
SET captured_by = NULL
WHERE captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE username = captured_by::text
  );

UPDATE leads
SET assigned_to = NULL
WHERE assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE username = assigned_to::text
  );

-- Step 5: Verify migration - All captured_by and assigned_to should now be UUIDs or NULL
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN captured_by IS NULL THEN 1 END) as null_captured_by,
  COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as null_assigned_to,
  COUNT(CASE 
    WHEN captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 1 
  END) as invalid_captured_by,
  COUNT(CASE 
    WHEN assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 1 
  END) as invalid_assigned_to
FROM leads;

-- Step 6: Add check constraints to prevent future issues
-- These constraints ensure only valid UUIDs (or NULL) can be inserted
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS captured_by_uuid_check;

ALTER TABLE leads 
ADD CONSTRAINT captured_by_uuid_check 
CHECK (
  captured_by IS NULL 
  OR captured_by::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS assigned_to_uuid_check;

ALTER TABLE leads 
ADD CONSTRAINT assigned_to_uuid_check 
CHECK (
  assigned_to IS NULL 
  OR assigned_to::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- Step 7: Verify foreign key constraints are active
-- This should show the foreign key constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass 
  AND contype = 'f'
  AND (conkey::int[] && ARRAY[
    (SELECT attnum FROM pg_attribute WHERE attrelid = 'leads'::regclass AND attname = 'captured_by'),
    (SELECT attnum FROM pg_attribute WHERE attrelid = 'leads'::regclass AND attname = 'assigned_to')
  ]);

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- If you need to rollback, you would need to restore from backup
-- or manually convert UUIDs back to usernames (not recommended)
-- 
-- The check constraints can be removed if needed:
-- ALTER TABLE leads DROP CONSTRAINT IF EXISTS captured_by_uuid_check;
-- ALTER TABLE leads DROP CONSTRAINT IF EXISTS assigned_to_uuid_check;

