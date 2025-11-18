# Data Integrity Issue: Leads Agent References

## Problem Overview

The application has a **data type mismatch** between what the database schema expects and what some parts of the codebase use for referencing agents in leads. This creates potential foreign key constraint violations and data inconsistency issues.

## The Core Issue

### Database Schema (Expected Behavior)
- **`leads.captured_by`**: `uuid` type with foreign key constraint → `users(id)`
- **`leads.assigned_to`**: `uuid` type with foreign key constraint → `users(id)`

The database schema in `supabase_schema.sql` defines:
```sql
captured_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
```

This means:
- ✅ These columns **must** contain valid UUID values
- ✅ These UUIDs **must** exist in the `users.id` column
- ✅ PostgreSQL will enforce referential integrity if constraints are enabled

### Current Implementation (Actual Behavior)

#### 1. **Sample Data Uses Usernames**
In `src/data/sampleLeads.ts`, leads reference agents by **username strings** instead of UUIDs:
```typescript
capturedBy: 'agent1',  // ❌ This is a string, not a UUID
assignedTo: 'agent1',  // ❌ This is a string, not a UUID
```

#### 2. **Code Has Workarounds for Mixed Data**
Several pages contain code that handles **both** UUIDs and usernames:

**`src/pages/manager/Agents.tsx` (line 201):**
```typescript
const agentLeads = leads.filter((l) => 
  l.capturedBy === agent.id || l.capturedBy === agent.username  // Checks BOTH
);
```

**`src/pages/manager/AllLeads.tsx` (lines 63-70):**
```typescript
const agentMap = useMemo(() => {
  const map: Record<string, User> = {};
  agents.forEach((agent) => {
    map[agent.id] = agent;        // Maps UUID → User
    map[agent.username] = agent;  // Maps username → User (workaround!)
  });
  return map;
}, [agents]);

// Later used to resolve both formats:
const capturedId = agentMap[lead.capturedBy]?.id || lead.capturedBy;
```

#### 3. **TypeScript Types Say UUIDs**
The type definition in `src/types/lead.ts` correctly specifies:
```typescript
capturedBy: string; // User UUID
assignedTo: string; // User UUID
```

But the actual data may contain usernames, making the type annotation misleading.

## Why This Is a Problem

### 1. **Foreign Key Constraint Violations**
If you try to insert or update a lead with a username in `captured_by` or `assigned_to`:
```sql
-- This would FAIL:
INSERT INTO leads (..., captured_by, assigned_to) 
VALUES (..., 'agent1', 'agent1');
-- Error: invalid input syntax for type uuid: "agent1"
```

### 2. **Data Inconsistency**
- Some leads might have UUIDs: `'00000000-0000-0000-0000-000000000001'`
- Other leads might have usernames: `'agent1'`
- This makes queries unreliable and breaks joins

### 3. **RLS Policy Failures**
Row Level Security policies assume UUIDs:
```sql
-- From supabase_rls_clean.sql
USING (
  captured_by = auth.uid()  -- auth.uid() returns a UUID
  OR assigned_to = auth.uid()
)
```
If `captured_by` contains `'agent1'` instead of a UUID, the RLS check will fail, potentially blocking legitimate access.

### 4. **Query Performance Issues**
- Can't use efficient UUID indexes
- Can't use foreign key joins
- Requires application-level lookups instead of database joins

### 5. **Future Migration Problems**
- If you try to enforce foreign keys later, existing data with usernames will block the migration
- Data cleanup becomes much harder after launch

## How This Affects Current Implementation

### Pages That Are Affected

1. **`src/pages/manager/Agents.tsx`**
   - Uses workaround: `l.capturedBy === agent.id || l.capturedBy === agent.username`
   - **Impact**: Stats might be incorrect if data is mixed
   - **Risk**: If all data migrates to UUIDs, the username check becomes dead code

2. **`src/pages/manager/AllLeads.tsx`**
   - Creates `agentMap` with both UUID and username keys
   - **Impact**: Adds unnecessary complexity and memory usage
   - **Risk**: If usernames change, the mapping breaks

3. **`src/pages/manager/Reports.tsx`**
   - Filters by `lead.capturedBy === agentFilter`
   - **Impact**: May miss leads if `agentFilter` is UUID but data has usernames (or vice versa)

4. **`src/pages/agent/MyLeads.tsx`**
   - Filters by `lead.capturedBy === user?.id`
   - **Impact**: Agents might not see their own leads if data uses usernames

5. **`src/pages/agent/Dashboard.tsx`**
   - Similar filtering issues

### Database Operations

1. **Lead Creation** (`src/pages/agent/CaptureLead.tsx`)
   - ✅ **Currently correct**: Uses `user.id` (UUID)
   - No changes needed here

2. **Lead Updates**
   - Risk if any update code tries to set username instead of UUID

3. **Data Queries**
   - Can't use efficient SQL joins: `SELECT * FROM leads JOIN users ON leads.captured_by = users.id`
   - Must fetch all leads and filter in JavaScript

## Required Changes to Fix This

### Phase 1: Data Migration (Before Launch)

1. **Audit Existing Data**
   ```sql
   -- Find leads with non-UUID values
   SELECT id, lead_number, captured_by, assigned_to 
   FROM leads 
   WHERE captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
   ```

2. **Create Migration Script**
   ```sql
   -- Update leads with username references to UUID references
   UPDATE leads l
   SET captured_by = u.id
   FROM users u
   WHERE l.captured_by::text = u.username
     AND l.captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
   
   -- Same for assigned_to
   UPDATE leads l
   SET assigned_to = u.id
   FROM users u
   WHERE l.assigned_to::text = u.username
     AND l.assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
   ```

