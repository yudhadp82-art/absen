// Vercel Serverless Function for Report API
// Handles daily attendance reports

const { createClient } = require('@supabase/supabase-js');

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

      // If employeeId is provided, get single employee report
      if (employeeId) {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('created_at', `${reportDate}T00:00:00.000Z`)
          .lte('created_at', `${reportDate}T23:59:59.999Z`)
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

      // Get daily summary for all or filtered employees
      let queryBuilder = supabase
        .from('daily_attendance_summary')
        .select('*')
        .eq('attendance_date', reportDate)
        .order('employee_name', { ascending: true });

      if (department) {
        queryBuilder = queryBuilder.eq('department', department);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch daily report',
          details: error.message
        });
      }

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
