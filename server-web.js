// Express Server dengan Supabase Database + Static Web Serving
// Backend API untuk Sistem Absensi Karyawan - Web App Version

require('./lib/load-env').loadLocalEnv();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from web directory
app.use(express.static(path.join(__dirname, 'web')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('attendance')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      });
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Employee Attendance API',
      version: '2.0.0',
      database: 'Supabase connected',
      webapp: 'Available at /'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get attendance history
app.get('/api/attendance', async (req, res) => {
  try {
    const { id, employeeId, date, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filter by employee ID if provided
    if (id) {
      query = query.eq('id', id).limit(1);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    // Filter by date if provided
    if (date) {
      // Filter by date range for the entire day
      const s = new Date(date);
      s.setHours(0, 0, 0, 0);

      const e = new Date(date);
      e.setHours(23, 59, 59, 999);

      query = query.gte('created_at', s.toISOString())
                   .lte('created_at', e.toISOString());
    }

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      query = query.gte('created_at', s.toISOString());
    }

    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query = query.lte('created_at', e.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance records',
        details: error.message
      });
    }

    // Transform data to match expected format
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

    if (id) {
      return res.json({
        success: true,
        data: transformedData[0] || null
      });
    }

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get daily attendance summary
app.get('/api/attendance/summary', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    let query = supabase
      .from('daily_attendance_summary')
      .select('*')
      .order('attendance_date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }

    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch summary',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Submit attendance
app.post('/api/attendance', async (req, res) => {
  try {
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

    console.log(`✅ ${type.toUpperCase()} - Employee: ${employeeName} (${employeeId}) at ${lat}, ${lon}`);

    // Transform response to match expected format
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

    res.status(201).json({
      success: true,
      message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} berhasil`,
      data: transformedData
    });

  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update attendance record
app.put('/api/attendance', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Attendance ID is required'
      });
    }

    const {
      type,
      timestamp,
      employeeId,
      employeeName,
      latitude,
      longitude,
      accuracy,
      address,
      deviceId
    } = req.body;

    const updateData = {};
    if (type) updateData.type = type;
    if (timestamp) {
      const parsed = new Date(timestamp);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timestamp format'
        });
      }
      updateData.created_at = parsed.toISOString();
    }
    if (employeeId) updateData.employee_id = employeeId;
    if (employeeName) updateData.employee_name = employeeName;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (accuracy !== undefined) updateData.accuracy = parseFloat(accuracy);
    if (address !== undefined) updateData.address = address;
    if (deviceId !== undefined) updateData.device_id = deviceId;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update fields were provided'
      });
    }

    const { data, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update attendance record',
        details: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
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

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: transformedData
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete attendance record or records by employee/date
app.delete('/api/attendance', async (req, res) => {
  try {
    const { id, employeeId, date } = req.query;

    if (id) {
      const { data, error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase delete error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete attendance record',
          details: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }

      return res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    }

    if (employeeId && date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('attendance')
        .delete()
        .eq('employee_id', employeeId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete attendance records',
          details: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Attendance records deleted successfully',
        deletedCount: data?.length || 0
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Attendance ID or employeeId + date is required for delete'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get statistics
app.get('/api/attendance/stats', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayData, error: todayError } = await supabase
      .from('attendance')
      .select('*')
      .gte('created_at', today.toISOString());

    if (todayError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }

    const checkins = todayData.filter(r => r.type === 'checkin').length;
    const checkouts = todayData.filter(r => r.type === 'checkout').length;

    // Get unique employees who checked in today
    const uniqueEmployees = [...new Set(todayData
      .filter(r => r.type === 'checkin')
      .map(r => r.employee_id)
    )];

    res.json({
      success: true,
      data: {
        today: {
          date: today.toISOString().split('T')[0],
          checkins: checkins,
          checkouts: checkouts,
          uniqueEmployees: uniqueEmployees.length
        },
        recent: {
          lastCheckin: todayData.find(r => r.type === 'checkin'),
          lastCheckout: todayData.find(r => r.type === 'checkout')
        }
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 Backend API + Web App is Running!');
  console.log('========================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database: Supabase`);
  console.log(`🌐 Web App: http://localhost:${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/attendance`);
  console.log(`   GET  /api/attendance/summary`);
  console.log(`   GET  /api/attendance/stats`);
  console.log(`   POST /api/attendance`);
  console.log('\n✨ Server ready dengan Supabase + Web App!');
  console.log('========================================\n');
});
