-- Recalculate historical attendance data with new deduction logic
-- This script updates work_hours and incentive in attendance table
-- Run this in Supabase SQL Editor

-- Update work hours and incentive for paired checkin-checkout records
-- Only update checkout records that have corresponding checkin
-- Logika perhitungan baru:
-- - Checkout sebelum 1:00: Ada pengurangan Rp 3.000
-- - Checkout 1:00 - 3:00: Tidak ada pengurangan
-- - Checkout setelah 3:00: Ada pengurangan Rp 6.000

UPDATE attendance a
SET
  work_hours = CASE
    WHEN EXTRACT(HOUR FROM c.created_at) < 1 THEN
      -- Sebelum 1:00 AM
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600))
    WHEN EXTRACT(HOUR FROM c.created_at) > 3 THEN
      -- Setelah 3:00 AM
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600))
    ELSE
      -- Antara 1:00 - 3:00 AM
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600))
    END,
  incentive = CASE
    WHEN EXTRACT(HOUR FROM c.created_at) < 1 THEN
      -- Sebelum 1:00 AM: Kurangi Rp 3.000
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) * 6000 - 3000)
    WHEN EXTRACT(HOUR FROM c.created_at) > 3 THEN
      -- Setelah 3:00 AM: Kurangi Rp 6.000
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600) * 6000 - 6000)
    ELSE
      -- Antara 1:00 - 3:00 AM: Full insentif tanpa pengurangan
      GREATEST(0, (EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600)) * 6000
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
-- The logic is: checkout time < 1:00 = Rp 3.000 deduction, > 3:00 = Rp 6.000 deduction