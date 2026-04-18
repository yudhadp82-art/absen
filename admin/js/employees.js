// Employee Management
const Employees = {
    allEmployees: [],
    
    init() {
        const searchInput = document.getElementById('searchEmployee');
        const departmentInput = document.getElementById('filterDepartment');
        const statusInput = document.getElementById('filterStatus');

        if (searchInput && !searchInput.dataset.bound) {
            searchInput.addEventListener('input', () => this.renderTable());
            searchInput.dataset.bound = 'true';
        }

        if (departmentInput && !departmentInput.dataset.bound) {
            departmentInput.addEventListener('change', () => this.renderTable());
            departmentInput.dataset.bound = 'true';
        }

        if (statusInput && !statusInput.dataset.bound) {
            statusInput.addEventListener('change', () => this.renderTable());
            statusInput.dataset.bound = 'true';
        }
    },
    
    async load() {
        this.init();
        try {
            App.showLoading('Memuat data...');
            const response = await API.request('/employees');
            App.hideLoading();
            if (response.success) {
                this.allEmployees = response.data;
                this.renderTable();
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    getFilteredEmployees() {
        const searchTerm = (document.getElementById('searchEmployee')?.value || '').trim().toLowerCase();
        const department = document.getElementById('filterDepartment')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';

        return this.allEmployees.filter(emp => {
            const matchesSearch = !searchTerm || [
                emp.employee_id,
                emp.employee_name,
                emp.email,
                emp.department,
                emp.address,
                emp.position
            ].some(value => String(value || '').toLowerCase().includes(searchTerm));

            const matchesDepartment = !department || (emp.department || '') === department;
            const matchesStatus = !status || String(Boolean(emp.is_active)) === String(status === 'active');

            return matchesSearch && matchesDepartment && matchesStatus;
        });
    },
    
    renderTable() {
        const tbody = document.getElementById('employeeTableBody');
        const employees = this.getFilteredEmployees();

        if (!employees.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        tbody.innerHTML = employees.map(emp => `
            <tr>
                <td><strong>${emp.employee_id}</strong></td>
                <td>${emp.employee_name}</td>
                <td>${emp.email || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.address || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td><span class="status-badge ${emp.is_active ? 'status-active' : 'status-inactive'}">${emp.is_active ? 'Aktif' : 'Tidak Aktif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Employees.showEditModal('${emp.employee_id}')">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="Employees.deleteEmployee('${emp.employee_id}')">🗑️ Hapus</button>
                </td>
            </tr>
        `).join('');
    },

    exportToXLSX() {
        const employees = this.getFilteredEmployees();

        if (!employees.length) {
            App.showToast('Tidak ada data karyawan untuk diexport', 'warning');
            return;
        }

        const exportData = employees.map(emp => ({
            ID: emp.employee_id,
            Nama: emp.employee_name,
            Email: emp.email || '-',
            Departemen: emp.department || '-',
            Alamat: emp.address || '-',
            Posisi: emp.position || '-',
            Telepon: emp.phone || '-',
            Status: emp.is_active ? 'Aktif' : 'Tidak Aktif'
        }));

        try {
            API.exportToXLSX(exportData, 'karyawan-' + new Date().toISOString().split('T')[0], 'Karyawan');
            App.showToast('Data karyawan XLSX berhasil diunduh', 'success');
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },
    downloadImportTemplate() {
        const templateRows = [
            {
                'No. Anggota': 'EMP001',
                'Nama': 'Ahmad Dahlan',
                'Email': 'ahmad@example.com',
                'Departemen': 'IT',
                'Alamat': 'Jl. Contoh No. 1',
                'Jabatan': 'Software Engineer',
                'Telepon': '081234567890',
                'Status': 'Aktif'
            },
            {
                'No. Anggota': 'EMP002',
                'Nama': 'Siti Rahayu',
                'Email': 'siti@example.com',
                'Departemen': 'HR',
                'Alamat': 'Jl. Contoh No. 2',
                'Jabatan': 'HR Manager',
                'Telepon': '081234567891',
                'Status': 'Aktif'
            }
        ];

        try {
            if (typeof XLSX === 'undefined') {
                throw new Error('Library export XLSX belum termuat');
            }

            const workbook = XLSX.utils.book_new();
            const templateSheet = XLSX.utils.json_to_sheet(templateRows);
            const infoSheet = XLSX.utils.json_to_sheet([
                {
                    Kolom: 'No. Anggota',
                    Keterangan: 'Wajib diisi. Harus unik untuk setiap karyawan.'
                },
                {
                    Kolom: 'Nama',
                    Keterangan: 'Wajib diisi.'
                },
                {
                    Kolom: 'Email',
                    Keterangan: 'Opsional.'
                },
                {
                    Kolom: 'Departemen',
                    Keterangan: 'Opsional. Contoh: IT, HR, Finance, Marketing.'
                },
                {
                    Kolom: 'Alamat',
                    Keterangan: 'Opsional.'
                },
                {
                    Kolom: 'Jabatan',
                    Keterangan: 'Opsional.'
                },
                {
                    Kolom: 'Telepon',
                    Keterangan: 'Opsional.'
                },
                {
                    Kolom: 'Status',
                    Keterangan: 'Opsional. Gunakan Aktif atau Tidak Aktif.'
                }
            ]);

            XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Karyawan');
            XLSX.utils.book_append_sheet(workbook, infoSheet, 'Petunjuk');
            XLSX.writeFile(workbook, 'template-import-karyawan.xlsx');
            App.showToast('Template import karyawan berhasil diunduh', 'success');
        } catch (error) {
            App.showToast(error.message || 'Gagal mengunduh template import', 'error');
        }
    },

    openImportPicker() {
        const input = document.getElementById('employeeImportFile');
        if (!input) {
            App.showToast('Input file import tidak ditemukan', 'error');
            return;
        }

        input.value = '';
        input.click();
    },

    normalizeHeader(header) {
        return String(header || '')
            .toLowerCase()
            .replace(/\./g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    parseStatus(value) {
        const normalized = String(value || '').trim().toLowerCase();

        if (!normalized) return true;

        if (['aktif', 'active', '1', 'true', 'ya', 'yes'].includes(normalized)) {
            return true;
        }

        if (['tidak aktif', 'inactive', '0', 'false', 'no', 'nonaktif'].includes(normalized)) {
            return false;
        }

        return true;
    },
    normalizeEmployeeId(value) {
        const normalized = String(value || '').trim();
        return normalized && normalized !== '-' ? normalized : '';
    },
    generateEmployeeId(employeeName, address = '', phone = '', rowNumber = 0) {
        const source = `${employeeName}|${address}|${phone}|${rowNumber}`.trim();
        let hash = 0;

        for (let index = 0; index < source.length; index += 1) {
            hash = ((hash << 5) - hash) + source.charCodeAt(index);
            hash |= 0;
        }

        const safeName = String(employeeName || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8) || 'KRYWN';
        const safeHash = Math.abs(hash).toString(36).toUpperCase().slice(0, 4) || '0000';

        return `NON-ANGGOTA-${safeName}-${safeHash}`;
    },

    mapImportRows(rows) {
        return rows.map((row, index) => {
            const normalizedRow = {};

            Object.keys(row || {}).forEach(key => {
                normalizedRow[this.normalizeHeader(key)] = row[key];
            });

            // IDs mapping
            const rawEmployeeId = String(
                normalizedRow['no anggota'] ??
                normalizedRow['noanggota'] ??
                normalizedRow['id anggota'] ??
                normalizedRow['idanggota'] ??
                normalizedRow['employee id'] ??
                normalizedRow['id'] ??
                ''
            ).trim();

            // Name mapping
            const employeeName = String(
                normalizedRow['nama'] ??
                normalizedRow['nama lengkap'] ??
                normalizedRow['name'] ??
                normalizedRow['employee name'] ??
                ''
            ).trim();
            const address = String(normalizedRow['alamat'] ?? normalizedRow['address'] ?? '').trim();
            const phone = String(normalizedRow['telepon'] ?? normalizedRow['no telp'] ?? normalizedRow['phone'] ?? '').trim();
            const employeeId = this.normalizeEmployeeId(rawEmployeeId) || (
                employeeName
                    ? this.generateEmployeeId(employeeName, address, phone, index + 2)
                    : ''
            );

            const statusValue = normalizedRow['status'];

            return {
                rowNumber: index + 2,
                employeeId,
                employeeName,
                email: String(normalizedRow['email'] ?? '').trim(),
                department: String(normalizedRow['departemen'] ?? normalizedRow['department'] ?? '').trim(),
                address,
                position: String(normalizedRow['jabatan'] ?? normalizedRow['posisi'] ?? normalizedRow['position'] ?? '').trim(),
                phone,
                isActive: this.parseStatus(statusValue)
            };
        });
    },
    dedupeImportRows(rows) {
        const uniqueRows = [];
        const seenIds = new Set();
        let duplicateRows = 0;

        rows.forEach(row => {
            const employeeId = String(row.employeeId || '').trim();

            if (!employeeId || seenIds.has(employeeId)) {
                if (employeeId) duplicateRows += 1;
                return;
            }

            seenIds.add(employeeId);
            uniqueRows.push(row);
        });

        return {
            uniqueRows,
            duplicateRows
        };
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

            if (!firstSheetName) {
                throw new Error('Sheet XLSX tidak ditemukan');
            }

            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            const importRows = this.mapImportRows(rawRows);
            const validRows = importRows.filter(row => row.employeeId && row.employeeName);
            const { uniqueRows, duplicateRows } = this.dedupeImportRows(validRows);

            if (!uniqueRows.length) {
                throw new Error('Tidak ada data valid. Pastikan minimal kolom Nama terisi.');
            }

            App.showLoading(`Import ${uniqueRows.length} data karyawan...`);

            // Use Bulk API for efficiency
            try {
                const response = await API.request('/employees/bulk', {
                    method: 'POST',
                    body: JSON.stringify({
                        employees: uniqueRows
                    })
                });

                App.hideLoading();
                await this.load();

                if (response.success) {
                    const skippedExisting = response.skippedExisting || 0;
                    const skippedDuplicateRows = (response.skippedDuplicateRows || 0) + duplicateRows;
                    App.showToast(`Import selesai. Baru: ${response.count}, sudah ada: ${skippedExisting}, duplikat file: ${skippedDuplicateRows}.`, 'success');
                } else {
                    throw new Error(response.error || 'Gagal bulk import');
                }
            } catch (bulkError) {
                console.warn('Bulk import failed, falling back to single requests:', bulkError);
                
                // Fallback to single requests if bulk API fails or not available
                let successCount = 0;
                let failedCount = 0;
                const errors = [];

                const existingIds = new Set(this.allEmployees.map(emp => emp.employee_id));
                let skippedExisting = 0;

                for (const row of uniqueRows) {
                    if (existingIds.has(row.employeeId)) {
                        skippedExisting += 1;
                        continue;
                    }

                    try {
                        await API.request('/employees', {
                            method: 'POST',
                            body: JSON.stringify({
                                employeeId: row.employeeId,
                                employeeName: row.employeeName,
                                email: row.email || null,
                                department: row.department || null,
                                address: row.address || null,
                                position: row.position || null,
                                phone: row.phone || null,
                                isActive: row.isActive
                            })
                        });

                        successCount += 1;
                    } catch (error) {
                        failedCount += 1;
                        errors.push(`Baris ${row.rowNumber}: ${error.message}`);
                    }
                }

                App.hideLoading();
                await this.load();

                if (successCount && !failedCount) {
                    App.showToast(`Import selesai (fallback). Baru: ${successCount}, sudah ada: ${skippedExisting}, duplikat file: ${duplicateRows}.`, 'success');
                } else {
                    const firstError = errors[0] ? ` ${errors[0]}` : '';
                    App.showToast(`Import selesai. Baru: ${successCount}, sudah ada: ${skippedExisting}, duplikat file: ${duplicateRows}, gagal: ${failedCount}.${firstError}`, failedCount ? 'warning' : 'success');
                }
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Gagal import file XLSX', 'error');
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    },
    
    showAddModal() {
        document.getElementById('modalTitle').textContent = 'Tambah Karyawan';
        document.getElementById('editEmployeeId').value = '';
        document.getElementById('employeeForm').reset();
        document.getElementById('employeeModal').classList.add('active');
    },

    showEditModal(employeeId) {
        const employee = this.allEmployees.find(emp => emp.employee_id === employeeId);
        if (!employee) {
            App.showToast('Karyawan tidak ditemukan', 'error');
            return;
        }

        document.getElementById('modalTitle').textContent = 'Edit Karyawan';
        document.getElementById('editEmployeeId').value = employeeId;
        document.getElementById('modalEmployeeId').value = employee.employee_id;
        document.getElementById('modalEmployeeId').disabled = true;
        document.getElementById('modalEmployeeName').value = employee.employee_name;
        document.getElementById('modalEmployeeEmail').value = employee.email || '';
        document.getElementById('modalEmployeeDept').value = employee.department || '';
        document.getElementById('modalEmployeeAddress').value = employee.address || '';
        document.getElementById('modalEmployeePos').value = employee.position || '';
        document.getElementById('modalEmployeePhone').value = employee.phone || '';
        document.getElementById('modalEmployeeStatus').value = employee.is_active ? 'true' : 'false';

        document.getElementById('employeeModal').classList.add('active');
    },

    async saveEmployee(event) {
        event.preventDefault();

        const editEmployeeId = document.getElementById('editEmployeeId').value;
        const employeeId = document.getElementById('modalEmployeeId').value.trim();
        const employeeName = document.getElementById('modalEmployeeName').value.trim();
        const email = document.getElementById('modalEmployeeEmail').value.trim();
        const department = document.getElementById('modalEmployeeDept').value;
        const address = document.getElementById('modalEmployeeAddress').value.trim();
        const position = document.getElementById('modalEmployeePos').value.trim();
        const phone = document.getElementById('modalEmployeePhone').value.trim();
        const isActive = document.getElementById('modalEmployeeStatus').value === 'true';

        if (!employeeId || !employeeName) {
            App.showToast('ID dan Nama karyawan wajib diisi!', 'error');
            return;
        }

        try {
            App.showLoading('Menyimpan data...');

            const isEdit = editEmployeeId !== '';
            const url = isEdit ? `/employees?id=${employeeId}` : '/employees';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await API.request(url, {
                method,
                body: JSON.stringify({
                    employeeId,
                    employeeName,
                    email: email || null,
                    department: department || null,
                    address: address || null,
                    position: position || null,
                    phone: phone || null,
                    isActive
                })
            });

            App.hideLoading();

            if (response.success) {
                App.showToast(isEdit ? 'Karyawan berhasil diperbarui!' : 'Karyawan berhasil ditambahkan!', 'success');
                this.closeModal();
                await this.load();
            } else {
                App.showToast(response.error || 'Gagal menyimpan karyawan', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Terjadi kesalahan', 'error');
        }
    },

    async deleteEmployee(employeeId) {
        if (!confirm(`Yakin ingin menghapus karyawan ${employeeId}?`)) {
            return;
        }

        try {
            App.showLoading('Menghapus data...');

            const response = await API.request(`/employees?id=${employeeId}`, {
                method: 'DELETE'
            });

            App.hideLoading();

            if (response.success) {
                App.showToast('Karyawan berhasil dihapus!', 'success');
                await this.load();
            } else {
                App.showToast(response.error || 'Gagal menghapus karyawan', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Terjadi kesalahan', 'error');
        }
    },

    closeModal() {
        document.getElementById('employeeModal').classList.remove('active');
        document.getElementById('employeeForm').reset();
        document.getElementById('modalEmployeeId').disabled = false;
    }
};
