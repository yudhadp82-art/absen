-- Payroll/Employee Payment Schema
-- Fitur Pembayaran Karyawan dengan Perhitungan Gaji

-- ============================================================
-- Configuration Constants
-- ============================================================

-- Gaji per jam (Rp.6.000)
-- Istirahat: Kurangi 1 jam kerja
-- Rounding: Total dibulatkan ke terdekat

-- ============================================================
-- Payroll Periods Table
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, calculated, paid, cancelled
    hourly_rate DECIMAL(10, 2) DEFAULT 6000.00, -- Rp.6.000 per jam
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT unique_period_name UNIQUE (period_name, start_date)
);

-- ============================================================
-- Payroll Details Table
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Jam Kerja
    total_work_hours DECIMAL(10, 2) NOT NULL, -- Total jam kerja dalam periode
    work_days INTEGER NOT NULL DEFAULT 0, -- Jumlah hari kerja
    average_hours_per_day DECIMAL(10, 2) DEFAULT 0, -- Rata-rata jam kerja per hari

    -- Pembayaran
    regular_hours DECIMAL(10, 2) DEFAULT 0, -- Jam kerja regular
    overtime_hours DECIMAL(10, 2) DEFAULT 0, -- Jam lembur
    paid_hours DECIMAL(10, 2) NOT NULL, -- Jam yang dibayar (total - 1 istirahat)

    -- Perhitungan Gaji
    regular_pay DECIMAL(15, 2) DEFAULT 0, -- Gaji regular
    overtime_pay DECIMAL(15, 2) DEFAULT 0, -- Gaji lembur
    total_pay DECIMAL(15, 2) NOT NULL, -- Total gaji (dibulatkan)

    -- Status
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, rejected
    payment_date DATE, -- Tanggal pembayaran
    notes TEXT, -- Catatan pembayaran

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Payroll Payments Table
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_detail_id UUID NOT NULL REFERENCES payroll_details(id) ON DELETE CASCADE,

    -- Detail Pembayaran
    payment_method VARCHAR(50), -- cash, transfer, etc.
    payment_reference VARCHAR(100), -- Reference number
    amount_paid DECIMAL(15, 2), -- Jumlah yang dibayar
    payment_date DATE NOT NULL,
    receipt_url TEXT, -- URL bukti pembayaran

    -- Approval
    approved_by UUID REFERENCES employees(id), -- Yang menyetujui
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- ============================================================
-- Work Hours Tracking Table
-- ============================================================

