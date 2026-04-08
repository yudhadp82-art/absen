// ========================================
// Main Application Logic
// ========================================

const App = {
    // State
    state: {
        employeeId: '',
        employeeName: '',
        currentLocation: null,
        isSubmitting: false
    },

    /**
     * Initialize app
     */
    init() {
        console.log('🚀 Absensi Karyawan App initialized');
        this.loadEmployeeInfo();
        this.bindEvents();
        this.loadTodayHistory();
        this.checkLocationPermission();
    },

    /**
     * Load saved employee info
     */
    loadEmployeeInfo() {
        const info = Storage.getEmployeeInfo();
        this.state.employeeId = info.id;
        this.state.employeeName = info.name;

        if (info.id) {
            document.getElementById('employeeId').value = info.id;
        }
        if (info.name) {
            document.getElementById('employeeName').value = info.name;
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Save employee info button
        document.getElementById('saveInfoBtn').addEventListener('click', () => {
            this.saveEmployeeInfo();
        });

        // Get location button
        document.getElementById('getLocationBtn').addEventListener('click', () => {
            this.handleGetLocation();
        });

        // Refresh location button
        document.getElementById('refreshLocationBtn').addEventListener('click', () => {
            this.handleGetLocation();
        });

        // Check-in button
        document.getElementById('checkInBtn').addEventListener('click', () => {
            this.handleAttendance('checkin');
        });

        // Check-out button
        document.getElementById('checkOutBtn').addEventListener('click', () => {
            this.handleAttendance('checkout');
        });
    },

    /**
     * Save employee info
     */
    saveEmployeeInfo() {
        const id = document.getElementById('employeeId').value.trim();
        const name = document.getElementById('employeeName').value.trim();

        if (!id || !name) {
            this.showToast('Harap isi ID dan Nama karyawan', 'error');
            return;
        }

        this.state.employeeId = id;
        this.state.employeeName = name;

        Storage.saveEmployeeInfo(id, name);
        this.showToast('Info karyawan berhasil disimpan', 'success');
    },

    /**
     * Check location permission status
     */
    checkLocationPermission() {
        if (!LocationManager.isSupported()) {
            this.showStatus(
                'Geolocation tidak didukung di browser ini. Gunakan Chrome, Firefox, atau Safari.',
                'error'
            );
            return;
        }
    },

    /**
     * Handle get location
     */
    async handleGetLocation() {
        // Show loading
        this.showLoading('Mengambil lokasi...');

        try {
            const location = await LocationManager.getCurrentPosition();

            // Hide loading
            this.hideLoading();

            // Update state
            this.state.currentLocation = location;

            // Update UI
            this.displayLocation(location);
            this.enableAttendanceButtons();

            this.showToast('Lokasi berhasil diambil', 'success');

        } catch (error) {
            this.hideLoading();
            this.showStatus(error.message, 'error');
            this.showToast(error.message, 'error');
        }
    },

    /**
     * Display location info
     */
    displayLocation(location) {
        // Hide status, show info
        document.getElementById('locationStatus').style.display = 'none';
        document.getElementById('locationInfo').style.display = 'block';
        document.getElementById('getLocationBtn').style.display = 'none';

        // Update details
        document.getElementById('latitude').textContent =
            LocationManager.formatCoordinate(location.latitude, 'lat');
        document.getElementById('longitude').textContent =
            LocationManager.formatCoordinate(location.longitude, 'lon');
        document.getElementById('accuracy').textContent =
            `~${Math.round(location.accuracy)} meter`;

        // Check accuracy
        if (location.accuracy > CONFIG.APP.MIN_LOCATION_ACCURACY) {
            this.showStatus(
                `Akurasi lokasi kurang baik (${Math.round(location.accuracy)}m). Coba di area terbuka.`,
                'warning'
            );
        }
    },

    /**
     * Enable attendance buttons
     */
    enableAttendanceButtons() {
        document.getElementById('checkInBtn').disabled = false;
        document.getElementById('checkOutBtn').disabled = false;
    },

    /**
     * Handle attendance (check-in/check-out)
     */
    async handleAttendance(type) {
        // Validate employee info
        if (!this.state.employeeId || !this.state.employeeName) {
            this.showToast('Harap isi ID dan Nama karyawan terlebih dahulu', 'error');
            return;
        }

        // Validate location
        if (!this.state.currentLocation) {
            this.showToast('Harap ambil lokasi terlebih dahulu', 'error');
            return;
        }

        // Show loading
        const actionText = type === 'checkin' ? 'Check-in' : 'Check-out';
        this.showLoading(`Memproses ${actionText}...`);

        try {
            // Submit attendance
            const response = await API.submitAttendance(
                this.state.employeeId,
                this.state.employeeName,
                type,
                this.state.currentLocation
            );

            // Hide loading
            this.hideLoading();

            // Show success
            this.showStatus(
                `${actionText} berhasil! 🎉\n${response.message}`,
                'success'
            );
            this.showToast(response.message || `${actionText} berhasil`, 'success');

            // Reload today's history
            await this.loadTodayHistory();

        } catch (error) {
            this.hideLoading();
            this.showStatus(error.message, 'error');
            this.showToast(error.message, 'error');
        }
    },

    /**
     * Load today's history
     */
    async loadTodayHistory() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await API.getAttendanceHistory(
                this.state.employeeId || null,
                today
            );

            if (response.success && response.data.length > 0) {
                this.displayTodayHistory(response.data);
            }

        } catch (error) {
            console.error('Failed to load history:', error);
        }
    },

    /**
     * Display today's history
     */
    displayTodayHistory(history) {
        const historyContainer = document.getElementById('todayHistory');

        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">Belum ada absensi hari ini</p>';
            return;
        }

        // Sort by timestamp
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Generate HTML
        const historyHTML = history.map(record => {
            const icon = record.type === 'checkin' ? '☀️' : '🌙';
            const typeLabel = record.type === 'checkin' ? 'Check In' : 'Check Out';
            const time = API.formatTime(record.timestamp);

            return `
                <div class="history-item">
                    <div>
                        <span class="history-time">${time}</span>
                        <span class="history-type">${icon} ${typeLabel}</span>
                    </div>
                </div>
            `;
        }).join('');

        historyContainer.innerHTML = historyHTML;
    },

    /**
     * Show loading overlay
     */
    showLoading(text = 'Memproses...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    },

    /**
     * Show status message
     */
    showStatus(message, type = 'success') {
        const statusSection = document.getElementById('statusSection');
        const statusMessage = document.getElementById('statusMessage');

        statusMessage.className = `status-message ${type}`;
        statusMessage.innerHTML = message.replace(/\n/g, '<br>');
        statusSection.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(() => {
            statusSection.style.display = 'none';
        }, 5000);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.style.display = 'block';

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
};

// ========================================
// Initialize App on DOM Ready
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}
