// Backend API untuk Sistem Absensi Karyawan
// Dapat di-deploy ke Vercel sebagai Serverless Function
// Menggunakan Web Standard API (Request/Response)

import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../lib/cors.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper to check Supabase configuration
function checkSupabase() {
  if (!supabase) {
    return Response.json({
      success: false,
      error: 'Supabase credentials not configured'
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
  return null;
}

// GET /api/attendance - Ambil data absensi
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabaseError = checkSupabase();
  if (supabaseError) return supabaseError;

  try {
    let queryBuilder = supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (employeeId) {
      queryBuilder = queryBuilder.eq('employee_id', employeeId);
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      queryBuilder = queryBuilder.gte('created_at', startDate.toISOString())
                           .lte('created_at', endDate.toISOString());
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    // Enrich with employee department (optional)
    const employeeIds = [...new Set((data || []).map(r => r.employee_id).filter(Boolean))];
    let deptByEmployeeId = {};
    if (employeeIds.length) {
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('employee_id, department')
        .in('employee_id', employeeIds);

      if (!empErr && empData) {
        deptByEmployeeId = empData.reduce((acc, e) => {
          acc[e.employee_id] = e.department || null;
          return acc;
        }, {});
      }
    }

    const transformedData = data.map(record => ({
      id: record.id,
      employeeId: record.employee_id,
      employeeName: record.employee_name,
      department: deptByEmployeeId[record.employee_id] || null,
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

    return Response.json({
      success: true,
      data: transformedData,
      count: transformedData.length
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
  const supabaseError = checkSupabase();
  if (supabaseError) return supabaseError;

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
      deviceId,
      timestamp
    } = body;

    // Validasi input
    if (!employeeId || !type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: employeeId, type'
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

    // Validasi koordinat (sekarang opsional, default 0)
    const lat = latitude ? parseFloat(latitude) : 0;
    const lon = longitude ? parseFloat(longitude) : 0;

    if (isNaN(lat) || isNaN(lon)) {
      return Response.json({
        success: false,
        error: 'Invalid coordinates format'
      }, {
        status: 400,
        headers: corsHeaders
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
          device_id: deviceId || null,
          created_at: timestamp || new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
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

    console.log(`✅ ${type.toUpperCase()} - Employee: ${employeeName} (${employeeId})`);

    return Response.json({
      success: true,
      message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} berhasil`,
      data: transformedData
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

