-- Supabase Database Schema for Employee Attendance System
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    department VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('checkin', 'checkout')),
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
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, created_at);

-- Create a view for daily attendance summary with employee details
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT
    a.employee_id,
    e.employee_name,
    e.department,
    e.position,
    e.email,
    DATE(a.created_at) as attendance_date,
    MAX(CASE WHEN a.type = 'checkin' THEN a.created_at END) as checkin_time,
    MAX(CASE WHEN a.type = 'checkout' THEN a.created_at END) as checkout_time,
    MAX(CASE WHEN a.type = 'checkin' THEN a.latitude END) as checkin_latitude,
    MAX(CASE WHEN a.type = 'checkin' THEN a.longitude END) as checkin_longitude,
    MAX(CASE WHEN a.type = 'checkout' THEN a.latitude END) as checkout_latitude,
    MAX(CASE WHEN a.type = 'checkout' THEN a.longitude END) as checkout_longitude,
    COUNT(CASE WHEN a.type = 'checkin' THEN 1 END) as checkin_count,
    COUNT(CASE WHEN a.type = 'checkout' THEN 1 END) as checkout_count
FROM attendance a
LEFT JOIN employees e ON a.employee_id = e.employee_id
GROUP BY
    a.employee_id,
    e.employee_name,
    e.department,
    e.position,
    e.email,
    DATE(a.created_at)
ORDER BY attendance_date DESC, a.employee_id;

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
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
CREATE POLICY "Allow public insert attendance"
    ON attendance
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select attendance"
    ON attendance
    FOR SELECT
    TO public
    USING (true);

-- Create policies for employees table
CREATE POLICY "Allow public select employees"
    ON employees
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert employees"
    ON employees
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update employees"
    ON employees
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Insert sample employees
INSERT INTO employees (employee_id, employee_name, email, department, position, phone) VALUES
('EMP001', 'Ahmad Dahlan', 'ahmad@example.com', 'IT', 'Software Engineer', '081234567890'),
('EMP002', 'Siti Rahayu', 'siti@example.com', 'HR', 'HR Manager', '081234567891'),
('EMP003', 'Budi Santoso', 'budi@example.com', 'Finance', 'Accountant', '081234567892'),
('EMP004', 'Dewi Lestari', 'dewi@example.com', 'Marketing', 'Marketing Manager', '081234567893'),
('EMP005', 'Eko Prasetyo', 'eko@example.com', 'IT', 'DevOps Engineer', '081234567894'),
('EMP006', 'Fitri Handayani', 'fitri@example.com', 'Operations', 'Operations Manager', '081234567895'),
('EMP007', 'Gunawan Wijaya', 'gunawan@example.com', 'Sales', 'Sales Manager', '081234567896'),
('EMP008', 'Hartini', 'hartini@example.com', 'Admin', 'Administrator', '081234567897'),
('EMP009', 'Irfan Hakim', 'irfan@example.com', 'IT', 'QA Engineer', '081234567898'),
('EMP010', 'Joko Susilo', 'joko@example.com', 'Logistics', 'Logistics Coordinator', '081234567899')
ON CONFLICT (employee_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE employees IS 'Stores employee information';
COMMENT ON TABLE attendance IS 'Stores employee check-in/check-out records with GPS location';
COMMENT ON VIEW daily_attendance_summary IS 'Daily attendance summary with employee details';
COMMENT ON FUNCTION get_attendance_history IS 'Retrieves attendance history with optional filters';
COMMENT ON FUNCTION insert_attendance IS 'Inserts a new attendance record';

-- Create updated_at trigger for employees
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
