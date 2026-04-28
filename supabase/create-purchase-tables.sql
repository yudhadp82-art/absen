-- Create tables for purchase data and cost breakdown
-- These tables will be used to track purchases and their cost breakdown

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  purchase_date DATE NOT NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  supplier TEXT,
  purchase_number TEXT,
  invoice_number TEXT,
  category TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_breakdowns table
CREATE TABLE IF NOT EXISTS purchase_breakdowns (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGSERIAL NOT NULL,
  cost_category VARCHAR(20) NOT NULL,
  cost_name TEXT,
  cost_amount DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_purchase_breakdown_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category);
CREATE INDEX IF NOT EXISTS idx_purchase_breakdowns_purchase_id ON purchase_breakdowns(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_breakdowns_category ON purchase_breakdowns(cost_category);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_purchase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_updated_at();

DROP TRIGGER IF EXISTS update_purchase_breakdowns_updated_at ON purchase_breakdowns;
CREATE TRIGGER update_purchase_breakdowns_updated_at
  BEFORE UPDATE ON purchase_breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_updated_at();

-- Insert sample data for testing
INSERT INTO purchases (purchase_date, description, total_amount, category, created_by) VALUES
  (CURRENT_DATE, 'Contoh Pembelian Awal', 500000, 'operational', 'admin'),
  (CURRENT_DATE, 'Pembelian ATK Kantor', 150000, 'atk', 'admin'),
  (CURRENT_DATE, 'Token Internet Bulanan', 300000, 'tenaga', 'admin');

-- Insert sample breakdown data
INSERT INTO purchase_breakdowns (purchase_id, cost_category, cost_name, cost_amount, quantity) VALUES
  (1, 'tenaga', 'Listrik Kantor', 100000, 1),
  (1, 'tenaga', 'Internet Fiber', 50000, 1),
  (1, 'ongkir', 'Biaya Pengiriman Paket', 100000, 1),
  (2, 'atk', 'Kertas A4', 50000, 5),
  (2, 'atk', 'Pulpen', 10000, 2),
  (3, 'lain-lain', 'ATK Maintenance', 20000, 1);

-- Notes
-- - cost_category options: 'tenaga', 'ongkir', 'atk', 'lain-lain'
-- - Use RLS (Row Level Security) if needed for multi-tenant
-- - Add validation for positive amounts
-- - Add constraints for required fields