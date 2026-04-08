// API Communication
const API = {
    async request(endpoint, options = {}) {
        const url = CONFIG.API_BASE_URL + endpoint;
        console.log('🌐 API Request:', url);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('📡 API Response status:', response.status);

            const data = await response.json();
            console.log('📦 API Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'API Error');
            }

            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            throw error;
        }
    },
    async getEmployees() {
        return this.request('/employees?' + new Date().getTime());
    },
    async getAttendance(filters = {}) {
        let endpoint = '/attendance?' + new Date().getTime();
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.limit) params.append('limit', filters.limit);
        if (params.toString()) endpoint += '&' + params.toString();
        return this.request(endpoint);
    },
    async getDailyReport(date) {
        return this.request('/report/daily?date=' + date + '&_=' + new Date().getTime());
    },
    formatTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
    exportToCSV(data, filename) {
        if (!data.length) return;
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => String(row[h] || '').replace(/"/g, '""')).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename + '.csv';
        a.click();
    }
};
