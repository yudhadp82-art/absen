// Vercel Serverless Function for Report API
// Handles daily attendance reports

const { createClient } = require('@supabase/supabase-js');

function getDayRange(date) {
  const start = `${date}T00:00:00.000Z`;
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return {
    start,
    end: endDate.toISOString()
  };
}

function buildDailySummary(records, employeesById, reportDate) {
  const summaryByEmployee = new Map();

  for (const record of records) {
    const employee = employeesById[record.employee_id] || {};
    const existing = summaryByEmployee.get(record.employee_id) || {
      employee_id: record.employee_id,
      employee_name: employee.employee_name || record.employee_name,
      department: employee.department || null,
      position: employee.position || null,
      email: employee.email || null,
      attendance_date: reportDate,
      checkin_time: null,
      checkout_time: null,
      checkin_latitude: null,
      checkin_longitude: null,
      checkout_latitude: null,
      checkout_longitude: null,
      checkin_count: 0,
      checkout_count: 0
    };

    if (record.type === 'checkin') {
      existing.checkin_count += 1;
      if (!existing.checkin_time || new Date(record.created_at) > new Date(existing.checkin_time)) {
        existing.checkin_time = record.created_at;
        existing.checkin_latitude = record.latitude;
        existing.checkin_longitude = record.longitude;
      }
    }

    if (record.type === 'checkout') {
      existing.checkout_count += 1;
      if (!existing.checkout_time || new Date(record.created_at) > new Date(existing.checkout_time)) {
        existing.checkout_time = record.created_at;
        existing.checkout_latitude = record.latitude;
        existing.checkout_longitude = record.longitude;
      }
    }

    summaryByEmployee.set(record.employee_id, existing);
  }

  return Array.from(summaryByEmployee.values()).sort((left, right) => {
    return (left.employee_name || '').localeCompare(right.employee_name || '');
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;

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
    // GET /api/report/daily - Get daily attendance report
    if (method === 'GET') {
      const { date, department, employeeId } = query;

      // Default to today if no date provided
      const reportDate = date || new Date().toISOString().split('T')[0];
      const { start, end } = getDayRange(reportDate);

      // If employeeId is provided, get single employee report
      if (employeeId) {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: true });

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch employee report',
            details: error.message
          });
        }

        // Get employee info
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', employeeId)
          .single();

        return res.status(200).json({
          success: true,
          date: reportDate,
          employee: employee,
          attendance: data,
          summary: {
            checkin_count: data.filter(r => r.type === 'checkin').length,
            checkout_count: data.filter(r => r.type === 'checkout').length,
            first_checkin: data.find(r => r.type === 'checkin'),
            last_checkout: data.filter(r => r.type === 'checkout').pop()
          }
        });
      }

      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('employee_id, employee_name, department, position, email');

      if (employeesError && department) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch employee metadata',
          details: employeesError.message
        });
      }

      const employeesById = Object.fromEntries(
        (employees || []).map((employee) => [employee.employee_id, employee])
      );

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('employee_name', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch daily report',
          details: error.message
        });
      }

      const filteredAttendance = department
        ? (attendance || []).filter(r => employeesById[r.employee_id]?.department === department)
        : (attendance || []);

      const data = buildDailySummary(filteredAttendance, employeesById, reportDate);

      // Calculate statistics
      const stats = {
        total_employees: data.length,
        checked_in: data.filter(r => r.checkin_time !== null).length,
        checked_out: data.filter(r => r.checkout_time !== null).length,
        not_checked_in: data.filter(r => r.checkin_time === null).length,
        departments: [...new Set(data.map(r => r.department).filter(Boolean))].length
      };

      return res.status(200).json({
        success: true,
        date: reportDate,
        statistics: stats,
        data: data,
        count: data.length
      });
    }

    // Method not supported
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${method} Not Allowed`
    });

  } catch (error) {
    console.error('Report API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
