// Reports
const Reports = {
    async showDailyReport() {
        const date = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = date;
        await this.generateDailyReport();
    },
    async generateDailyReport() {
        const date = document.getElementById('reportDate').value;
        if (!date) return App.showToast('Pilih tanggal', 'warning');
        try {
            App.showLoading('Memuat laporan...');
            const response = await API.getDailyReport(date);
            App.hideLoading();
            if (response.success) {
                this.currentReport = response;
                this.displayDailyReport(response);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    displayDailyReport(report) {
        const container = document.getElementById('dailyReportContent');
        if (!report.data || !report.data.length) {
            container.innerHTML = '<p class="empty-state">Tidak ada data</p>';
            return;
        }
        container.innerHTML = '<div class="table-container"><table class="data-table"><thead><tr><th>Karyawan</th><th>Departemen</th><th>Check-In</th><th>Check-Out</th><th>Status</th></tr></thead><tbody>' +
            report.data.map(emp => {
                const checkin = emp.checkin_time ? API.formatTime(emp.checkin_time) : '-';
                const checkout = emp.checkout_time ? API.formatTime(emp.checkout_time) : '-';
                let status, statusClass;
                if (!emp.checkin_time && !emp.checkout_time) {
                    status = 'Belum Absen'; statusClass = 'status-inactive';
                } else if (emp.checkin_time && !emp.checkout_time) {
                    status = 'Sudah Check-In'; statusClass = 'status-checkin';
                } else {
                    status = 'Selesai'; statusClass = 'status-active';
                }
                return '<tr><td><strong>' + emp.employee_name + '</strong></td><td>' + (emp.department || '-') + '</td><td>' + checkin + '</td><td>' + checkout + '</td><td><span class="status-badge ' + statusClass + '">' + status + '</span></td></tr>';
            }).join('') + '</tbody></table></div>';
    },
    exportReport() {
        if (!this.currentReport?.data) return App.showToast('Tidak ada data', 'warning');
        const date = document.getElementById('reportDate').value;
        const data = this.currentReport.data.map(emp => ({
            ID: emp.employee_id,
            Nama: emp.employee_name,
            Departemen: emp.department || '-',
            Check_In: emp.checkin_time ? API.formatTime(emp.checkin_time) : '-',
            Check_Out: emp.checkout_time ? API.formatTime(emp.checkout_time) : '-',
            Status: !emp.checkin_time && !emp.checkout_time ? 'Belum Absen' : emp.checkin_time && !emp.checkout_time ? 'Sudah Check-In' : 'Selesai'
        }));
        API.exportToCSV(data, 'laporan-' + date);
    }
};
