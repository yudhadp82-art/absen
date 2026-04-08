// Dashboard Logic
const Dashboard = {
    async load() {
        await this.loadStats();
        await this.loadRecentActivity();
        await this.loadDepartmentStats();
    },
    async loadStats() {
        try {
            console.log('📊 Loading dashboard stats...');
            const response = await API.request('/attendance/stats?' + new Date().getTime());
            console.log('✅ Stats response:', response);

            if (response.success && response.data.today) {
                const stats = response.data.today;
                console.log('📈 Stats data:', stats);

                document.getElementById('totalEmployees').textContent = stats.totalEmployees || 0;
                document.getElementById('presentToday').textContent = stats.checkins || 0;
                document.getElementById('absentToday').textContent = stats.absent || 0;
                document.getElementById('lateToday').textContent = stats.late || 0;

                console.log('✅ Stats loaded successfully');
            } else {
                console.error('❌ Invalid response format:', response);
            }
        } catch (error) {
            console.error('❌ Stats error:', error);
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
                            ${activity.type === 'checkin' ? '☀️' : '🌙'}
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${activity.employeeName}</strong> -
                                ${activity.type === 'checkin' ? 'Check-In' : 'Check-Out'}
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
                        <strong>${dept}</strong>
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
    async refresh() {
        await this.load();
        App.showToast('Dashboard diperbarui', 'success');
    }
};
