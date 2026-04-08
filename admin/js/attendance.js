// Attendance Management
const Attendance = {
    async load() {
        const date = new Date().toISOString().split('T')[0];
        await this.loadByDate(date);
    },
    async loadByDate(date) {
        try {
            App.showLoading('Memuat data...');
            const response = await API.getAttendance({ date, limit: 100 });
            App.hideLoading();
            if (response.success) {
                this.renderTable(response.data);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
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
                '<td><small>' + r.location.latitude.toFixed(6) + ', ' + r.location.longitude.toFixed(6) + '</small></td>' +
                '<td>' + (r.location.accuracy ? '~' + Math.round(r.location.accuracy) + 'm' : '-') + '</td>' +
                '</tr>';
        }).join('');
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
