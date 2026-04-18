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
        address,
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

      let { data, error } = await supabase
        .from('employees')
        .insert([
          {
            employee_id: employeeId,
            employee_name: employeeName,
            email: email || null,
            department: department || null,
            address: address || null,
            position: position || null,
            phone: phone || null,
            is_active: isActive !== undefined ? isActive : true
          }
        ])
        .select()
        .single();

      // Robust check for missing column 'address'
      if (error && error.message.includes('column') && error.message.includes('address')) {
        console.warn('Column "address" not found, retrying without it...');
        const retryResult = await supabase
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
        data = retryResult.data;
        error = retryResult.error;
      }

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
        address,
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
        address: address || null,
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

      console.log(`Attempting to delete employee: ${employeeId}`);

      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id, employee_id')
        .eq('employee_id', employeeId)
        .single();

      if (checkError) {
        console.error('Error checking employee existence:', checkError);
        return res.status(404).json({
          success: false,
          error: 'Employee not found',
          details: checkError.message
        });
      }

      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found'
        });
      }

      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employeeId);

      if (deleteError) {
        console.error('Delete operation failed:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete employee',
          details: deleteError.message,
          hint: 'Check if RLS DELETE policy exists for employees table'
        });
      }

      console.log(`Successfully deleted employee: ${employeeId}`);

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
