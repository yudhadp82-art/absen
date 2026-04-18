// API Communication
const API = {
    async request(endpoint, options = {}) {
        const url = CONFIG.API_BASE_URL + endpoint;
        console.log('🌐 API Request:', url);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 API Response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Non-JSON Response:', text);
                throw new Error(`Server returned non-JSON response (${response.status})`);
            }

            const data = await response.json();
            console.log('📦 API Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || `API Error (${response.status})`);
            }

            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            if (error instanceof SyntaxError) {
                console.error('❌ JSON Syntax Error - Response was not valid JSON');
            }
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
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        if (filters.limit) params.append('limit', filters.limit);
        if (params.toString()) endpoint += '&' + params.toString();
        return this.request(endpoint);
    },
    async getDailyReport(date) {
        return this.request('/report/daily?date=' + date + '&_=' + new Date().getTime());
    },
    async getRangeReport(startDate, endDate, employeeId = '') {
        let url = `/report/daily?mode=range&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&_=${new Date().getTime()}`;
        if (employeeId) url += `&employeeId=${encodeURIComponent(employeeId)}`;
        return this.request(url);
    },
    formatTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
    },
    exportToXLSX(data, filename, sheetName = 'Data') {
        if (!data.length) return;
        if (typeof XLSX === 'undefined') {
            throw new Error('Library export XLSX belum termuat');
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, filename + '.xlsx');
    }
};
