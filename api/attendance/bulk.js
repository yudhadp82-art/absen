// Vercel Serverless Function for Bulk Attendance Import
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

  const { attendance } = req.body;

  if (!attendance || !Array.isArray(attendance)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input: expected an array of attendance records'
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
    // Transform data to match snake_case database columns
    const insertData = attendance.map(att => ({
      employee_id: att.employeeId,
      employee_name: att.employeeName,
      type: att.type || 'checkin',
      timestamp: att.timestamp || new Date().toISOString(),
      location: att.location || { latitude: 0, longitude: 0 },
      created_at: att.timestamp || new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('attendance')
      .insert(insertData)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to bulk import attendance',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${insertData.length} records`,
      count: data.length
    });

  } catch (error) {
    console.error('Bulk Attendance API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
