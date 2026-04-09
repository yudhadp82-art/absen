// Vercel Serverless Function for Employees API
// Handles employee management

const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    // GET /api/employees - Get all employees
    if (method === 'GET') {
      const { department, isActive = true } = query;

      let queryBuilder = supabase
        .from('employees')
        .select('*')
        .order('employee_name', { ascending: true });

      if (department) {
        queryBuilder = queryBuilder.eq('department', department);
      }

      // Handle boolean conversion correctly
      const activeFilter = isActive === 'false' ? false : true;
      queryBuilder = queryBuilder.eq('is_active', activeFilter);

      const { data, error } = await queryBuilder;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch employees',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }

    // POST /api/employees - Add new employee
    if (method === 'POST') {
      const {
        employeeId,
        employeeName,
        email,
        department,
        position,
        phone,
        isActive
      } = req.body;

      // Validation
      if (!employeeId || !employeeName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, employeeName'
        });
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            employee_id: employeeId,
            employee_name: employeeName,
            email: email || null,
            department: department || null,
            position: position || null,
            phone: phone || null,
            is_active: isActive !== undefined ? isActive : true
          }
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to add employee',
          details: error.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: data
      });
    }

    // PUT /api/employees/:id - Update employee
    if (method === 'PUT') {
      const employeeId = query.id;
      const {
        employeeId: newEmployeeId,
        employeeName,
        email,
        department,
        position,
        phone,
        isActive
      } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID is required'
        });
      }

      if (!employeeName) {
        return res.status(400).json({
          success: false,
          error: 'Employee name is required'
        });
      }

      const updateData = {
        employee_name: employeeName,
        email: email || null,
        department: department || null,
        position: position || null,
        phone: phone || null,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update employee',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: data
      });
    }

    // DELETE /api/employees/:id - Delete employee
    if (method === 'DELETE') {
      const employeeId = query.id;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID is required'
        });
      }

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employeeId);

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete employee',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Employee deleted successfully'
      });
    }

    // Method not supported
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      error: `Method ${method} Not Allowed`
    });

  } catch (error) {
    console.error('Employees API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
