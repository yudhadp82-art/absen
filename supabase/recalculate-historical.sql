-- Recalculate historical attendance data with new deduction logic
-- This script updates work_hours and incentive in attendance table
-- Run this in Supabase SQL Editor

-- Update work hours and incentive for paired checkin-checkout records
-- Only update checkout records that have corresponding checkin
UPDATE attendance a
SET
  work_hours = CASE
    WHEN EXTRACT(HOUR FROM a.created_at) < 13 THEN
      -- Sebelum 13:00 - tidak ada break, tidak ada pengurangan insentif
      GREATEST(0,
        (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) - 0)
    ELSE
      -- Setelah 13:00 - tidak ada break, ada pengurangan Rp 6.000
      GREATEST(0,
        ((EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) - 0)
    END,
  incentive = CASE
    WHEN EXTRACT(HOUR FROM a.created_at) < 13 THEN
      (GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) - 0) * 6000)
    ELSE
      GREATEST(0, ((EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) - 0) * 6000)
    END
FROM attendance a
JOIN attendance c ON a.employee_id = c.employee_id
  AND a.type = 'checkin'
  AND c.type = 'checkout'
  AND DATE(a.created_at) = DATE(c.created_at)
  AND a.created_at = (
    SELECT MAX(created_at)
    FROM attendance
    WHERE employee_id = a.employee_id
      AND type = 'checkin'
      AND DATE(created_at) = DATE(a.created_at)
  )
WHERE c.type = 'checkout'
  AND c.id > a.id; -- Only process unique pairs

-- Note: This only updates checkout records. Checkin records will be updated with the same values
-- The logic is: checkout time < 13:00 = no deduction, ≥ 13:00 = Rp 6.000 deduction