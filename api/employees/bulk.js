// Vercel Serverless Function for Bulk Employee Import
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { employees } = req.body;

  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input: expected an array of employees'
    });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      error: 'Supabase credentials not configured'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const normalizedEmployees = employees
      .filter(emp => emp?.employeeId && emp?.employeeName)
      .map(emp => ({
        ...emp,
        employeeId: String(emp.employeeId).trim(),
        employeeName: String(emp.employeeName).trim()
      }));

    const uniqueEmployees = [];
    const seenIds = new Set();

    normalizedEmployees.forEach(emp => {
      if (!emp.employeeId || seenIds.has(emp.employeeId)) {
        return;
      }

      seenIds.add(emp.employeeId);
      uniqueEmployees.push(emp);
    });

    const incomingIds = uniqueEmployees.map(emp => emp.employeeId);

    const { data: existingEmployees, error: existingError } = await supabase
      .from('employees')
      .select('employee_id')
      .in('employee_id', incomingIds);

    if (existingError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to validate existing employees',
        details: existingError.message
      });
    }

    const existingIds = new Set((existingEmployees || []).map(emp => emp.employee_id));

    // Transform data to match snake_case database columns
    const insertData = uniqueEmployees
      .filter(emp => !existingIds.has(emp.employeeId))
      .map(emp => ({
      employee_id: emp.employeeId,
      employee_name: emp.employeeName,
      email: emp.email || null,
      department: emp.department || null,
      address: emp.address || null,
      position: emp.position || null,
      phone: emp.phone || null,
      is_active: emp.isActive !== undefined ? emp.isActive : true,
      updated_at: new Date().toISOString()
    }));

    const skippedExisting = existingIds.size;
    const skippedDuplicateRows = normalizedEmployees.length - uniqueEmployees.length;

    if (!insertData.length) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada data baru untuk diimport',
        count: 0,
        skippedExisting,
        skippedDuplicateRows
      });
    }

    // Perform bulk insert for new employee IDs only
    let { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select();

    // Robust check for missing column 'address'
    if (error && error.message.includes('column') && error.message.includes('address')) {
      console.warn('Column "address" not found in bulk import, retrying without it...');
      const simplifiedData = insertData.map(({ address, ...rest }) => rest);
      const retryResult = await supabase
        .from('employees')
        .insert(simplifiedData)
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to bulk import employees',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${insertData.length} employees`,
      count: data ? data.length : insertData.length,
      skippedExisting,
      skippedDuplicateRows
    });

  } catch (error) {
    console.error('Bulk Import API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
