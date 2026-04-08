# API Documentation - Sistem Absensi Karyawan

## Base URL
```
Production: https://absen-brown.vercel.app/api
Development: http://localhost:3000/api
```

## Database
- **Provider**: Supabase (PostgreSQL)
- **Tables**: `attendance`, `employees`
- **Authentication**: Supabase Anon Key (via environment variables)

---

## Endpoints

### 1. Health Check

Cek status API.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T12:00:00.000Z",
  "service": "Employee Attendance API",
  "version": "1.0.0"
}
```

---

### 2. Submit Attendance (Check-in/Check-out)

Submit data absensi karyawan dengan lokasi GPS.

**Endpoint:** `POST /attendance`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "type": "checkin",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 15.5,
  "address": "Jakarta, Indonesia",
  "deviceId": "android_device_id"
}
```

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| employeeId | string | Yes | ID unik karyawan |
| employeeName | string | Yes | Nama lengkap karyawan |
| type | string | Yes | "checkin" atau "checkout" |
| latitude | number | Yes | Koordinat latitude (-90 to 90) |
| longitude | number | Yes | Koordinat longitude (-180 to 180) |
| accuracy | number | No | Akurasi GPS dalam meter |
| address | string | No | Alamat dari geocoding (opsional) |
| deviceId | string | No | ID unik device Android |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Check-in berhasil",
  "data": {
    "id": "ATT1715148800000",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "type": "checkin",
    "location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "accuracy": 15.5,
      "address": "Jakarta, Indonesia"
    },
    "timestamp": "2026-04-07T12:00:00.000Z",
    "deviceId": "android_device_id"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields: employeeId, type, latitude, longitude"
}
```

---

### 3. Get Attendance History

Ambil riwayat absensi karyawan.

**Endpoint:** `GET /attendance`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | string | No | Filter berdasarkan ID karyawan |
| date | string | No | Filter berdasarkan tanggal (YYYY-MM-DD) |

**Examples:**
```
GET /attendance?employeeId=EMP001
GET /attendance?date=2026-04-07
GET /attendance?employeeId=EMP001&date=2026-04-07
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ATT1715148800000",
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "type": "checkin",
      "location": {
        "latitude": -6.2088,
        "longitude": 106.8456,
        "accuracy": 15.5,
        "address": "Jakarta, Indonesia"
      },
      "timestamp": "2026-04-07T08:00:00.000Z",
      "deviceId": "android_device_id"
    }
  ],
  "count": 1
}
```

---

### 4. Get All Employees

Ambil daftar semua karyawan.

**Endpoint:** `GET /employees`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| department | string | No | Filter berdasarkan departemen |
| isActive | boolean | No | Filter status aktif (default: true) |

**Examples:**
```
GET /employees
GET /employees?department=IT
GET /employees?isActive=false
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "employee_id": "EMP001",
      "employee_name": "Ahmad Dahlan",
      "email": "ahmad@example.com",
      "department": "IT",
      "position": "Software Engineer",
      "phone": "+62812345678",
      "is_active": true,
      "created_at": "2026-04-07T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Add Employee

Tambah karyawan baru.

**Endpoint:** `POST /employees`

