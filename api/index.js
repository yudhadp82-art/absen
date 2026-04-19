// Vercel Serverless Function for API
// This handles API requests for the attendance system

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
    if (method === 'POST' && query.__path === 'recalculate') {
      try {
        console.log('Recalculation endpoint called');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({
            success: false,
            error: 'Supabase credentials not configured'
          });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Execute the recalculation SQL script
        const fs = require('fs');
        const path = require('path');
        const sqlScript = fs.readFileSync(path.join(__dirname, 'supabase/recalculate-historical.sql'), 'utf8');

        console.log('Executing recalculation SQL script...');

        const { error: execError } = await supabase.rpc('execute_sql', {
          sql: sqlScript
        });

        if (execError) {
          console.error('Recalculation failed:', execError);
          return res.status(500).json({
            success: false,
            error: 'Recalculation failed',
            details: execError.message
          });
        }

        console.log('Recalculation completed successfully');

        return res.status(200).json({
          success: true,
          message: 'Historical data recalculation completed',
          details: 'All attendance records have been updated with new deduction logic'
        });

      } catch (error) {
        console.error('Recalculation endpoint error:', error);
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
