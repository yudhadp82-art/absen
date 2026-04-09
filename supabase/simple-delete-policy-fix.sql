-- Simple DELETE Policy Fix for Employees Table
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public delete employees" ON employees;

-- Step 2: Create the DELETE policy
CREATE POLICY "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Step 3: Verify the policy was created successfully
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;

-- Step 4: Test the policy (optional - this will show if DELETE works)
-- You can uncomment this to test if deletion is allowed:
-- SELECT COUNT(*) as employee_count FROM employees;