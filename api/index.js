// Vercel Serverless Function for API
// This handles API requests for attendance system

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // GET /api/health - Health check
    if (req.url === '/api/health' || query.__path === 'health') {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('count')
          .limit(1);

        if (error) throw error;

        return res.status(200).json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'Employee Attendance API',
          version: '2.0.0',
          database: 'Supabase connected'
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Database connection failed',
          error: error.message
        });
      }
    }

    // GET /api/attendance - Get attendance history
    if (method === 'GET') {
      const { employeeId, date, startDate: qStart, endDate: qEnd, limit = 100, offset = 0 } = query;

      let queryBuilder = supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (employeeId) {
        queryBuilder = queryBuilder.eq('employee_id', employeeId);
      }

      if (qStart || qEnd || date) {
        const start = qStart || date;
        const end = qEnd || date || qStart;

        const startTime = new Date(start);
        startTime.setHours(0, 0, 0, 0);

        const endTime = new Date(end);
        endTime.setHours(23, 59, 59, 999);

        queryBuilder = queryBuilder.gte('created_at', startTime.toISOString())
                             .lte('created_at', endTime.toISOString());
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch attendance records',
          details: error.message
        });
      }

      const transformedData = data.map(record => ({
        id: record.id,
        employeeId: record.employee_id,
        employeeName: record.employee_name,
        type: record.type,
        location: {
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          accuracy: record.accuracy,
          address: record.address
        },
        timestamp: record.created_at,
        deviceId: record.device_id
      }));

      return res.status(200).json({
        success: true,
        data: transformedData,
        count: transformedData.length
      });
    }

    // POST /api/recalculate - Trigger historical data recalculation
    if (method === 'POST' && req.url === '/api/recalculate') {
      try {
        console.log('=================================');
        console.log('Recalculation endpoint called');
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);

        console.log('Starting historical data recalculation...');

        // Get all checkin records that have matching checkout records
        const { data: checkins, error: checkinsError } = await supabase
          .from('attendance')
          .select('*')
          .eq('type', 'checkin');

        if (checkinsError) {
          throw new Error(`Failed to fetch checkins: ${checkinsError.message}`);
        }

        let updatedCount = 0;

        // Process each checkin record
        for (const checkin of checkins) {
          // Find the corresponding checkout for the same employee and date
          const checkinDate = new Date(checkin.created_at).toISOString().split('T')[0];

          const { data: checkouts, error: checkoutsError } = await supabase
            .from('attendance')
            .select('*')
            .eq('type', 'checkout')
            .eq('employee_id', checkin.employee_id)
            .gte('created_at', `${checkinDate}T00:00:00.000Z`)
            .lt('created_at', `${checkinDate}T23:59:59.999Z`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (checkoutsError) {
            console.error(`Error fetching checkout for ${checkin.employee_id}:`, checkoutsError);
            continue;
          }

          if (!checkouts || checkouts.length === 0) {
            continue; // No checkout found for this date
          }

          const checkout = checkouts[0];

          // Calculate work hours and incentive
          const checkinTime = new Date(checkin.created_at);
          const checkoutTime = new Date(checkout.created_at);
          const rawHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);

          if (!Number.isFinite(rawHours) || rawHours <= 0) {
            continue;
          }

          // Calculate incentive deduction based on checkout time
          const checkoutHour = checkoutTime.getHours();
          let incentiveDeduction = 0;

          if (checkoutHour < 1) {
            incentiveDeduction = 3000; // Before 1:00 AM
          } else if (checkoutHour >= 2) {
            incentiveDeduction = 6000; // After 2:00 AM
          }
          // Between 1:00-2:00 AM → no deduction

          const workHours = rawHours;
          const rawIncentive = workHours * 6000;
          let incentive = Math.max(0, rawIncentive - incentiveDeduction);

          // Update checkin record
          const { error: checkinUpdateError } = await supabase
            .from('attendance')
            .update({
              work_hours: workHours,
              incentive: incentive
            })
            .eq('id', checkin.id);

          if (checkinUpdateError) {
            console.error(`Error updating checkin ${checkin.id}:`, checkinUpdateError);
            continue;
          }

          // Update checkout record
          const { error: checkoutUpdateError } = await supabase
            .from('attendance')
            .update({
              work_hours: workHours,
              incentive: incentive
            })
            .eq('id', checkout.id);

          if (checkoutUpdateError) {
            console.error(`Error updating checkout ${checkout.id}:`, checkoutUpdateError);
            continue;
          }

          updatedCount++;
        }

        console.log(`Recalculation completed. Updated ${updatedCount} record pairs.`);
        console.log('=================================');

        return res.status(200).json({
          success: true,
          message: 'Historical data recalculation completed successfully',
          recordsUpdated: updatedCount,
          details: 'All attendance records have been updated with new incentive deduction logic: < 1:00 AM → -Rp 3.000, ≥ 2:00 AM → -Rp 6.000'
        });

      } catch (error) {
        console.error('=================================');
        console.error('Recalculation endpoint error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: error.message
        });
      }
    }

    // POST /api/attendance - Submit attendance
    if (method === 'POST') {
      const {
        employeeId,
        employeeName,
        type,
        latitude,
        longitude,
        accuracy,
        address,
        deviceId
      } = req.body;

      // Validation
      if (!employeeId || !type || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, type, latitude, longitude'
        });
      }

      if (type !== 'checkin' && type !== 'checkout') {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "checkin" or "checkout"'
        });
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates'
        });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({
          success: false,
          error: 'Coordinates out of valid range'
        });
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            employee_id: employeeId,
            employee_name: employeeName || 'Unknown',
            type: type,
            latitude: lat,
            longitude: lon,
            accuracy: accuracy ? parseFloat(accuracy) : null,
            address: address || null,
            device_id: deviceId || null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to save attendance record',
          details: error.message
        });
      }

      const transformedData = {
        id: data.id,
        employeeId: data.employee_id,
        employeeName: data.employee_name,
        type: data.type,
        location: {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: data.accuracy,
          address: data.address
        },
        timestamp: data.created_at,
        deviceId: data.device_id
      };

      return res.status(201).json({
        success: true,
        message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} berhasil`,
        data: transformedData
      });
    }

    // Method not supported
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${method} Not Allowed`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}