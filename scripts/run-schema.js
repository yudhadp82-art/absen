// Automated database setup script
const https = require('https');

const SUPABASE_URL = 'https://wjtjlwlxygwwrfxbfqmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdGpsd2x4eWd3d3JmeGJmcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDE0MjUsImV4cCI6MjA5MTA3NzQyNX0.bnd5uzdNM95nwvEDgyKbOJzADhJQH3D5vmjtnff5xpc';

// SQL statements to execute
const sqlStatements = [
  // Create employees table
  `CREATE TABLE IF NOT EXISTS employees (
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
  );`,

  // Create attendance table
  `CREATE TABLE IF NOT EXISTS attendance (
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
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
  );`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);`,
  `CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);`,
  `CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC);`,

  // Enable RLS
  `ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE employees ENABLE ROW LEVEL SECURITY;`,

  // Create policies
  `DROP POLICY IF EXISTS "Allow public insert attendance" ON attendance;`,
  `CREATE POLICY "Allow public insert attendance" ON attendance FOR INSERT TO public WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow public select attendance" ON attendance;`,
  `CREATE POLICY "Allow public select attendance" ON attendance FOR SELECT TO public USING (true);`,

  `DROP POLICY IF EXISTS "Allow public select employees" ON employees;`,
  `CREATE POLICY "Allow public select employees" ON employees FOR SELECT TO public USING (true);`,

  `DROP POLICY IF EXISTS "Allow public insert employees" ON employees;`,
  `CREATE POLICY "Allow public insert employees" ON employees FOR INSERT TO public WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow public update employees" ON employees;`,
  `CREATE POLICY "Allow public update employees" ON employees FOR UPDATE TO public USING (true) WITH CHECK (true);`
];

async function executeSQL() {
  console.log('🚀 Starting database setup...\n');

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];

    try {
      const result = await executeQuery(sql);
      console.log(`✅ Step ${i + 1}/${sqlStatements.length}: Success`);
    } catch (error) {
      console.log(`⚠️  Step ${i + 1}/${sqlStatements.length}: ${error.message}`);
    }
  }

  console.log('\n📝 Inserting sample employees...');
  await insertSampleEmployees();

  console.log('\n✨ Database setup complete!');
  console.log('\n🧪 Testing connection...');
  await testConnection();
}

function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: 'wjtjlwlxygwwrfxbfqmi.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Response(res.statusCode, response));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function insertSampleEmployees() {
  const employees = [
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

  for (const emp of employees) {
    try {
      await insertEmployee(emp);
      console.log(`✅ Inserted: ${emp.employee_name} (${emp.employee_id})`);
    } catch (error) {
      console.log(`⚠️  ${emp.employee_id}: ${error.message}`);
    }
  }
}

function insertEmployee(emp) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(emp);

    const options = {
      hostname: 'wjtjlwlxygwwrfxbfqmi.supabase.co',
      port: 443,
      path: '/rest/v1/employees',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 409) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'absen-brown.vercel.app',
      port: 443,
      path: '/api/attendance/stats',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const data = JSON.parse(body);
        if (data.success && data.data.today) {
          console.log(`\n✅ Database connected successfully!`);
          console.log(`📊 Total Employees: ${data.data.today.totalEmployees || 0}`);
          console.log(`🎯 Dashboard: https://admin-dun-alpha.vercel.app`);
        } else {
          console.log(`\n❌ Error: ${data.error || 'Unknown error'}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ Connection error: ${error.message}`);
      resolve();
    });

    req.end();
  });
}

// Run the setup
executeSQL().catch(console.error);
