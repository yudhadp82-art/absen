// Vercel Serverless Function for Attendance Statistics
// Handles dashboard statistics

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (attendanceError) throw attendanceError;

    // Get all employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);

    if (employeesError) throw employeesError;

    // Calculate statistics
    const uniqueEmployees = new Set(todayAttendance.map(a => a.employee_id));
    const checkins = todayAttendance.filter(a => a.type === 'checkin').length;
    const checkouts = todayAttendance.filter(a => a.type === 'checkout').length;

    // Get recent activities (last 10)
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) throw activitiesError;

    // Calculate department stats
    const departmentStats = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          total: 0,
          present: 0,
          absent: 0
        };
      }
      departmentStats[dept].total++;
    });

    const presentByDept = {};
    Object.keys(departmentStats).forEach(dept => {
      presentByDept[dept] = new Set();
    });

    todayAttendance.forEach(att => {
      if (att.type !== 'checkin') return;
      const emp = employees.find(e => e.employee_id === att.employee_id);
      if (!emp) return;
      const dept = emp.department || 'Unassigned';
      if (!presentByDept[dept]) presentByDept[dept] = new Set();
      presentByDept[dept].add(emp.employee_id);
    });

    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].present = presentByDept[dept]?.size || 0;
    });

    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].absent = departmentStats[dept].total - departmentStats[dept].present;
    });

    return res.status(200).json({
      success: true,
      data: {
        today: {
          totalEmployees: employees.length,
          uniqueEmployees: uniqueEmployees.size,
          checkins,
          checkouts,
          absent: employees.length - uniqueEmployees.size,
          late: 0 // TODO: Calculate based on check-in time
        },
        recentActivities: recentActivities.map(a => ({
          id: a.id,
          employeeId: a.employee_id,
          employeeName: a.employee_name,
          type: a.type,
          timestamp: a.created_at
        })),
        departmentStats
      }
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}