**Request Body:**
```json
{
  "employeeId": "EMP011",
  "employeeName": "New Employee",
  "email": "new@example.com",
  "department": "IT",
  "position": "Developer",
  "phone": "+62812345678",
  "isActive": true
}
```

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| employeeId | string | Yes | ID unik karyawan |
| employeeName | string | Yes | Nama lengkap karyawan |
| email | string | No | Email karyawan |
| department | string | No | Departemen |
| position | string | No | Posisi/Jabatan |
| phone | string | No | Nomor telepon |
| isActive | boolean | No | Status aktif (default: true) |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Employee added successfully",
  "data": {
    "id": "uuid-here",
    "employee_id": "EMP011",
    "employee_name": "New Employee",
    "email": "new@example.com",
    "department": "IT",
    "position": "Developer",
    "phone": "+62812345678",
    "is_active": true,
    "created_at": "2026-04-07T00:00:00.000Z"
  }
}
```

---

### 6. Update Employee

Update data karyawan yang sudah ada.

**Endpoint:** `PUT /employees/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | ID karyawan (employee_id) |

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "employeeName": "Ahmad Dahlan Updated",
  "email": "ahmad.updated@example.com",
  "department": "IT",
  "position": "Senior Software Engineer",
  "phone": "+62812345678",
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "uuid-here",
    "employee_id": "EMP001",
    "employee_name": "Ahmad Dahlan Updated",
    "email": "ahmad.updated@example.com",
    "department": "IT",
    "position": "Senior Software Engineer",
    "phone": "+62812345678",
    "is_active": true,
    "updated_at": "2026-04-07T12:00:00.000Z"
  }
}
```

---

### 7. Delete Employee

Hapus karyawan.

**Endpoint:** `DELETE /employees/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | ID karyawan (employee_id) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

---

### 8. Get Daily Report

Ambil laporan absensi harian.

**Endpoint:** `GET /report/daily`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | No | Tanggal (YYYY-MM-DD, default: hari ini) |
| employeeId | string | No | Filter berdasarkan ID karyawan |

**Examples:**
```
GET /report/daily
GET /report/daily?date=2026-04-07
GET /report/daily?employeeId=EMP001&date=2026-04-07
```

**Success Response (200):**
```json
{
  "success": true,
  "date": "2026-04-07",
  "statistics": {
    "total": 10,
    "checkedIn": 8,
    "checkedOut": 5,
    "notCheckedIn": 2
  },
  "employees": [
    {
      "employee_id": "EMP001",
      "employee_name": "Ahmad Dahlan",
      "department": "IT",
      "checkin_time": "08:00:00",
      "checkout_time": "17:00:00",
      "status": "complete"
    }
  ]
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing/invalid credentials |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database error |

---

## Testing dengan cURL

### Test Health Check
```bash
curl https://absen-brown.vercel.app/api/health
```

### Test Check-in
```bash
curl -X POST https://absen-brown.vercel.app/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "type": "checkin",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 15.5
  }'
```

### Test Get Employees
```bash
curl https://absen-brown.vercel.app/api/employees
```

### Test Add Employee
```bash
curl -X POST https://absen-brown.vercel.app/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP011",
    "employeeName": "New Employee",
    "email": "new@example.com",
    "department": "IT",
    "position": "Developer"
  }'
```

### Test Daily Report
```bash
curl "https://absen-brown.vercel.app/api/report/daily?date=2026-04-07"
```

---

## Notes

1. **CORS**: API mengizinkan requests dari semua origins (`Access-Control-Allow-Origin: *`)

2. **Authentication**: Menggunakan Supabase Anon Key untuk database access. Untuk production, tambahkan proper authentication (JWT, API Key).

3. **Environment Variables**:
   - `SUPABASE_URL`: URL database Supabase
   - `SUPABASE_ANON_KEY`: Anonymous key untuk Supabase access

4. **Rate Limiting**: Saat ini tidak ada rate limiting. Tambahkan jika diperlukan untuk production.

5. **Geofencing**: Untuk memvalidasi apakah karyawan berada dalam radius kantor, tambahkan logika geofencing di server-side.

6. **Data Persistence**: Semua data disimpan di Supabase PostgreSQL database.

---

## Applications

### 1. Employee Attendance App (PWA)
**URL:** https://absen-brown.vercel.app
- For employees to check-in/check-out
- GPS location tracking
- View attendance history

### 2. Admin Dashboard
**URL:** https://admin-dun-alpha.vercel.app
- Employee management (CRUD)
- Attendance reports
- Daily analytics
- CSV export

---

## Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department VARCHAR(255),
  position VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('checkin', 'checkout')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy FLOAT,
  address TEXT,
  device_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Support

For issues or questions, contact the development team.