3. **Handle Orphaned Records**
   ```sql
   -- Set to NULL if username doesn't match any user
   UPDATE leads
   SET captured_by = NULL
   WHERE captured_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     AND NOT EXISTS (
       SELECT 1 FROM users WHERE username = captured_by::text
     );
   ```

### Phase 2: Enforce Database Constraints

1. **Add Check Constraints**
   ```sql
   -- Ensure captured_by is always a valid UUID or NULL
   ALTER TABLE leads 
   ADD CONSTRAINT captured_by_uuid_check 
   CHECK (captured_by IS NULL OR captured_by::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
   
   -- Same for assigned_to
   ALTER TABLE leads 
   ADD CONSTRAINT assigned_to_uuid_check 
   CHECK (assigned_to IS NULL OR assigned_to::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
   ```

2. **Verify Foreign Keys Are Active**
   ```sql
   -- Check if foreign keys are enabled (they should be by default)
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'leads'::regclass 
     AND contype = 'f';
   ```

### Phase 3: Update Application Code

1. **Remove Username Workarounds**

   **`src/pages/manager/Agents.tsx`:**
   ```typescript
   // BEFORE:
   const agentLeads = leads.filter((l) => 
     l.capturedBy === agent.id || l.capturedBy === agent.username
   );
   
   // AFTER:
   const agentLeads = leads.filter((l) => l.capturedBy === agent.id);
   ```

2. **Simplify Agent Mapping**

   **`src/pages/manager/AllLeads.tsx`:**
   ```typescript
   // BEFORE:
   const agentMap = useMemo(() => {
     const map: Record<string, User> = {};
     agents.forEach((agent) => {
       map[agent.id] = agent;
       map[agent.username] = agent;  // Remove this
     });
     return map;
   }, [agents]);
   
   // AFTER:
   const agentMap = useMemo(() => {
     const map: Record<string, User> = {};
     agents.forEach((agent) => {
       map[agent.id] = agent;
     });
     return map;
   }, [agents]);
   
   // Simplify resolution:
   const capturedId = lead.capturedBy;  // Already a UUID
   const assignedId = lead.assignedTo;  // Already a UUID
   ```

3. **Update Sample Data**

   **`src/data/sampleLeads.ts`:**
   ```typescript
   // BEFORE:
   capturedBy: 'agent1',
   assignedTo: 'agent1',
   
   // AFTER (use actual UUIDs from users table):
   capturedBy: '00000000-0000-0000-0000-000000000001',  // agent1's UUID
   assignedTo: '00000000-0000-0000-0000-000000000001',
   ```

4. **Add Validation in Lead Creation/Update**

   **`src/hooks/useLeads.ts`:**
   ```typescript
   function mapLeadToDb(lead: Partial<Lead>) {
     const mapped: Record<string, unknown> = {};
     // ... existing mappings ...
     
     // Add UUID validation
     if (lead.capturedBy !== undefined) {
       if (!isValidUUID(lead.capturedBy)) {
         throw new Error('capturedBy must be a valid UUID');
       }
       mapped.captured_by = lead.capturedBy;
     }
     
     if (lead.assignedTo !== undefined) {
       if (!isValidUUID(lead.assignedTo)) {
         throw new Error('assignedTo must be a valid UUID');
       }
       mapped.assigned_to = lead.assignedTo;
     }
     
     return mapped;
   }
   
   function isValidUUID(str: string): boolean {
     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
     return uuidRegex.test(str);
   }
   ```

## Impact of These Changes

### Positive Impacts

1. **Data Integrity**
   - ✅ All leads will have valid UUID references
   - ✅ Foreign key constraints will work correctly
   - ✅ Database will enforce referential integrity

2. **Performance**
   - ✅ Can use efficient UUID indexes
   - ✅ Can use SQL joins instead of JavaScript filtering
   - ✅ Better query performance

3. **Code Simplicity**
   - ✅ Remove workarounds and special cases
   - ✅ Cleaner, more maintainable code
   - ✅ Type safety matches actual data

4. **Security**
   - ✅ RLS policies will work correctly
   - ✅ No risk of data access issues due to type mismatches

### Potential Breaking Changes

1. **Existing Data**
   - ⚠️ If production database has leads with usernames, migration is required
   - ⚠️ Orphaned leads (username doesn't match any user) will have NULL references

2. **Code Updates Required**
   - ⚠️ Multiple files need changes (5+ pages)
   - ⚠️ Testing needed to ensure all filters work correctly

3. **Sample Data**
   - ⚠️ Sample data file needs update with actual UUIDs
   - ⚠️ If sample data is used for seeding, must ensure users exist first

## Recommended Migration Strategy

### Step 1: Pre-Migration (Safe to do now)
1. Add UUID validation in `useLeads.ts` to prevent new bad data
2. Update sample data to use UUIDs
3. Add database check constraints (won't break if data is already valid)

### Step 2: Data Audit
1. Run audit query to find problematic records
2. Document how many records need migration
3. Plan migration window

### Step 3: Migration (Before Launch)
1. Run migration script to convert usernames → UUIDs
2. Verify all leads have valid UUIDs
3. Test application functionality

### Step 4: Code Cleanup (After Migration)
1. Remove username workarounds from all pages
2. Simplify agent mapping logic
3. Update tests

### Step 5: Enforcement (Post-Launch)
1. Ensure foreign keys are enabled
2. Monitor for any constraint violations
3. Add application-level validation as backup

## Conclusion

This is a **critical data integrity issue** that should be fixed before launch. The current workarounds are fragile and will cause problems as the application scales. The migration is straightforward but requires careful planning to avoid data loss.

**Priority: HIGH** - Should be addressed before production launch.

