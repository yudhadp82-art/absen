// Dashboard Logic
const Dashboard = {
    async load() {
        this.initializeDateFilters();
        await this.loadStats();
        await this.loadRecentActivity();
        await this.loadDepartmentStats();
        await this.loadRangeRecap();
    },
    initializeDateFilters() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

        const startInput = document.getElementById('dashboardStartDate');
        const endInput = document.getElementById('dashboardEndDate');

        if (startInput && !startInput.value) {
            startInput.value = monthStart;
        }

        if (endInput && !endInput.value) {
            endInput.value = todayString;
        }
    },
    async loadStats() {
        try {
            console.log('Loading dashboard stats...');
            const response = await API.request('/attendance/stats?' + new Date().getTime());
            console.log('Stats response:', response);

            if (response.success && response.data.today) {
                const stats = response.data.today;

                document.getElementById('totalEmployees').textContent = stats.totalEmployees || 0;
                document.getElementById('presentToday').textContent = stats.checkins || 0;
                document.getElementById('absentToday').textContent = stats.absent || 0;
                document.getElementById('lateToday').textContent = stats.late || 0;
            } else {
                console.error('Invalid response format:', response);
            }
        } catch (error) {
            console.error('Stats error:', error);
            App.showToast('Gagal memuat statistik: ' + error.message, 'error');
            document.getElementById('totalEmployees').textContent = '0';
            document.getElementById('presentToday').textContent = '0';
            document.getElementById('absentToday').textContent = '0';
            document.getElementById('lateToday').textContent = '0';
        }
    },
    async loadRecentActivity() {
        try {
            const response = await API.request('/attendance/stats');
            if (response.success && response.data.recentActivities) {
                const activities = response.data.recentActivities;
                const container = document.getElementById('recentActivity');

                if (!activities.length) {
                    container.innerHTML = '<p class="empty-state">Belum ada aktivitas</p>';
                    return;
                }

                container.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">
                            ${activity.type === 'checkin' ? 'Masuk' : activity.type === 'checkout' ? 'Keluar' : 'Lembur'}
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${this.escapeHtml(activity.employeeName)}</strong> -
                                ${activity.type === 'checkin' ? 'Check-In' : activity.type === 'checkout' ? 'Check-Out' : 'Lembur'}
                            </div>
                            <div class="activity-time">
                                ${API.formatTime(activity.timestamp)}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Activity error:', error);
            document.getElementById('recentActivity').innerHTML =
                '<p class="empty-state">Gagal memuat aktivitas</p>';
        }
    },
    async loadDepartmentStats() {
        try {
            const response = await API.request('/attendance/stats');
            if (response.success && response.data.departmentStats) {
                const stats = response.data.departmentStats;
                const container = document.getElementById('departmentStats');

                const departments = Object.keys(stats);
                if (!departments.length) {
                    container.innerHTML = '<p class="empty-state">Belum ada data departemen</p>';
                    return;
                }

                container.innerHTML = departments.map(dept => `
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: var(--light-bg); margin-bottom: 8px; border-radius: 6px;">
                        <strong>${this.escapeHtml(dept)}</strong>
                        <span>
                            Total: ${stats[dept].total} |
                            Hadir: <span style="color: var(--success-color);">${stats[dept].present}</span> |
                            Belum: <span style="color: var(--danger-color);">${stats[dept].absent}</span>
                        </span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Department stats error:', error);
            document.getElementById('departmentStats').innerHTML =
                '<p class="empty-state">Gagal memuat statistik</p>';
        }
    },
    async loadRangeRecap() {
        const startDate = document.getElementById('dashboardStartDate')?.value;
        const endDate = document.getElementById('dashboardEndDate')?.value;

        if (!startDate || !endDate) {
            App.showToast('Tanggal rekap belum lengkap', 'error');
            return;
        }

        if (startDate > endDate) {
            App.showToast('Tanggal mulai tidak boleh lebih besar dari tanggal akhir', 'error');
            return;
        }

        try {
            App.showLoading('Memuat rekap periode...');
            const response = await API.getRangeReport(startDate, endDate);
            App.hideLoading();

            if (!response.success) {
                throw new Error(response.error || 'Gagal memuat rekap periode');
            }

            this.renderRangeRecap(response);
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
            this.renderEmptyRangeRecap('Gagal memuat rekap periode');
        }
    },
    renderRangeRecap(response) {
        const statsContainer = document.getElementById('dashboardRecapStats');
        const tableBody = document.getElementById('dashboardRecapTableBody');
        const totals = response.totals || { days: 0, checkins: 0, checkouts: 0, overtimes: 0, uniqueEmployees: 0 };
        const data = response.data || [];

        statsContainer.innerHTML = `
            <div class="report-stat">
                <div class="report-stat-value">${totals.days}</div>
                <div class="report-stat-label">Hari Tercatat</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.checkins}</div>
                <div class="report-stat-label">Total Masuk</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.checkouts}</div>
                <div class="report-stat-label">Total Keluar</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.overtimes}</div>
                <div class="report-stat-label">Total Lembur</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.uniqueEmployees}</div>
                <div class="report-stat-label">Akumulasi Hadir</div>
            </div>
        `;

        if (!data.length) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data pada rentang tanggal tersebut.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map((item) => `
            <tr>
                <td>${this.escapeHtml(item.date)}</td>
                <td>${item.checkins}</td>
                <td>${item.checkouts}</td>
                <td>${item.uniqueEmployees}</td>
                <td>${item.departments}</td>
            </tr>
        `).join('');
    },
    renderEmptyRangeRecap(message) {
        document.getElementById('dashboardRecapStats').innerHTML = `
            <div class="report-stat">
                <div class="report-stat-value">0</div>
                <div class="report-stat-label">${this.escapeHtml(message)}</div>
            </div>
        `;
        document.getElementById('dashboardRecapTableBody').innerHTML =
            '<tr><td colspan="5" class="text-center">Tidak ada data untuk ditampilkan.</td></tr>';
    },
    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    async refresh() {
        await this.load();
        App.showToast('Dashboard diperbarui', 'success');
    }
};
