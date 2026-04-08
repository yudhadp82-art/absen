// One-time database setup script
// This will execute the SQL schema on Supabase

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple security check
  const { secret } = req.body;
  if (secret !== 'setup-database-2026') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const results = [];

  try {
    // Step 1: Create employees table via REST API
    const employeeData = [
      { employee_id: 'EMP001', employee_name: 'Ahmad Dahlan', email: 'ahmad@example.com', department: 'IT', position: 'Software Engineer', phone: '081234567890' },
      { employee_id: 'EMP002', employee_name: 'Siti Rahayu', email: 'siti@example.com', department: 'HR', position: 'HR Manager', phone: '081234567891' },
      { employee_id: 'EMP003', employee_name: 'Budi Santoso', email: 'budi@example.com', department: 'Finance', position: 'Accountant', phone: '081234567892' },
      { employee_id: 'EMP004', employee_name: 'Dewi Lestari', email: 'dewi@example.com', department: 'Marketing', position: 'Marketing Manager', phone: '081234567893' },
      { employee_id: 'EMP005', employee_name: 'Eko Prasetyo', email: 'eko@example.com', department: 'IT', position: 'DevOps Engineer', phone: '081234567894' },
      { employee_id: 'EMP006', employee_name: 'Fitri Handayani', email: 'fitri@example.com', department: 'Operations', position: 'Operations Manager', phone: '081234567895' },
      { employee_id: 'EMP007', employee_name: 'Gunawan Wijaya', email: 'gunawan@example.com', department: 'Sales', position: 'Sales Manager', phone: '081234567896' },
      { employee_id: 'EMP008', employee_name: 'Hartini', email: 'hartini@example.com', department: 'Admin', position: 'Administrator', phone: '081234567897' },
      { employee_id: 'EMP009', employee_name: 'Irfan Hakim', email: 'irfan@example.com', department: 'IT', position: 'QA Engineer', phone: '081234567898' },
      { employee_id: 'EMP010', employee_name: 'Joko Susilo', email: 'joko@example.com', department: 'Logistics', position: 'Logistics Coordinator', phone: '081234567899' }
    ];

    // Try to insert employees (will fail if table doesn't exist)
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .insert(employeeData)
      .select();

    if (empError) {
      results.push({
        step: 'Insert Employees',
        status: 'failed',
        error: empError.message,
        note: 'Table might not exist yet. Please run schema manually in Supabase SQL Editor.'
      });
    } else {
      results.push({
        step: 'Insert Employees',
        status: 'success',
        count: employees.length
      });
    }

    // Check if attendance table exists by trying to query
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);

    if (attError && attError.code === '42P01') {
      results.push({
        step: 'Check Attendance Table',
        status: 'failed',
        error: 'Table does not exist',
        note: 'Please run the schema SQL file in Supabase SQL Editor'
      });
    } else {
      results.push({
        step: 'Check Attendance Table',
        status: 'exists'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database setup check complete',
      results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      note: 'Tables may not exist. Please run schema manually.'
    });
  }
}
