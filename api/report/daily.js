// Vercel Serverless Function for Daily Report API
// Handles GET /api/report/daily

const { createClient } = require('@supabase/supabase-js');

// Cache for deduction rules to avoid repeated database calls
let deductionRulesCache = null;
let cacheExpiry = null;

async function getDeductionRules(supabase) {
  // Check if cache is still valid (5 minutes)
  if (deductionRulesCache && cacheExpiry && Date.now() < cacheExpiry) {
    return deductionRulesCache;
  }

  // Fetch fresh rules from database
  const { data, error } = await supabase
    .from('incentive_deductions')
    .select('*')
    .eq('is_active', true)
    .order('checkout_hour', { ascending: true });

  if (error) {
    console.warn('Failed to fetch deduction rules, using defaults:', error.message);
    // Fallback to default rules
    return [
      { checkout_hour: 0, deduction_amount: 3000 },
      { checkout_hour: 2, deduction_amount: 6000 }
    ];
  }

  // Cache the rules
  deductionRulesCache = data || [];
  cacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes cache

  return deductionRulesCache;
}

function calculateDeduction(checkoutHour, deductionRules) {
  // Sort rules by checkout_hour descending to find the highest matching rule
  const sortedRules = [...deductionRules].sort((a, b) => b.checkout_hour - a.checkout_hour);

  for (const rule of sortedRules) {
    if (checkoutHour >= rule.checkout_hour) {
      return rule.deduction_amount;
    }
  }

  return 0; // No deduction if no rules match
}

function getDayRange(date) {
  const start = `${date}T00:00:00.000Z`;
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return {
    start,
    end: endDate.toISOString()
  };
}

