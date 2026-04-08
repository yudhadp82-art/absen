// ========================================
// Configuration
// ========================================

const CONFIG = {
    // API Base URL
    // Use relative path untuk production, atau absolute URL untuk local development
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api',

    // Location Settings
    LOCATION: {
        enableHighAccuracy: true,
        timeout: 10000,        // 10 seconds
        maximumAge: 0,         // Don't use cached position
        maxAccuracy: 100       // Maximum accuracy in meters
    },

    // Storage Keys
    STORAGE_KEYS: {
        EMPLOYEE_ID: 'attendance_employee_id',
        EMPLOYEE_NAME: 'attendance_employee_name',
        LAST_LOCATION: 'attendance_last_location',
        TODAY_HISTORY: 'attendance_today_history'
    },

    // App Settings
    APP: {
        NAME: 'Absensi Karyawan',
        VERSION: '2.0.0',
        MIN_LOCATION_ACCURACY: 50  // Minimum accuracy in meters
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
