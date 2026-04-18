// Backend API untuk Sistem Absensi Karyawan
// Dapat di-deploy ke Vercel sebagai Serverless Function
// Menggunakan Web Standard API (Request/Response)

import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../lib/cors.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseWrite = (supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey)
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

function checkSupabaseWrite() {
  if (!supabaseWrite) {
    return Response.json({
      success: false,
      error: 'Supabase write credentials not configured'
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
  const id = searchParams.get('id');
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
      .order('created_at', { ascending: false });

    if (id) {
      queryBuilder = queryBuilder.eq('id', id).limit(1);
    } else {
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);
    }

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

    const transformedData = (data || []).map(record => ({
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

    if (id) {
      return Response.json({
        success: true,
        data: transformedData[0] || null
      }, {
        headers: corsHeaders
      });
    }

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
  const supabaseError = checkSupabaseWrite();
  if (supabaseError) return supabaseError;

  try {
    const body = await request.json();
    const {
      employeeId,
      employeeName,
      type, // 'checkin', 'checkout', or 'overtime'
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

    if (!['checkin', 'checkout', 'overtime'].includes(type)) {
      return Response.json({
        success: false,
        error: 'Type must be one of "checkin", "checkout", or "overtime"'
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
    const { data, error } = await supabaseWrite
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
      message: `${type === 'checkin' ? 'Check-in' : type === 'checkout' ? 'Check-out' : 'Lembur'} berhasil`,
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

// PUT /api/attendance?id=... - Update attendance record
export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const supabaseError = checkSupabaseWrite();
  if (supabaseError) return supabaseError;

  if (!id) {
    return Response.json({
      success: false,
      error: 'Attendance ID is required'
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const {
      type,
      timestamp,
      employeeId,
      employeeName,
      latitude,
      longitude,
      address
    } = body;

    const updateData = {};
    if (type) updateData.type = type;
    if (timestamp) updateData.created_at = timestamp;
    if (employeeId) updateData.employee_id = employeeId;
    if (employeeName) updateData.employee_name = employeeName;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (address !== undefined) updateData.address = address;

    const { data, error } = await supabaseWrite
      .from('attendance')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { data: existingRecord, error: existingError } = await supabase
        .from('attendance')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (existingError) throw existingError;

      return Response.json({
        success: false,
        error: existingRecord
          ? 'Attendance update blocked by Supabase RLS policy'
          : 'Attendance record not found',
        hint: existingRecord
          ? 'Add an UPDATE policy on attendance or configure SUPABASE_SERVICE_ROLE_KEY in Vercel'
          : undefined
      }, {
        status: existingRecord ? 403 : 404,
        headers: corsHeaders
      });
    }

    return Response.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: data
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Attendance PUT Error:', error);
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

// DELETE /api/attendance?id=... - Delete attendance record
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  const supabaseError = checkSupabaseWrite();
  if (supabaseError) return supabaseError;

  if (!id && !(employeeId && date)) {
    return Response.json({
      success: false,
      error: 'Attendance ID or employeeId + date is required'
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    if (employeeId && date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const { count, error } = await supabaseWrite
        .from('attendance')
        .delete({ count: 'exact' })
        .eq('employee_id', employeeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      return Response.json({
        success: true,
        message: 'Attendance records deleted successfully',
        deletedCount: count || 0
      }, {
        headers: corsHeaders
      });
    }

    const { error } = await supabaseWrite
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Attendance record deleted successfully'
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Attendance DELETE Error:', error);
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
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  });
}