function getRangeBoundaries(startDate, endDate) {
  const start = `${startDate}T00:00:00.000Z`;
  const end = new Date(`${endDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    start,
    end: end.toISOString()
  };
}

function formatDateKey(timestamp) {
  return new Date(timestamp).toISOString().split('T')[0];
}

function calculateWorkAndIncentive(checkinTime, checkoutTime, deductionRules, hourlyRate = 6000, roundingUnit = 1000) {
  if (!checkinTime || !checkoutTime) {
    return {
      workHours: 0,
      incentive: 0
    };
  }

  const checkin = new Date(checkinTime);
  const checkout = new Date(checkoutTime);
  const rawHours = (checkout - checkin) / (1000 * 60 * 60);

  if (!Number.isFinite(rawHours) || rawHours <= 0) {
    return {
      workHours: 0,
      incentive: 0
    };
  }

  // Calculate incentive deduction based on checkout time
  const checkoutHour = checkout.getHours();
  const checkoutMinute = checkout.getMinutes();
  let incentiveDeduction = 0;
  if (checkoutHour < 13) {
      incentiveDeduction = 3000;
  } else if (checkoutHour >= 15) {
      incentiveDeduction = 6000;
  } else if (checkoutHour === 14 || (checkoutHour === 13 && checkoutMinute >= 59)) {
      // Checkout between 13:59 - 14:59
      incentiveDeduction = 3000;
  }

  const workHours = rawHours;
  let incentive = Math.round((workHours * hourlyRate) / roundingUnit) * roundingUnit;

  // Apply incentive deduction if applicable
  if (incentiveDeduction > 0) {
    incentive = Math.max(0, incentive - incentiveDeduction);
  }

  return {
    workHours,
    incentive
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
      overtime_time: null,
      checkin_latitude: null,
      checkin_longitude: null,
      checkout_latitude: null,
      checkout_longitude: null,
      overtime_latitude: null,
      overtime_longitude: null,
      checkin_count: 0,
      checkout_count: 0,
      overtime_count: 0
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

    if (record.type === 'overtime') {
      existing.overtime_count += 1;
      if (!existing.overtime_time || new Date(record.created_at) > new Date(existing.overtime_time)) {
        existing.overtime_time = record.created_at;
        existing.overtime_latitude = record.latitude;
        existing.overtime_longitude = record.longitude;
      }
    }

    summaryByEmployee.set(record.employee_id, existing);
  }

  return Array.from(summaryByEmployee.values()).sort((left, right) => {
    return (left.employee_name || '').localeCompare(right.employee_name || '');
  });
}

export default async function handler(req, res) {
  // CORS headers for cross-origin admin requests.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      error: 'Supabase credentials not configured'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch deduction rules for incentive calculations
  let deductionRules = [];
  try {
    deductionRules = await getDeductionRules(supabase);
  } catch (error) {
    console.warn('Failed to fetch deduction rules, will use defaults:', error.message);
  }

  try {
    const { date, department, employeeId, startDate, endDate, mode } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    if (mode === 'range' || startDate || endDate) {
      const rangeStartDate = startDate || reportDate;
      const rangeEndDate = endDate || rangeStartDate;

      if (rangeStartDate > rangeEndDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate tidak boleh lebih besar dari endDate'
        });
      }

      const { start, end } = getRangeBoundaries(rangeStartDate, rangeEndDate);
      let attendanceQuery = supabase
          .from('attendance')
          .select('employee_id, employee_name, type, created_at')
          .gte('created_at', start)
          .lt('created_at', end);

      if (employeeId) {
        attendanceQuery = attendanceQuery.eq('employee_id', employeeId);
      }

      const [{ data: employees, error: employeesError }, { data: attendance, error: attendanceError }] = await Promise.all([
        supabase
          .from('employees')
          .select('employee_id, employee_name, department'),
        attendanceQuery.order('created_at', { ascending: true })
      ]);

      if (employeesError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch employees',
          details: employeesError.message
        });
      }

      if (attendanceError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch attendance range',
          details: attendanceError.message
        });
      }

      const employeeMap = Object.fromEntries(
        (employees || []).map((employee) => [employee.employee_id, employee])
      );

      const dailyMap = new Map();
      const employeeDailyMap = new Map();

      (attendance || []).forEach((record) => {
        const dateKey = formatDateKey(record.created_at);
        const employee = employeeMap[record.employee_id] || {};
        const existing = dailyMap.get(dateKey) || {
          date: dateKey,
          checkins: 0,
          checkouts: 0,
          overtimes: 0,
          uniqueEmployees: new Set(),
          departments: new Set()
        };

        if (record.type === 'checkin') {
          existing.checkins += 1;
          existing.uniqueEmployees.add(record.employee_id);
        }

        if (record.type === 'checkout') {
          existing.checkouts += 1;
        }

        if (record.type === 'overtime') {
          existing.overtimes += 1;
        }

        if (employee.department) {
          existing.departments.add(employee.department);
        }

        dailyMap.set(dateKey, existing);

        const employeeDayKey = `${record.employee_id}::${dateKey}`;
        const employeeDaily = employeeDailyMap.get(employeeDayKey) || {
          employee_id: record.employee_id,
          employee_name: employee.employee_name || record.employee_name || record.employee_id,
          department: employee.department || null,
          date: dateKey,
          checkin_time: null,
          checkout_time: null,
          overtime_time: null
        };

        if (record.type === 'checkin' && (!employeeDaily.checkin_time || new Date(record.created_at) > new Date(employeeDaily.checkin_time))) {
          employeeDaily.checkin_time = record.created_at;
        }

        if (record.type === 'checkout' && (!employeeDaily.checkout_time || new Date(record.created_at) > new Date(employeeDaily.checkout_time))) {
          employeeDaily.checkout_time = record.created_at;
        }

        if (record.type === 'overtime' && (!employeeDaily.overtime_time || new Date(record.created_at) > new Date(employeeDaily.overtime_time))) {
          employeeDaily.overtime_time = record.created_at;
        }

        employeeDailyMap.set(employeeDayKey, employeeDaily);
      });

      const rangeData = Array.from(dailyMap.values())
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((item) => ({
          date: item.date,
          checkins: item.checkins,
          checkouts: item.checkouts,
          overtimes: item.overtimes,
          uniqueEmployees: item.uniqueEmployees.size,
          departments: item.departments.size
        }));

      const paymentByEmployee = new Map();
      Array.from(employeeDailyMap.values()).forEach((item) => {
        const payment = paymentByEmployee.get(item.employee_id) || {
          employeeId: item.employee_id,
          employeeName: item.employee_name,
          department: item.department || '-',
          attendanceDays: 0,
          completedDays: 0,
          overtimeDays: 0,
          workHours: 0,
          incentive: 0
        };

        const hasAttendance = Boolean(item.checkin_time || item.checkout_time || item.overtime_time);
        if (hasAttendance) {
          payment.attendanceDays += 1;
        }

        if (item.checkin_time && item.checkout_time) {
          const calc = calculateWorkAndIncentive(item.checkin_time, item.checkout_time, deductionRules);
          payment.completedDays += 1;
          payment.workHours += calc.workHours;
          payment.incentive += calc.incentive;
        }

        if (item.overtime_time) {
          payment.overtimeDays += 1;
        }

        paymentByEmployee.set(item.employee_id, payment);
      });

      const paymentDetails = Array.from(paymentByEmployee.values())
        .sort((left, right) => left.employeeName.localeCompare(right.employeeName))
        .map((item) => ({
          ...item,
          workHours: Number(item.workHours.toFixed(2))
        }));

      const employeeRecap = Array.from(employeeDailyMap.values())
        .reduce((map, item) => {
          const existing = map.get(item.employee_id) || {
            employeeId: item.employee_id,
            employeeName: item.employee_name,
            department: item.department || '-',
            attendanceDays: 0,
            checkinDays: 0,
            checkoutDays: 0,
            overtimeDays: 0,
            completedDays: 0,
            incompleteDays: 0,
            lastCheckin: null,
            lastCheckout: null,
            lastOvertime: null
          };

          const hasAttendance = Boolean(item.checkin_time || item.checkout_time || item.overtime_time);
          if (hasAttendance) existing.attendanceDays += 1;
          if (item.checkin_time) {
            existing.checkinDays += 1;
            if (!existing.lastCheckin || new Date(item.checkin_time) > new Date(existing.lastCheckin)) {
              existing.lastCheckin = item.checkin_time;
            }
          }
          if (item.checkout_time) {
            existing.checkoutDays += 1;
            if (!existing.lastCheckout || new Date(item.checkout_time) > new Date(existing.lastCheckout)) {
              existing.lastCheckout = item.checkout_time;
            }
          }
          if (item.overtime_time) {
            existing.overtimeDays += 1;
            if (!existing.lastOvertime || new Date(item.overtime_time) > new Date(existing.lastOvertime)) {
              existing.lastOvertime = item.overtime_time;
            }
          }
          if (item.checkin_time && item.checkout_time) {
            existing.completedDays += 1;
          } else if (hasAttendance) {
            existing.incompleteDays += 1;
          }

          map.set(item.employee_id, existing);
          return map;
        }, new Map());

      const employeeRecapData = Array.from(employeeRecap.values())
        .sort((left, right) => left.employeeName.localeCompare(right.employeeName))
        .map((item) => ({
          ...item,
          status: item.completedDays > 0 && item.incompleteDays === 0
            ? 'Lengkap'
            : item.completedDays > 0 || item.incompleteDays > 0
              ? 'Parsial'
              : 'Belum Lengkap'
        }));

      const totals = rangeData.reduce((acc, item) => {
        acc.days += 1;
        acc.checkins += item.checkins;
        acc.checkouts += item.checkouts;
        acc.overtimes += item.overtimes;
        acc.uniqueEmployees += item.uniqueEmployees;
        return acc;
      }, {
        days: 0,
        checkins: 0,
        checkouts: 0,
        overtimes: 0,
        uniqueEmployees: 0,
        paymentEmployees: 0,
        totalWorkHours: 0,
        totalIncentive: 0
      });

      totals.paymentEmployees = paymentDetails.length;
      totals.totalWorkHours = Number(paymentDetails.reduce((sum, item) => sum + item.workHours, 0).toFixed(2));
      totals.totalIncentive = paymentDetails.reduce((sum, item) => sum + item.incentive, 0);

      return res.status(200).json({
        success: true,
        mode: 'range',
        range: {
          startDate: rangeStartDate,
          endDate: rangeEndDate
        },
        totals,
        data: rangeData,
        paymentDetails,
        employeeRecap: employeeRecapData
      });
    }

    const { start, end } = getDayRange(reportDate);

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

      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      return res.status(200).json({
        success: true,
        date: reportDate,
        employee,
        attendance: data,
        summary: {
          checkin_count: data.filter((record) => record.type === 'checkin').length,
          checkout_count: data.filter((record) => record.type === 'checkout').length,
          overtime_count: data.filter((record) => record.type === 'overtime').length,
          first_checkin: data.find((record) => record.type === 'checkin'),
          last_checkout: data.filter((record) => record.type === 'checkout').pop(),
          last_overtime: data.filter((record) => record.type === 'overtime').pop()
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
      ? (attendance || []).filter((record) => employeesById[record.employee_id]?.department === department)
      : (attendance || []);

    const data = buildDailySummary(filteredAttendance, employeesById, reportDate);

    const stats = {
      total_employees: data.length,
      checked_in: data.filter((record) => record.checkin_time !== null).length,
      checked_out: data.filter((record) => record.checkout_time !== null).length,
      overtime: data.filter((record) => record.overtime_time !== null).length,
      not_checked_in: data.filter((record) => record.checkin_time === null).length,
      departments: [...new Set(data.map((record) => record.department).filter(Boolean))].length
    };

    return res.status(200).json({
      success: true,
      date: reportDate,
      statistics: stats,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Daily Report API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
