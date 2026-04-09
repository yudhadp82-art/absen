// Attendance Management
const Attendance = {
    currentFilters: {
        date: null,
        department: '',
        type: ''
    },
    async load() {
        const date = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('filterDate');
        if (dateInput && !dateInput.value) dateInput.value = date;
        await this.loadByDate(date);
    },
    async loadByDate(date) {
        try {
            App.showLoading('Memuat data...');
            const response = await API.getAttendance({ date, limit: 100 });
            App.hideLoading();
            if (response.success) {
                this.renderTable(this.applyClientSideFilters(response.data));
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    applyClientSideFilters(data) {
        const dept = (this.currentFilters.department || '').trim();
        const type = (this.currentFilters.type || '').trim();
        return (data || []).filter(r => {
            if (dept && (r.department || '') !== dept) return false;
            if (type && r.type !== type) return false;
            return true;
        });
    },
    renderTable(data) {
        const tbody = document.getElementById('attendanceTableBody');
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(r => {
            const icon = r.type === 'checkin' ? '☀️' : '🌙';
            return '<tr>' +
                '<td>' + API.formatTime(r.timestamp) + '</td>' +
                '<td><strong>' + r.employeeId + '</strong></td>' +
                '<td>' + r.employeeName + '</td>' +
                '<td><span class="status-badge ' + (r.type === 'checkin' ? 'status-checkin' : 'status-checkout') + '">' + icon + ' ' + (r.type === 'checkin' ? 'Check-In' : 'Check-Out') + '</span></td>' +
                '<td>' + (r.department || '-') + '</td>' +
                '</tr>';
        }).join('');
    },
    async applyFilters() {
        const dateInput = document.getElementById('filterDate');
        const deptInput = document.getElementById('filterDept');
        const typeInput = document.getElementById('filterType');

        const date = (dateInput?.value || new Date().toISOString().split('T')[0]).trim();
        this.currentFilters.date = date;
        this.currentFilters.department = deptInput?.value || '';
        this.currentFilters.type = typeInput?.value || '';

        await this.loadByDate(date);
    },
    async clearFilters() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('filterDate');
        const deptInput = document.getElementById('filterDept');
        const typeInput = document.getElementById('filterType');

        if (dateInput) dateInput.value = today;
        if (deptInput) deptInput.value = '';
        if (typeInput) typeInput.value = '';

        this.currentFilters = { date: today, department: '', type: '' };
        await this.loadByDate(today);
    },
    async exportToCSV() {
        const date = new Date().toISOString().split('T')[0];
        try {
            App.showLoading('Memuat data...');
            const response = await API.getAttendance({ date, limit: 1000 });
            App.hideLoading();
            if (response.success) {
                const exportData = response.data.map(r => ({
                    Waktu: API.formatDateTime(r.timestamp),
                    ID: r.employeeId,
                    Nama: r.employeeName,
                    Tipe: r.type === 'checkin' ? 'Check-In' : 'Check-Out',
                    Departemen: r.department || '-',
                    Latitude: r.location.latitude,
                    Longitude: r.location.longitude
                }));
                API.exportToCSV(exportData, 'absensi-' + date);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    }
};
