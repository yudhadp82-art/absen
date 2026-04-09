// Employee Management
const Employees = {
    allEmployees: [],
    
    async load() {
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
    
    renderTable() {
        const tbody = document.getElementById('employeeTableBody');
        if (!this.allEmployees.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        tbody.innerHTML = this.allEmployees.map(emp => `
            <tr>
                <td><strong>${emp.employee_id}</strong></td>
                <td>${emp.employee_name}</td>
                <td>${emp.email || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td><span class="status-badge ${emp.is_active ? 'status-active' : 'status-inactive'}">${emp.is_active ? 'Aktif' : 'Tidak Aktif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Employees.showEditModal('${emp.employee_id}')">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="Employees.deleteEmployee('${emp.employee_id}')">🗑️ Hapus</button>
                </td>
            </tr>
        `).join('');
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
