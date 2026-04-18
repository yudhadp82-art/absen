const App = {
    state: {
        employeeId: '',
        employeeName: '',
        activeTab: 'checkin',
        todayRecords: [],
        todayEmployeeMap: {}
    },

    init() {
        console.log('Absensi Karyawan App initialized');
        this.bindEvents();
        this.loadTodayHistory();
        this.loadEmployees();
    },

    async loadEmployees() {
        await Employees.loadEmployees();
    },

    bindEvents() {
        const manualTimeToggle = document.getElementById('manualTimeToggle');
        const manualTimeContainer = document.getElementById('manualTimeContainer');
        const manualTimeInput = document.getElementById('manualTimeInput');

        if (manualTimeToggle) {
            manualTimeToggle.addEventListener('change', (e) => {
                manualTimeContainer.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked) {
                    const now = new Date();
                    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    manualTimeInput.value = localISO;
                }
            });
        }

        document.getElementById('checkInBtn').addEventListener('click', () => {
            this.handleAttendance('checkin');
        });

        document.getElementById('checkOutBtn').addEventListener('click', () => {
            const employeeId = document.getElementById('checkoutEmployeeSelect').value;
            this.handleSelectAttendance('checkout', employeeId);
        });

        document.getElementById('overtimeBtn').addEventListener('click', () => {
            const employeeId = document.getElementById('overtimeEmployeeSelect').value;
            this.handleSelectAttendance('overtime', employeeId);
        });

        document.querySelectorAll('.attendance-tab').forEach((button) => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        document.getElementById('checkoutEmployeeSelect').addEventListener('change', (event) => {
            this.updateSelectionInfo('checkout', event.target.value);
        });

        document.getElementById('overtimeEmployeeSelect').addEventListener('change', (event) => {
            this.updateSelectionInfo('overtime', event.target.value);
        });
    },

    switchTab(tab) {
        this.state.activeTab = tab;

        document.querySelectorAll('.attendance-tab').forEach((button) => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        document.getElementById('attendancePanelCheckin').classList.toggle('active', tab === 'checkin');
        document.getElementById('attendancePanelCheckout').classList.toggle('active', tab === 'checkout');
        document.getElementById('attendancePanelOvertime').classList.toggle('active', tab === 'overtime');
    },

    getActionConfig(actionType) {
        const map = {
            checkin: {
                submitType: 'checkin',
                loadingText: 'Memproses absensi masuk...',
                successText: 'Absensi masuk berhasil'
            },
            checkout: {
                submitType: 'checkout',
                loadingText: 'Memproses absensi keluar...',
                successText: 'Absensi keluar berhasil'
            },
            overtime: {
                submitType: 'overtime',
                loadingText: 'Memproses form lembur...',
                successText: 'Form lembur berhasil disimpan'
            }
        };

        return map[actionType] || map.checkin;
    },

    getManualTimestamp() {
        const manualTimeToggle = document.getElementById('manualTimeToggle');
        const manualTimeInput = document.getElementById('manualTimeInput');

        if (manualTimeToggle && manualTimeToggle.checked && manualTimeInput.value) {
            return new Date(manualTimeInput.value).toISOString();
        }

        return null;
    },

    async handleAttendance(actionType, employeeOverride = null) {
        const config = this.getActionConfig(actionType);
        const employeeId = employeeOverride?.employeeId || this.state.employeeId;
        const employeeName = employeeOverride?.employeeName || this.state.employeeName;

        if (!employeeId || !employeeName) {
            this.showToast('Harap pilih karyawan terlebih dahulu', 'error');
            return;
        }

        this.showLoading(config.loadingText);

        const dummyLocation = {
            latitude: 0,
            longitude: 0,
            accuracy: 0
        };

        try {
            const response = await API.submitAttendance(
                employeeId,
                employeeName,
                config.submitType,
                dummyLocation,
                this.getManualTimestamp()
            );

            this.hideLoading();
            this.showStatus(`${config.successText}\n${response.message}`, 'success');
            this.showToast(`${employeeName} - ${config.successText}`);

            await this.loadTodayHistory();
        } catch (error) {
            this.hideLoading();
            this.showStatus(error.message, 'error');
            this.showToast(error.message, 'error');
        }
    },

    async handleSelectAttendance(actionType, employeeId) {
        const employee = this.state.todayEmployeeMap[employeeId];

        if (!employeeId || !employee) {
            this.showToast('Harap pilih karyawan dari daftar', 'error');
            return;
        }

        await this.handleAttendance(actionType, {
            employeeId: employee.employeeId,
            employeeName: employee.employeeName
        });
    },

    async loadTodayHistory() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await API.getAttendanceHistory(null, today);
            const records = response.success ? response.data : [];

            this.state.todayRecords = records;
            this.displayTodayHistory(records);
            this.populateAttendanceSelects(records);
        } catch (error) {
            console.error('Failed to load history:', error);
            this.displayTodayHistory([]);
            this.populateAttendanceSelects([]);
        }
    },

    buildTodayEmployeeMap(records) {
        const employeeMap = {};

        records.forEach((record) => {
            const key = record.employeeId;
            if (!key) return;

            if (!employeeMap[key]) {
                employeeMap[key] = {
                    employeeId: record.employeeId,
                    employeeName: record.employeeName,
                    checkinTime: null,
                    checkoutTime: null,
                    overtimeTime: null
                };
            }

            if (record.type === 'checkin') {
                if (!employeeMap[key].checkinTime || new Date(record.timestamp) > new Date(employeeMap[key].checkinTime)) {
                    employeeMap[key].checkinTime = record.timestamp;
                }
            }

            if (record.type === 'checkout') {
                if (!employeeMap[key].checkoutTime || new Date(record.timestamp) > new Date(employeeMap[key].checkoutTime)) {
                    employeeMap[key].checkoutTime = record.timestamp;
                }
            }

            if (record.type === 'overtime') {
                if (!employeeMap[key].overtimeTime || new Date(record.timestamp) > new Date(employeeMap[key].overtimeTime)) {
                    employeeMap[key].overtimeTime = record.timestamp;
                }
            }
        });

        return employeeMap;
    },

    populateAttendanceSelects(records) {
        const employeeMap = this.buildTodayEmployeeMap(records);
        this.state.todayEmployeeMap = employeeMap;

        const employees = Object.values(employeeMap)
            .filter((employee) => employee.checkinTime && !employee.checkoutTime)
            .sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'id-ID'));

        this.populateAttendanceSelect('checkoutEmployeeSelect', employees, 'Pilih karyawan yang sudah masuk');
        this.populateAttendanceSelect('overtimeEmployeeSelect', employees, 'Pilih karyawan untuk lembur');

        this.updateSelectionInfo('checkout', document.getElementById('checkoutEmployeeSelect').value);
        this.updateSelectionInfo('overtime', document.getElementById('overtimeEmployeeSelect').value);
    },

    populateAttendanceSelect(selectId, employees, placeholder) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;

        employees.forEach((employee) => {
            const option = document.createElement('option');
            option.value = employee.employeeId;
            option.textContent = `${employee.employeeName} (${employee.employeeId})`;
            select.appendChild(option);
        });

        const hasCurrent = employees.some((employee) => employee.employeeId === currentValue);
        select.value = hasCurrent ? currentValue : '';
    },

    updateSelectionInfo(type, employeeId) {
        const infoId = type === 'checkout' ? 'checkoutEmployeeInfo' : 'overtimeEmployeeInfo';
        const info = document.getElementById(infoId);
        const employee = this.state.todayEmployeeMap[employeeId];

        if (!info || !employeeId || !employee) {
            if (info) info.style.display = 'none';
            return;
        }

        info.innerHTML = `
            <span class="selection-name">${this.escapeHtml(employee.employeeName)}</span>
            <span class="selection-meta">ID ${this.escapeHtml(employee.employeeId)} • Masuk ${API.formatTime(employee.checkinTime)}</span>
            ${employee.checkoutTime ? `<span class="selection-meta">Keluar ${API.formatTime(employee.checkoutTime)}</span>` : ''}
        `;
        info.style.display = 'flex';
    },

    displayTodayHistory(history) {
        const historyContainer = document.getElementById('todayHistory');

        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">Belum ada absensi hari ini</p>';
            return;
        }

        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        historyContainer.innerHTML = history.map((record) => {
            const typeLabel = record.type === 'checkin' ? 'Masuk' : record.type === 'checkout' ? 'Keluar' : 'Lembur';
            const itemClass = record.type === 'checkin' ? 'is-checkin' : 'is-checkout';
            const time = API.formatTime(record.timestamp);

            return `
                <div class="history-item ${itemClass}">
                    <div class="history-main">
                        <span class="history-time">${time}</span>
                        <span class="history-type">${typeLabel}</span>
                    </div>
                    <span class="history-name">${this.escapeHtml(record.employeeName || '')}</span>
                </div>
            `;
        }).join('');
    },

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    showLoading(text = 'Memproses...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    },

    showStatus(message, type = 'success') {
        const statusSection = document.getElementById('statusSection');
        const statusMessage = document.getElementById('statusMessage');

        statusMessage.className = `status-message ${type}`;
        statusMessage.innerHTML = message.replace(/\n/g, '<br>');
        statusSection.style.display = 'block';

        setTimeout(() => {
            statusSection.style.display = 'none';
        }, 5000);
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}