CREATE TABLE IF NOT EXISTS work_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Jam Kerja
    check_in_time TIME,
    check_out_time TIME,
    hours_worked DECIMAL(10, 2) DEFAULT 0,

    -- Jenis Kerja
    work_type VARCHAR(20) DEFAULT 'regular', -- regular, overtime, holiday, sick

    -- Approval
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate work hours for same employee on same day
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date, work_type)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON payroll_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_details_employee ON payroll_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_period ON payroll_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_date ON payroll_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_work_hours_employee_date ON work_hours(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_work_hours_date ON work_hours(date);

-- ============================================================
-- Functions for Payroll Calculation
-- ============================================================

-- Function: Calculate Payroll for Employee
CREATE OR REPLACE FUNCTION calculate_employee_payroll(
    p_payroll_period_id UUID,
    p_employee_id UUID
)
RETURNS TABLE (
    employee_id UUID,
    employee_name VARCHAR,
    total_work_hours DECIMAL,
    regular_hours DECIMAL,
    overtime_hours DECIMAL,
    paid_hours DECIMAL,
    regular_pay DECIMAL,
    overtime_pay DECIMAL,
    total_pay DECIMAL,
    work_days INTEGER,
    avg_hours_per_day DECIMAL
) AS $$
DECLARE
    -- Variables
    v_period_info RECORD;
    v_employee_info RECORD;
    v_total_work_hours DECIMAL(10, 2) := 0;
    v_regular_hours DECIMAL(10, 2) := 0;
    v_overtime_hours DECIMAL(10, 2) := 0;
    v_work_days INTEGER := 0;
    v_hourly_rate DECIMAL(10, 2);
BEGIN
    -- Get period information
    SELECT start_date, end_date, hourly_rate INTO v_period_info
    FROM payroll_periods
    WHERE id = p_payroll_period_id;

    -- Get employee information
    SELECT employee_id, employee_name INTO v_employee_info
    FROM employees
    WHERE id = p_employee_id;

    -- Set hourly rate
    v_hourly_rate := COALESCE(v_period_info.hourly_rate, 6000.00);

    -- Calculate total work hours for the period
    SELECT
        COALESCE(SUM(hours_worked), 0) INTO v_total_work_hours
    FROM work_hours
    WHERE employee_id = p_employee_id
    AND date >= v_period_info.start_date
    AND date <= v_period_info.end_date
    AND work_type = 'regular'
    AND approved = true;

    -- Calculate work days
    SELECT
        COUNT(DISTINCT date) INTO v_work_days
    FROM work_hours
    WHERE employee_id = p_employee_id
    AND date >= v_period_info.start_date
    AND date <= v_period_info.end_date
    AND work_type = 'regular'
    AND approved = true;

    -- Calculate regular and overtime hours
    -- Assuming 8 hours/day is regular work, anything above is overtime
    -- Regular hours: MAX(8 hours * work_days, total_work_hours)
    IF v_work_days * 8 > v_total_work_hours THEN
        v_regular_hours := v_total_work_hours;
        v_overtime_hours := 0;
    ELSE
        v_regular_hours := v_work_days * 8;
        v_overtime_hours := v_total_work_hours - (v_work_days * 8);
    END IF;

    -- Calculate paid hours (total - 1 hour for break/rest)
    IF v_total_work_hours > 1 THEN
        v_total_work_hours := v_total_work_hours - 1;
    END IF;

    -- Calculate pay
    v_regular_pay := v_regular_hours * v_hourly_rate;
    v_overtime_pay := v_overtime_hours * v_hourly_rate;

    -- Calculate average hours per day
    IF v_work_days > 0 THEN
        v_avg_hours_per_day := v_total_work_hours / v_work_days;
    ELSE
        v_avg_hours_per_day := 0;
    END IF;

    -- Return results
    RETURN QUERY
    SELECT
        p_employee_id AS employee_id,
        v_employee_info.employee_name AS employee_name,
        v_total_work_hours AS total_work_hours,
        v_regular_hours AS regular_hours,
        v_overtime_hours AS overtime_hours,
        v_total_work_hours AS paid_hours,
        v_regular_pay AS regular_pay,
        v_overtime_pay AS overtime_pay,
        ROUND(v_regular_pay + v_overtime_pay, 0) AS total_pay,
        v_work_days AS work_days,
        v_avg_hours_per_day AS avg_hours_per_day;
END;
$$ LANGUAGE plpgsql;

-- Function: Bulk Calculate Payroll
CREATE OR REPLACE FUNCTION calculate_bulk_payroll(p_payroll_period_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Get all employees
    FOR emp_rec IN
        SELECT id FROM employees WHERE is_active = true
    LOOP
        -- Insert or update payroll details for each employee
        INSERT INTO payroll_details (
            payroll_period_id,
            employee_id,
            total_work_hours,
            work_days,
            average_hours_per_day,
            regular_hours,
            overtime_hours,
            paid_hours
        )
        SELECT
            p_payroll_period_id,
            emp_rec.id,
            total_work_hours,
            work_days,
            average_hours_per_day,
            regular_hours,
            overtime_hours,
            paid_hours
        FROM calculate_employee_payroll(p_payroll_period_id, emp_rec.id)
        ON CONFLICT (payroll_period_id, employee_id)
        DO UPDATE SET
            total_work_hours = EXCLUDED.total_work_hours,
            work_days = EXCLUDED.work_days,
            average_hours_per_day = EXCLUDED.average_hours_per_day,
            regular_hours = EXCLUDED.regular_hours,
            overtime_hours = EXCLUDED.overtime_hours,
            paid_hours = EXCLUDED.paid_hours
        WHERE payroll_details.payroll_period_id = EXCLUDED.payroll_period_id
        AND payroll_details.employee_id = emp_rec.id;
    END LOOP;

    -- Update payroll period status to calculated
    UPDATE payroll_periods
    SET status = 'calculated',
        updated_at = NOW()
    WHERE id = p_payroll_period_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Enable Row Level Security
-- ============================================================

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_hours ENABLE ROW LEVEL SECURITY;

-- Policies for payroll_periods
CREATE POLICY IF NOT EXISTS "Allow public select payroll_periods"
    ON payroll_periods
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert payroll_periods"
    ON payroll_periods
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update payroll_periods"
    ON payroll_periods
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Policies for payroll_details
CREATE POLICY IF NOT EXISTS "Allow public select payroll_details"
    ON payroll_details
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert payroll_details"
    ON payroll_details
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update payroll_details"
    ON payroll_details
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public delete payroll_details"
    ON payroll_details
    FOR DELETE
    TO public
    USING (true);

-- Policies for payroll_payments
CREATE POLICY IF NOT EXISTS "Allow public select payroll_payments"
    ON payroll_periods
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert payroll_payments"
    ON payroll_periods
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update payroll_payments"
    ON payroll_periods
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Policies for work_hours
CREATE POLICY IF NOT EXISTS "Allow public select work_hours"
    ON work_hours
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert work_hours"
    ON work_hours
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update work_hours"
    ON work_hours
    FOR UPDATE
    TO public
    USING (true);

-- ============================================================
-- Sample Payroll Period
-- ============================================================

INSERT INTO payroll_periods (period_name, start_date, end_date, status, hourly_rate)
VALUES (
    'Payroll April 2026',
    '2026-04-01',
    '2026-04-30',
    'draft',
    6000.00
) ON CONFLICT DO NOTHING;

-- ============================================================
-- Views for Payroll Reports
-- ============================================================

CREATE OR REPLACE VIEW payroll_summary AS
SELECT
    pp.id AS payroll_period_id,
    pp.period_name,
    pp.start_date,
    pp.end_date,
    pp.status,
    pp.hourly_rate,

    COUNT(DISTINCT pd.employee_id) AS total_employees,

    SUM(pd.paid_hours) AS total_paid_hours,
    SUM(pd.total_pay) AS total_payroll,

    AVG(pd.avg_hours_per_day) AS avg_hours_per_employee,

    SUM(CASE WHEN pd.payment_status = 'paid' THEN pd.total_pay ELSE 0 END) AS total_paid,

    SUM(CASE WHEN pd.payment_status = 'pending' THEN pd.total_pay ELSE 0 END) AS total_pending

FROM payroll_periods pp
LEFT JOIN payroll_details pd ON pp.id = pd.payroll_period_id
GROUP BY pp.id, pp.period_name, pp.start_date, pp.end_date, pp.status, pp.hourly_rate;

-- ============================================================
-- Comments for Documentation
-- ============================================================

COMMENT ON TABLE payroll_periods IS 'Periode pembayaran gaji karyawan';
COMMENT ON TABLE payroll_details IS 'Detail pembayaran per karyawan';
COMMENT ON TABLE payroll_payments IS 'Riwayat pembayaran aktual';
COMMENT ON TABLE work_hours IS 'Tracking jam kerja harian';
COMMENT ON FUNCTION calculate_employee_payroll IS 'Menghitung gaji karyawan dengan istirahat (jam kerja - 1)';
COMMENT ON FUNCTION calculate_bulk_payroll IS 'Batch calculation gaji untuk semua karyawan dalam periode';
COMMENT ON VIEW payroll_summary IS 'Ringkasan pembayaran gaji';

-- ============================================================
-- Insert Sample Work Hours for Testing
-- ============================================================

-- Get some employee IDs for testing
INSERT INTO work_hours (employee_id, date, hours_worked, work_type, approved, notes)
SELECT
    e.id,
    '2026-04-01'::DATE,
    8.0, -- 8 hours regular work
    'regular', -- regular work type
    true, -- approved
    'Regular work day'
FROM employees e
WHERE e.is_active = true
LIMIT 5;

INSERT INTO work_hours (employee_id, date, hours_worked, work_type, approved, notes)
SELECT
    e.id,
    '2026-04-02'::DATE,
    7.5, -- 7.5 hours work
    'regular', -- regular work type
    true, -- approved
    'Worked 7.5 hours'
FROM employees e
WHERE e.is_active = true
LIMIT 5;