-- Simple script to delete all employees
-- Run this in Supabase SQL Editor

-- Step 1: Check current employee count
SELECT COUNT(*) as current_employee_count FROM employees;

-- Step 2: Delete all employees
DELETE FROM employees;

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_employee_count FROM employees;

-- Step 4: Confirmation message
SELECT 'All employees have been deleted successfully' as status;