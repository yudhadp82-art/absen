// Vercel Serverless Function for Payroll Management
// Fitur Pembayaran Karyawan dengan Perhitungan Gaji

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
    // GET /api/payroll/periods - Get all payroll periods
    if (method === 'GET' && req.url === '/api/payroll/periods') {
      const { status } = query;

      let queryBuilder = supabase
        .from('payroll_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payroll periods',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }

    // GET /api/payroll/periods/:id - Get specific payroll period
    if (method === 'GET' && req.url.match(/\/api\/payroll\/periods\/[^/]+/)) {
      const periodId = req.url.split('/').pop();

      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', periodId)
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payroll period',
          details: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Payroll period not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: data
      });
    }

    // POST /api/payroll/periods - Create new payroll period
    if (method === 'POST' && req.url === '/api/payroll/periods') {
      const {
        period_name,
        start_date,
        end_date,
        hourly_rate
      } = req.body;

      // Validation
      if (!period_name || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Period name, start date, and end date are required'
        });
      }

      const { data, error } = await supabase
        .from('payroll_periods')
        .insert([{
          period_name,
          start_date,
          end_date,
          status: 'draft',
          hourly_rate: hourly_rate || 6000.00
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create payroll period',
          details: error.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Payroll period created successfully',
        data: data
      });
    }

    // PUT /api/payroll/periods/:id - Update payroll period
    if (method === 'PUT' && req.url.match(/\/api\/payroll\/periods\/[^/]+/)) {
      const periodId = req.url.split('/').pop();
      const {
        period_name,
        start_date,
        end_date,
        status,
        hourly_rate
      } = req.body;

      if (!period_name || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Period name, start date, and end date are required'
        });
      }

      const { data, error } = await supabase
        .from('payroll_periods')
        .update({
          period_name,
          start_date,
          end_date,
          status,
          hourly_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', periodId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update payroll period',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payroll period updated successfully',
        data: data
      });
    }

    // GET /api/payroll/details - Get payroll details
    if (method === 'GET' && req.url === '/api/payroll/details') {
      const { period_id, employee_id } = query;

      let queryBuilder = supabase
        .from('payroll_details')
        .select(`
          *,
          employees.employee_name,
          employees.employee_id,
          employees.email
        `)
        .order('employees.employee_name', { ascending: true });

      if (period_id) {
        queryBuilder = queryBuilder.eq('payroll_period_id', period_id);
      }

      if (employee_id) {
        queryBuilder = queryBuilder.eq('employee_id', employee_id);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payroll details',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }

    // POST /api/payroll/calculate - Calculate payroll for period
    if (method === 'POST' && req.url === '/api/payroll/calculate') {
      const { period_id } = req.body;

      if (!period_id) {
        return res.status(400).json({
          success: false,
          error: 'Period ID is required'
        });
      }

      // Check if period exists
      const { data: period, error: periodError } = await supabase
        .from('payroll_periods')
        .select('id, status')
        .eq('id', period_id)
        .single();

      if (periodError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payroll period',
          details: periodError.message
        });
      }

      if (!period || period.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Payroll period not found or already calculated'
        });
      }

      // Get all active employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, employee_id, employee_name')
        .eq('is_active', true);

      // Calculate payroll for each employee
      const calculations = [];
      for (const emp of employees) {
        const { data: workData } = await supabase.rpc('calculate_employee_payroll', {
          p_payroll_period_id: period_id,
          p_employee_id: emp.id
        });

        if (workData) {
          calculations.push(workData);
        }
      }

      if (calculations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No work hours found for any employee'
        });
      }

      // Update period status
      const { error: updateError } = await supabase
        .from('payroll_periods')
        .update({ status: 'calculated', updated_at: new Date().toISOString() })
        .eq('id', period_id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update payroll period status',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payroll calculated successfully',
        data: calculations
      });
    }

    // POST /api/payroll/payments - Record payment
    if (method === 'POST' && req.url === '/api/payroll/payments') {
      const {
        payroll_detail_id,
        payment_method,
        payment_reference,
        amount_paid,
        payment_date,
        receipt_url,
        approved_by
      } = req.body;

      // Validation
      if (!payroll_detail_id || !amount_paid) {
        return res.status(400).json({
          success: false,
          error: 'Payroll detail ID and amount paid are required'
        });
      }

      const { data, error } = await supabase
        .from('payroll_payments')
        .insert([{
          payroll_detail_id,
          payment_method: payment_method || 'cash',
          payment_reference: payment_reference || '',
          amount_paid,
          payment_date: payment_date || new Date().toISOString().split('T')[0],
          receipt_url,
          approved_by
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to record payment',
          details: error.message
        });
      }

      // Update payroll detail status to paid
      const { error: updateError } = await supabase
        .from('payroll_details')
        .update({
          payment_status: 'paid',
          payment_date: payment_date
        })
        .eq('id', payroll_detail_id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update payroll detail status',
          details: updateError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: data
      });
    }

    // GET /api/payroll/summary - Get payroll summary
    if (method === 'GET' && req.url === '/api/payroll/summary') {
      const { period_id } = query;

      if (!period_id) {
        return res.status(400).json({
          success: false,
          error: 'Period ID is required'
        });
      }

      const { data, error } = await supabase
        .from('payroll_summary')
        .select('*')
        .eq('payroll_period_id', period_id);

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payroll summary',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data
      });
    }

    // Method not supported
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({
      success: false,
      error: `Method ${method} Not Allowed`
    });

  } catch (error) {
    console.error('Payroll API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}