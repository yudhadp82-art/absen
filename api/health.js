// Health check endpoint - Vercel Function with Web Standard API
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Employee Attendance API',
    version: '1.0.0'
  });
}
