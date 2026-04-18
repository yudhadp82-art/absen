// Attendance Management
const Attendance = {
    currentFilters: {
        date: null,
        endDate: null,
        department: '',
        type: ''
    },
    async init() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDate').value = today;
        document.getElementById('filterDateEnd').value = today;
        this.currentDate = today;
        this.currentFilters = { date: today, endDate: today, department: '', type: '' };
        
        // Simpan tanggal hari ini untuk cek reset harian
        this.lastInitDate = today;

        await this.loadRange(today, today);

        // Auto-refresh/reset check timer (setiap 5 menit cek apa sudah ganti hari)
        setInterval(() => this.checkDailyReset(), 5 * 60 * 1000);
    },
    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.lastInitDate !== today) {
            console.log('Day changed, resetting dashboard to today:', today);
            this.lastInitDate = today;
            document.getElementById('filterDate').value = today;
            document.getElementById('filterDateEnd').value = today;
            this.loadRange(today, today);
        }
    },
    async load() {
        const startInput = document.getElementById('filterDate');
        const endInput = document.getElementById('filterDateEnd');
        const start = startInput?.value || new Date().toISOString().split('T')[0];
        const end = endInput?.value || start;
        await this.loadRange(start, end);
    },
    async loadRange(start, end) {
        try {
            App.showLoading(start === end ? 'Memuat data harian...' : 'Memuat data rentang...');
            
            // if range is single day, use getDailyReport for richer summary
            // but for ranges, we use getRangeReport or handle it manually
            let response;
            if (start === end) {
                response = await API.getDailyReport(start);
            } else {
                // Use getRangeReport from report API
                response = await API.getRangeReport(start, end);
                // The range report returns summarized data per day in 'data'
                // and per employee in 'employeeRecap'.
                // For the Attendance tab, we want a daily list like displayDailyReport.
                // We need to fetch individual records then group them?
                // Actually, the easy way is to fetch individual records via API.getAttendance
                // and then group them like buildDailySummary in backend.
                await this.loadDetailedRange(start, end);
                return;
            }

            App.hideLoading();
            if (response.success) {
                this.currentFilters.date = start;
                this.currentFilters.endDate = end;
                const filteredRecords = this.filterRecords(response.data || []);
                this.renderTable(filteredRecords);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    async loadDetailedRange(start, end) {
        try {
            App.showLoading('Memproses data rentang...');
            const response = await API.getAttendance({ startDate: start, endDate: end, limit: 1000 });
            App.hideLoading();
            
            if (response.success) {
                // Group individual records into daily summaries per employee
                const grouped = this.groupAttendance(response.data);
                this.currentFilters.date = start;
                this.currentFilters.endDate = end;
                const filteredRecords = this.filterRecords(grouped);
                this.renderTable(filteredRecords);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    groupAttendance(records) {
        const groups = new Map();

        records.forEach(r => {
            const date = r.timestamp.split('T')[0];
            const key = `${r.employeeId}::${date}`;
            const existing = groups.get(key) || {
                employee_id: r.employeeId,
                employee_name: r.employeeName,
                department: r.department || '-',
                attendance_date: date,
                checkin_time: null,
                checkout_time: null,
                overtime_time: null,
                checkin_latitude: null,
                checkin_longitude: null,
                checkout_latitude: null,
                checkout_longitude: null,
                overtime_latitude: null,
                overtime_longitude: null
            };

            if (r.type === 'checkin') {
                if (!existing.checkin_time || new Date(r.timestamp) < new Date(existing.checkin_time)) {
                    existing.checkin_time = r.timestamp;
                    existing.checkin_latitude = r.location?.latitude;
                    existing.checkin_longitude = r.location?.longitude;
                }
            } else if (r.type === 'checkout') {
                if (!existing.checkout_time || new Date(r.timestamp) > new Date(existing.checkout_time)) {
                    existing.checkout_time = r.timestamp;
                    existing.checkout_latitude = r.location?.latitude;
                    existing.checkout_longitude = r.location?.longitude;
                }
            } else if (r.type === 'overtime') {
                if (!existing.overtime_time || new Date(r.timestamp) > new Date(existing.overtime_time)) {
                    existing.overtime_time = r.timestamp;
                    existing.overtime_latitude = r.location?.latitude;
                    existing.overtime_longitude = r.location?.longitude;
                }
            }

            groups.set(key, existing);
        });

        return Array.from(groups.values()).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date) || a.employee_name.localeCompare(b.employee_name));
    },
    filterRecords(records) {
        const department = document.getElementById('filterDept')?.value || '';
        const type = document.getElementById('filterType')?.value || '';

        this.currentFilters.department = department;
        this.currentFilters.type = type;

        return (records || []).filter((record) => {
            const departmentMatch = !department || record.department === department;
            const typeMatch =
                !type ||
                (type === 'checkin' && record.checkin_time) ||
                (type === 'checkout' && record.checkout_time) ||
                (type === 'overtime' && record.overtime_time);

            return departmentMatch && typeMatch;
        });
    },
    renderTable(records) {
        const container = document.getElementById('attendanceTableBody');
        if (!records || !records.length) {
            container.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada aktivitas absensi pada tanggal ini.</td></tr>';
            return;
        }

        this.cachedData = records;

        container.innerHTML = records.map(record => {
            const checkin = record.checkin_time ? API.formatTime(record.checkin_time) : '<span class="text-muted">-</span>';
            const checkout = record.checkout_time ? API.formatTime(record.checkout_time) : '<span class="text-muted">-</span>';
            const overtime = record.overtime_time ? API.formatTime(record.overtime_time) : '<span class="text-muted">-</span>';
            
            // Generate link location (prioritaskan checkin if available)
            const lat = record.checkin_latitude || record.checkout_latitude || record.overtime_latitude;
            const lon = record.checkin_longitude || record.checkout_longitude || record.overtime_longitude;
            const locLink = lat ? 
                `<a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" title="Lihat Peta">Map</a>` : '';
            const safeEmployeeName = this.escapeHtml(record.employee_name);
            const safeEmployeeId = this.escapeHtml(record.employee_id);
            const escapedEmployeeName = record.employee_name.replace(/'/g, "\\'");

            return `
                <tr>
                    <td>
                        <strong>${safeEmployeeName}</strong><br>
                        <small class="text-muted">${safeEmployeeId}</small><br>
                        <button
                            class="btn-icon btn-danger"
                            onclick="Attendance.deleteAttendanceByEmployeeDate('${record.employee_id}', '${escapedEmployeeName}', '${record.attendance_date}')"
                            title="Hapus Semua Absensi ${safeEmployeeName} pada ${record.attendance_date}"
                        >
                            Hapus Nama
                        </button>
                    </td>
                    <td>${this.escapeHtml(record.department || '-')}</td>
                    <td>${record.attendance_date} ${locLink}</td>
                    <td><span class="status-badge status-checkin">${checkin}</span></td>
                    <td><span class="status-badge status-checkout">${checkout}</span></td>
                    <td><span class="status-badge">${overtime}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${record.checkin_time ? `<button class="btn-icon" onclick="Attendance.showEditModalByTime('${record.employee_id}', '${record.checkin_time}', 'checkin')" title="Edit Masuk">Edit</button>` : ''}
                            ${record.checkout_time ? `<button class="btn-icon" onclick="Attendance.showEditModalByTime('${record.employee_id}', '${record.checkout_time}', 'checkout')" title="Edit Keluar">Edit</button>` : ''}
                            ${record.overtime_time ? `<button class="btn-icon" onclick="Attendance.showEditModalByTime('${record.employee_id}', '${record.overtime_time}', 'overtime')" title="Edit Lembur">Edit Lembur</button>` : ''}
                            <button class="btn-icon btn-danger" onclick="Attendance.deleteAttendanceByEmployeeDate('${record.employee_id}', '${escapedEmployeeName}', '${record.attendance_date}')" title="Hapus Semua Absensi ${safeEmployeeName} pada ${record.attendance_date}">Hapus</button>
                        </div>
                    </td>
                </tr>
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
    async applyFilters() {
        const dateInput = document.getElementById('filterDate');
        const date = (dateInput?.value || new Date().toISOString().split('T')[0]).trim();
        await this.loadByDate(date);
    },
    async exportToXLSX() {
        const date = document.getElementById('filterDate')?.value || new Date().toISOString().split('T')[0];
        try {
            App.showLoading('Memuat data...');
            const response = await API.getAttendance({ date, limit: 1000 });
            App.hideLoading();
            if (response.success) {
                const exportData = response.data.map(r => ({
                    Waktu: API.formatDateTime(r.timestamp),
                    ID: r.employeeId,
                    Nama: r.employeeName,
                    Tipe: r.type === 'checkin' ? 'Check-In' : r.type === 'checkout' ? 'Check-Out' : 'Lembur',
                    Departemen: r.department || '-',
                    Latitude: r.location.latitude,
                    Longitude: r.location.longitude
                }));
                API.exportToXLSX(exportData, 'absensi-' + date, 'Absensi');
                App.showToast('Data absensi XLSX berhasil diunduh', 'success');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    openImportPicker() {
        const input = document.getElementById('attendanceImportFile');
        if (!input) {
            App.showToast('Input file import tidak ditemukan', 'error');
            return;
        }
        input.value = '';
        input.click();
    },
    async handleImportFile(event) {
        const file = event.target?.files?.[0];
        if (!file) return;
        if (typeof XLSX === 'undefined') {
            App.showToast('Library import XLSX belum termuat', 'error');
            return;
        }

        try {
            App.showLoading('Membaca file XLSX...');
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            const importData = rawRows.map(row => {
                const id = String(row['ID'] || row['employee_id'] || row['No. Anggota'] || '').trim();
                const nama = String(row['Nama'] || row['employee_name'] || '').trim();
                let type = String(row['Tipe'] || row['type'] || 'checkin').toLowerCase();
                if (type.includes('in')) type = 'checkin';
                else if (type.includes('out')) type = 'checkout';
                else if (type.includes('lembur') || type.includes('overtime')) type = 'overtime';

                return {
                    employeeId: id,
                    employeeName: nama,
                    type: type,
                    timestamp: row['Waktu'] || row['timestamp'] || new Date().toISOString(),
                    location: {
                        latitude: parseFloat(row['Latitude'] || 0),
                        longitude: parseFloat(row['Longitude'] || 0)
                    }
                };
            }).filter(d => d.employeeId && d.employeeName);

            if (!importData.length) {
                throw new Error('Tidak ada data valid ditemukan');
            }

            App.showLoading(`Import ${importData.length} records...`);
            const response = await API.request('/attendance/bulk', {
                method: 'POST',
                body: JSON.stringify({ attendance: importData })
            });

            App.hideLoading();
            if (response.success) {
                App.showToast(`Import berhasil: ${response.count} records`, 'success');
                const date = document.getElementById('filterDate').value;
                await this.loadByDate(date);
            } else {
                throw new Error(response.error || 'Gagal import bulk');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Gagal import file', 'error');
        } finally {
            if (event.target) event.target.value = '';
        }
    },
    // Fungsi baru untuk edit data berdasarkan waktu yang diklik
    async showEditModalByTime(employeeId, timestamp, type) {
        try {
            App.showLoading('Mengambil detail data...');
            // Kita perlu ID aslinya, jadi cari raw recordnya
            const response = await API.request(`/attendance?employeeId=${employeeId}&date=${timestamp.split('T')[0]}`);
            App.hideLoading();
            
            if (response.success) {
                // Cari record yang tipenya sama dan waktunya paling mendekati (atau sama)
                const record = response.data.find(r => r.type === type && r.timestamp === timestamp);
                if (record) {
                    this.showEditModal(record.id);
                } else {
                    App.showToast('Record asli tidak ditemukan', 'warning');
                }
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    showEditModal(id) {
        // Kita butuh data mentah untuk edit, fetch dulu jika belum ada di cachedData mentah
        // Namun sederhananya, kita gunakan modal edit yang sudah ada tetapi dengan data yang kita cari
        this.fetchRecordAndShowModal(id);
    },
    async fetchRecordAndShowModal(id) {
        try {
            App.showLoading('Memuat detail...');
            const response = await API.request(`/attendance?id=${id}`);
            App.hideLoading();

            const record = response.data;
            if (!record) throw new Error('Data tidak ditemukan');

            document.getElementById('attendanceId').value = record.id;
            document.getElementById('attEmployeeId').value = record.employeeId;
            document.getElementById('attEmployeeName').value = record.employeeName;
            document.getElementById('attType').value = record.type;
            document.getElementById('attAddress').value = record.location?.address || '';

            const date = new Date(record.timestamp);
            const tzOffset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date - tzOffset).toISOString().slice(0, 16);
            document.getElementById('attTimestamp').value = localISOTime;

            document.getElementById('attendanceModal').classList.add('active');
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    closeModal() {
        document.getElementById('attendanceModal').classList.remove('active');
    },
    async saveAttendance(event) {
        event.preventDefault();
        const id = document.getElementById('attendanceId').value;
        const data = {
            type: document.getElementById('attType').value,
            timestamp: new Date(document.getElementById('attTimestamp').value).toISOString(),
            address: document.getElementById('attAddress').value
        };

        try {
            App.showLoading('Menyimpan perubahan...');
            const response = await API.request(`/attendance?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            App.hideLoading();
            if (response.success) {
                App.showToast('Data absensi berhasil diperbarui', 'success');
                this.closeModal();
                const currentDate = document.getElementById('filterDate').value;
                await this.loadByDate(currentDate);
            } else {
                throw new Error(response.error || 'Gagal menyimpan perubahan');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    async deleteAttendance(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) return;

        try {
            App.showLoading('Menghapus data...');
            const response = await API.request(`/attendance?id=${id}`, {
                method: 'DELETE'
            });

            App.hideLoading();
            if (response.success) {
                App.showToast('Data absensi berhasil dihapus', 'success');
                const currentDate = document.getElementById('filterDate').value;
                await this.loadByDate(currentDate);
            } else {
                throw new Error(response.error || 'Gagal menghapus data');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    async deleteAttendanceByEmployeeDate(employeeId, employeeName, attendanceDate) {
        const firstConfirm = confirm(`Hapus semua data absensi untuk ${employeeName} pada ${attendanceDate}?`);
        if (!firstConfirm) return;

        const secondConfirm = confirm(`Konfirmasi sekali lagi: seluruh riwayat check-in dan check-out ${employeeName} pada ${attendanceDate} akan dihapus permanen.`);
        if (!secondConfirm) return;

        try {
            App.showLoading('Menghapus data absensi karyawan...');
            const params = new URLSearchParams({
                employeeId,
                date: attendanceDate
            });
            const response = await API.request(`/attendance?${params.toString()}`, {
                method: 'DELETE'
            });

            App.hideLoading();
            if (response.success) {
                App.showToast(`Berhasil menghapus ${response.deletedCount || 0} data absensi ${employeeName}`, 'success');
                const currentDate = document.getElementById('filterDate').value;
                await this.loadByDate(currentDate || new Date().toISOString().split('T')[0]);
            } else {
                throw new Error(response.error || 'Gagal menghapus data absensi karyawan');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    }
};
