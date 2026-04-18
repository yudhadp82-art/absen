ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_type_check;

ALTER TABLE attendance
ADD CONSTRAINT attendance_type_check
CHECK (type IN ('checkin', 'checkout', 'overtime'));
