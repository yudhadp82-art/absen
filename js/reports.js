// ========================================
// Reports Management
// ========================================

const Reports = {
    currentReport: null,

    /**
     * Load daily report
     */
    async loadDailyReport(date = null) {
        try {
            App.showLoading('Memuat laporan...');

            const reportDate = date || new Date().toISOString().split('T')[0];

            const response = await API.request(`/report/daily?date=${reportDate}`, {
                method: 'GET'
            });

            App.hideLoading();

            if (response.success) {
                this.currentReport = response;
                this.displayReport(response);
                return response;
            }

            return null;

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Gagal memuat laporan', 'error');
            return null;
        }
    },

    /**
     * Display report
     */
    displayReport(report) {
        // Show content
        document.getElementById('reportContent').style.display = 'block';

        // Display statistics
        this.displayStatistics(report.statistics);

        // Display employee list
        this.displayEmployeeList(report.data);
    },

    /**
     * Display statistics
     */
    displayStatistics(stats) {
        const container = document.getElementById('reportStats');

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.total_employees}</div>
                    <div class="stat-label">Total Karyawan</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value stat-success">${stats.checked_in}</div>
                    <div class="stat-label">Sudah Check-In</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value stat-warning">${stats.checked_out}</div>
                    <div class="stat-label">Sudah Check-Out</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value stat-error">${stats.not_checked_in}</div>
                    <div class="stat-label">Belum Check-In</div>
                </div>
            </div>
        `;
    },

    /**
     * Display employee list in report
     */
    displayEmployeeList(employees) {
        const container = document.getElementById('reportEmployeeList');

        if (!employees || employees.length === 0) {
            container.innerHTML = '<p class="empty-state">Tidak ada data untuk tanggal ini</p>';
            return;
        }

        const html = employees.map(emp => {
            const checkinTime = emp.checkin_time ?
                API.formatTime(emp.checkin_time) : '-';
            const checkoutTime = emp.checkout_time ?
                API.formatTime(emp.checkout_time) : '-';
            const status = this.getAttendanceStatus(emp);

            return `
                <div class="report-employee-item">
                    <div class="employee-header">
                        <span class="employee-name">${emp.employee_name}</span>
                        <span class="employee-dept">${emp.department || '-'}</span>
                    </div>
                    <div class="employee-attendance">
                        <div class="attendance-item">
                            <span class="attendance-label">☀️ Check-In:</span>
                            <span class="attendance-time ${checkinTime !== '-' ? 'success' : ''}">
                                ${checkinTime}
                            </span>
                        </div>
                        <div class="attendance-item">
                            <span class="attendance-label">🌙 Check-Out:</span>
                            <span class="attendance-time ${checkoutTime !== '-' ? 'success' : ''}">
                                ${checkoutTime}
                            </span>
                        </div>
                    </div>
                    <div class="employee-status">
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    /**
     * Get attendance status
     */
    getAttendanceStatus(employee) {
        if (!employee.checkin_time && !employee.checkout_time) {
            return { text: 'Belum Absen', class: 'status-absent' };
        } else if (employee.checkin_time && !employee.checkout_time) {
            return { text: 'Sudah Check-In', class: 'status-present' };
        } else if (employee.checkin_time && employee.checkout_time) {
            return { text: 'Selesai', class: 'status-complete' };
        }
        return { text: '-', class: '' };
    },

    /**
     * Export report to CSV
     */
    exportToCSV(report) {
        if (!report || !report.data) return;

        const headers = [
            'Employee ID',
            'Name',
            'Department',
            'Position',
            'Check-In Time',
            'Check-Out Time',
            'Status'
        ];

        const rows = report.data.map(emp => {
            const checkinTime = emp.checkin_time ?
                new Date(emp.checkin_time).toLocaleString('id-ID') : '-';
            const checkoutTime = emp.checkout_time ?
                new Date(emp.checkout_time).toLocaleString('id-ID') : '-';
            const status = this.getAttendanceStatus(emp).text;

            return [
                emp.employee_id,
                emp.employee_name,
                emp.department || '-',
                emp.position || '-',
                checkinTime,
                checkoutTime,
                status
            ].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-absensi-${report.date}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        App.showToast('Laporan berhasil di-download', 'success');
    }
};
