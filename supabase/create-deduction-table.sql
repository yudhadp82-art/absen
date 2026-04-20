-- Create table for incentive deduction rules
CREATE TABLE IF NOT EXISTS incentive_deductions (
  id BIGSERIAL PRIMARY KEY,
  checkout_hour INTEGER NOT NULL,
  deduction_amount INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(checkout_hour)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_incentive_deductions_checkout_hour ON incentive_deductions(checkout_hour);
CREATE INDEX IF NOT EXISTS idx_incentive_deductions_active ON incentive_deductions(is_active);

-- Insert default deduction rules based on new incentive logic
INSERT INTO incentive_deductions (checkout_hour, deduction_amount, description, is_active) VALUES
  (0, 3000, 'Pengurangan Rp 3.000 untuk checkout sebelum 1:00 pagi', true),
  (4, 6000, 'Pengurangan Rp 6.000 untuk checkout setelah 3:00 pagi', true)
ON CONFLICT (checkout_hour) DO NOTHING;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_incentive_deductions_updated_at ON incentive_deductions;
CREATE TRIGGER update_incentive_deductions_updated_at
  BEFORE UPDATE ON incentive_deductions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();