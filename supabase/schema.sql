-- Supabase Database Schema for Employee Attendance System
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('checkin', 'checkout', 'overtime')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT,
    address TEXT,
    device_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Validation: Coordinates must be within valid ranges
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, created_at);

-- Create a view for daily attendance summary
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT
    employee_id,
    employee_name,
    DATE(created_at) as attendance_date,
    MAX(CASE WHEN type = 'checkin' THEN created_at END) as checkin_time,
    MAX(CASE WHEN type = 'checkout' THEN created_at END) as checkout_time,
    MAX(CASE WHEN type = 'overtime' THEN created_at END) as overtime_time,
    MAX(CASE WHEN type = 'checkin' THEN latitude END) as checkin_latitude,
    MAX(CASE WHEN type = 'checkin' THEN longitude END) as checkin_longitude,
    MAX(CASE WHEN type = 'checkout' THEN latitude END) as checkout_latitude,
    MAX(CASE WHEN type = 'checkout' THEN longitude END) as checkout_longitude,
    MAX(CASE WHEN type = 'overtime' THEN latitude END) as overtime_latitude,
    MAX(CASE WHEN type = 'overtime' THEN longitude END) as overtime_longitude
FROM attendance
GROUP BY employee_id, employee_name, DATE(created_at)
ORDER BY attendance_date DESC, employee_id;

-- Create a function to get attendance history
CREATE OR REPLACE FUNCTION get_attendance_history(
    p_employee_id VARCHAR DEFAULT NULL,
    p_date DATE DEFAULT NULL,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    employee_id VARCHAR,
    employee_name VARCHAR,
    type VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    accuracy FLOAT,
    address TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.employee_id,
        a.employee_name,
        a.type,
        a.latitude,
        a.longitude,
        a.accuracy,
        a.address,
        a.created_at
    FROM attendance a
    WHERE
        (p_employee_id IS NULL OR a.employee_id = p_employee_id)
        AND (p_date IS NULL OR DATE(a.created_at) = p_date)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create a function to insert attendance record
CREATE OR REPLACE FUNCTION insert_attendance(
    p_employee_id VARCHAR,
    p_employee_name VARCHAR,
    p_type VARCHAR,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy FLOAT DEFAULT NULL,
    p_address VARCHAR DEFAULT NULL,
    p_device_id VARCHAR DEFAULT NULL
)
RETURNS attendance AS $$
DECLARE
    v_record attendance;
BEGIN
    INSERT INTO attendance (
        employee_id,
        employee_name,
        type,
        latitude,
        longitude,
        accuracy,
        address,
        device_id
    ) VALUES (
        p_employee_id,
        p_employee_name,
        p_type,
        p_latitude,
        p_longitude,
        p_accuracy,
        p_address,
        p_device_id
    )
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
-- For this demo, we'll allow public access. In production, implement proper auth!

-- Policy to allow anyone to insert attendance
CREATE POLICY "Allow public insert"
    ON attendance
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy to allow anyone to view attendance
CREATE POLICY "Allow public select"
    ON attendance
    FOR SELECT
    TO public
    USING (true);

-- Policy to allow anyone to update their own records (if needed)
CREATE POLICY "Allow update own records"
    ON attendance
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Create a table for employees (optional, for better employee management)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    department VARCHAR(255),
    address TEXT,
    position VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Enable RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select employees"
    ON employees
    FOR SELECT
    TO public
    USING (true);

-- Handle existing policies safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Allow public insert employees') THEN
        DROP POLICY IF EXISTS "Allow public insert employees" ON employees;
    END IF;
END $$;

CREATE POLICY "Allow public insert employees"
    ON employees
    FOR INSERT
    TO public
    WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Allow public update employees') THEN
        DROP POLICY IF EXISTS "Allow public update employees" ON employees;
    END IF;
END $$;

CREATE POLICY "Allow public update employees"
    ON employees
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Allow public delete employees') THEN
        DROP POLICY IF EXISTS "Allow public delete employees" ON employees;
    END IF;
END $$;

CREATE POLICY "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Comments for documentation
COMMENT ON TABLE attendance IS 'Stores employee check-in/check-out records with GPS location';
COMMENT ON TABLE employees IS 'Stores employee information';

COMMENT ON FUNCTION get_attendance_history IS 'Retrieves attendance history with optional filters';
COMMENT ON FUNCTION insert_attendance IS 'Inserts a new attendance record';

-- Sample data for testing (optional)
-- Uncomment to insert sample data:

/*
INSERT INTO employees (employee_id, employee_name, email, department, position) VALUES
('EMP001', 'John Doe', 'john@example.com', 'IT', 'Software Engineer'),
('EMP002', 'Jane Smith', 'jane@example.com', 'HR', 'HR Manager'),
('EMP003', 'Bob Johnson', 'bob@example.com', 'Finance', 'Accountant');
*/
