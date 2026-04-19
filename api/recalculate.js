// Vercel Serverless Function for Recalculating Historical Data
// This recalculates all existing attendance records with new deduction logic

const { createClient } = require('@supabase/supabase-js');

// Reuse the calculation function from daily report
function calculateWorkAndIncentive(checkinTime, checkoutTime, hourlyRate = 6000, roundingUnit = 1000) {
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

  // Check checkout hour for break hours and deduction
  const checkoutHour = checkout.getHours();
  const isBeforeOnePM = checkoutHour < 13; // Before 13:00 (1:00 PM)
  let breakHours = 0;
  let incentiveDeduction = 0;

  if (isBeforeOnePM) {
    // No break deduction and no incentive deduction if checkout before 13:00
    breakHours = 0;
    incentiveDeduction = 0;
  } else {
    // No break deduction but Rp 6,000 incentive deduction if checkout after 13:00
    breakHours = 0;
    incentiveDeduction = 6000;
  }

  const workHours = Math.max(0, rawHours - breakHours);
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

function formatDateKey(timestamp) {
  return new Date(timestamp).toISOString().split('T')[0];
}

export default async function handler(req, res) {
  try {
    // Check if this is a POST request
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed'
      });
    }

    const { confirm } = await req.json();

    if (!confirm || confirm !== 'yes') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { confirm: "yes" } in request body to proceed.'
      });
    }

    console.log('Starting recalculation of all historical attendance data...');

    // Get all attendance records
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: true });

    if (attendanceError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance records',
        details: attendanceError.message
      });
    }

    console.log(`Found ${attendance.length} attendance records to recalculate`);

    let updatedRecords = 0;
    let skippedRecords = 0;

    // Process attendance records in pairs (checkin + checkout)
    const attendanceMap = new Map();
    attendance.forEach(record => {
      const key = `${record.employee_id}_${formatDateKey(record.created_at)}`;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, record);
      } else {
        const existing = attendanceMap.get(key);
        if (existing.type === 'checkin' && record.type === 'checkout') {
          // This is a checkin-checkout pair - we need to recalculate
          const checkin = existing;
          const checkout = record;

          if (!checkout.checkout_time) {
            return; // Skip if no checkout time
          }

          // Calculate with new deduction logic
          const checkinTime = checkin.created_at;
          const checkoutTime = checkout.created_at;
          const calc = calculateWorkAndIncentive(checkinTime, checkoutTime);

          console.log(`Recalculating for employee ${checkin.employee_id} on ${formatDateKey(checkinTime)}`);
          console.log(`  Checkin: ${checkinTime}, Checkout: ${checkoutTime}`);
          console.log(`  Work Hours: ${calc.workHours}, New Incentive: ${calc.incentive}`);

          // Update both checkin and checkout records with recalculated incentive
          const { error: checkinUpdateError } = await supabase
            .from('attendance')
            .update({ work_hours: calc.workHours, incentive: calc.incentive })
            .eq('id', checkin.id);

          const { error: checkoutUpdateError } = await supabase
            .from('attendance')
            .update({ work_hours: calc.workHours, incentive: calc.incentive })
            .eq('id', checkout.id);

          if (checkinUpdateError || checkoutUpdateError) {
            console.error(`Failed to update record ${checkin.id}: ${checkinUpdateError?.message || checkoutUpdateError?.message}`);
            skippedRecords++;
          } else {
            updatedRecords += 2; // 2 records updated per pair
          }
        }
      }
    });

    console.log(`Recalculation complete: ${updatedRecords} records updated, ${skippedRecords} records skipped`);

    return res.status(200).json({
      success: true,
      message: 'Historical data recalculation completed',
      summary: {
        totalRecords: attendance.length,
        updatedRecords: updatedRecords,
        skippedRecords: skippedRecords
      }
    });

  } catch (error) {
    console.error('Recalculation Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
