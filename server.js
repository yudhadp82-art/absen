// Simple Express Server untuk Backend API
// Alternative jika Vercel dev tidak bisa digunakan

const express = require('express');
const cors = require('cors');
const {
  isContext7Configured,
  validateContext7Request,
  executeContext7Request
} = require('./lib/context7-service');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
const path = require('path');
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/', express.static(path.join(__dirname, 'web')));

// In-memory storage
let attendanceData = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Employee Attendance API',
    version: '1.0.0'
  });
});

app.post('/api/context7', async (req, res) => {
  if (!isContext7Configured()) {
    return res.status(503).json({
      success: false,
      error: 'Context7 belum dikonfigurasi di server'
    });
  }

  const input = validateContext7Request(req.body);
  if (input.error) {
    return res.status(400).json({
      success: false,
      error: input.error
    });
  }

  try {
    const result = await executeContext7Request(input);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil data dari Context7',
      message: error.message
    });
  }
});

// Get attendance history
app.get('/api/attendance', (req, res) => {
  const { employeeId, date, startDate, endDate } = req.query;

  let filteredData = attendanceData;

  if (employeeId) {
    filteredData = filteredData.filter(a => a.employeeId === employeeId);
  }

  if (date) {
    filteredData = filteredData.filter(a =>
      a.timestamp.startsWith(date)
    );
  }

  if (startDate) {
    filteredData = filteredData.filter(a =>
      a.timestamp.split('T')[0] >= startDate
    );
  }

  if (endDate) {
    filteredData = filteredData.filter(a =>
      a.timestamp.split('T')[0] <= endDate
    );
  }

  res.json({
    success: true,
    data: filteredData,
    count: filteredData.length
  });
});

// Submit attendance
app.post('/api/attendance', (req, res) => {
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

  // Create attendance record
  const attendance = {
    id: `ATT${Date.now()}`,
    employeeId,
    employeeName: employeeName || 'Unknown',
    type,
    location: {
      latitude: lat,
      longitude: lon,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      address: address || null
    },
    timestamp: new Date().toISOString(),
    deviceId: deviceId || null
  };

  attendanceData.push(attendance);

  console.log(`✅ ${type.toUpperCase()} - Employee: ${employeeName} (${employeeId}) at ${lat}, ${lon}`);

  res.status(201).json({
    success: true,
    message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} berhasil`,
    data: attendance
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 Backend API Server is Running!');
  console.log('========================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/attendance`);
  console.log(`   POST /api/context7`);
  console.log(`   POST /api/attendance`);
  console.log('\n✨ Server ready untuk menerima requests!');
  console.log('========================================\n');
});
