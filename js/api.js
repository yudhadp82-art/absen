// ========================================
// API Communication
// ========================================

const API = {
    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON Response:', text);
                throw new Error(`Server returned non-JSON response (${response.status})`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `API request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            if (error instanceof SyntaxError) {
                throw new Error('API returned invalid JSON format');
            }
            throw error;
        }
    },

    /**
     * Health check
     */
    async healthCheck() {
        return this.request('/health');
    },

    /**
     * Submit attendance (check-in/check-out)
     */
    async submitAttendance(employeeId, employeeName, type, location, timestamp = null) {
        return this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify({
                employeeId: employeeId,
                employeeName: employeeName,
                type: type,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                deviceId: this.getDeviceId(),
                timestamp: timestamp
            })
        });
    },

    /**
     * Get attendance history
     */
    async getAttendanceHistory(employeeId, date = null) {
        let endpoint = '/attendance';

        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId);
        if (date) params.append('date', date);

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        return this.request(endpoint);
    },

    /**
     * Get daily summary
     */
    async getDailySummary(employeeId = null) {
        let endpoint = '/attendance/summary';

        if (employeeId) {
            endpoint += `?employeeId=${employeeId}`;
        }

        return this.request(endpoint);
    },

    /**
     * Get statistics
     */
    async getStatistics() {
        return this.request('/attendance/stats');
    },

    /**
     * Get device ID (fingerprint)
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');

        if (!deviceId) {
            // Generate simple device ID
            deviceId = 'WEB_' + Math.random().toString(36).substring(2, 15) +
                       '_' + Date.now();
            localStorage.setItem('device_id', deviceId);
        }

        return deviceId;
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    /**
     * Format time for display
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};
