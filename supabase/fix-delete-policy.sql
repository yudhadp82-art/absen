-- Fix Missing DELETE Policy for Employees Table
-- Run this in Supabase SQL Editor to fix deletion functionality

-- This adds the missing DELETE policy to the employees table
-- The issue was that RLS was enabled but no DELETE policy existed

CREATE POLICY IF NOT EXISTS "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Verify the policy was created
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