// Simple Express Server untuk Backend API
// Alternative jika Vercel dev tidak bisa digunakan

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Get attendance history
app.get('/api/attendance', (req, res) => {
  const { employeeId, date } = req.query;

  let filteredData = attendanceData;

  if (employeeId) {
    filteredData = filteredData.filter(a => a.employeeId === employeeId);
  }

  if (date) {
    filteredData = filteredData.filter(a =>
      a.timestamp.startsWith(date)
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
  console.log(`   POST /api/attendance`);
  console.log('\n✨ Server ready untuk menerima requests!');
  console.log('========================================\n');
});
