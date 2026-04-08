// Backend API untuk Sistem Absensi Karyawan
// Dapat di-deploy ke Vercel sebagai Serverless Function
// Menggunakan Web Standard API (Request/Response)

import { corsHeaders } from '../../lib/cors.js';

// Simulasi database dengan in-memory storage
// Dalam production, gunakan database nyata (PostgreSQL, MongoDB, dll)
if (!global.attendanceData) {
  global.attendanceData = [];
}

// GET /api/attendance - Ambil semua data absensi
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  try {
    let filteredData = global.attendanceData;

    if (employeeId) {
      filteredData = filteredData.filter(a => a.employeeId === employeeId);
    }

    if (date) {
      filteredData = filteredData.filter(a =>
        a.timestamp.startsWith(date)
      );
    }

    return Response.json({
      success: true,
      data: filteredData,
      count: filteredData.length
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Attendance GET Error:', error);
    return Response.json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST /api/attendance - Check-in / Check-out
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      employeeName,
      type, // 'checkin' or 'checkout'
      latitude,
      longitude,
      accuracy,
      address,
      deviceId
    } = body;

    // Validasi input
    if (!employeeId || !type || !latitude || !longitude) {
      return Response.json({
        success: false,
        error: 'Missing required fields: employeeId, type, latitude, longitude'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    if (type !== 'checkin' && type !== 'checkout') {
      return Response.json({
        success: false,
        error: 'Type must be either "checkin" or "checkout"'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validasi koordinat
    if (isNaN(latitude) || isNaN(longitude)) {
      return Response.json({
        success: false,
        error: 'Invalid coordinates'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validasi range koordinat
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return Response.json({
        success: false,
        error: 'Coordinates out of valid range'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Buat record absensi baru
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

    global.attendanceData.push(attendance);

    console.log(`✅ ${type.toUpperCase()} - Employee: ${employeeName} (${employeeId}) at ${lat}, ${lon}`);

    return Response.json({
      success: true,
      message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} berhasil`,
      data: attendance
    }, {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Attendance POST Error:', error);
    return Response.json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// OPTIONS untuk CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
