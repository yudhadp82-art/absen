-- Fix attendance write policies for production
-- Run this in Supabase SQL Editor

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public update attendance" ON attendance;
CREATE POLICY "Allow public update attendance"
    ON attendance
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete attendance" ON attendance;
CREATE POLICY "Allow public delete attendance"
    ON attendance
    FOR DELETE
    TO public
    USING (true);

SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;
