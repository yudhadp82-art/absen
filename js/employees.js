// ========================================
// Employee Management
// ========================================

const Employees = {
    allEmployees: [],

    /**
     * Load all employees from API
     */
    async loadEmployees() {
        try {
            App.showLoading('Memuat daftar karyawan...');

            const response = await API.request('/employees', {
                method: 'GET'
            });

            if (response.success) {
                this.allEmployees = response.data;
                this.populateEmployeeSelect();
                App.hideLoading();
                return response.data;
            }

            App.hideLoading();
            return [];

        } catch (error) {
            App.hideLoading();
            console.error('Failed to load employees:', error);
            return [];
        }
    },

    /**
     * Populate employee select dropdown
     */
    populateEmployeeSelect() {
        const select = document.getElementById('employeeSelect');

        // Clear existing options
        select.innerHTML = '<option value="">-- Pilih Karyawan --</option>';

        // Add employee options
        this.allEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.employee_id;
            option.textContent = `${emp.employee_id} - ${emp.employee_name}`;
            if (emp.department) {
                option.textContent += ` (${emp.department})`;
            }
            select.appendChild(option);
        });

        // Add event listener
        select.onchange = () => {
            const selectedId = select.value;
            const employee = this.allEmployees.find(emp => emp.employee_id === selectedId);

            if (employee) {
                document.getElementById('employeeId').value = employee.employee_id;
                document.getElementById('employeeName').value = employee.employee_name;
                App.state.employeeId = employee.employee_id;
                App.state.employeeName = employee.employee_name;
            } else {
                document.getElementById('employeeId').value = '';
                document.getElementById('employeeName').value = '';
                App.state.employeeId = '';
                App.state.employeeName = '';
            }
        };
    },

    /**
     * Add new employee
     */
    async addEmployee(employeeData) {
        try {
            App.showLoading('Menambah karyawan...');

            const response = await API.request('/employees', {
                method: 'POST',
                body: JSON.stringify(employeeData)
            });

            App.hideLoading();

            if (response.success) {
                App.showToast('Karyawan berhasil ditambahkan', 'success');
                await this.loadEmployees(); // Reload employee list

                // Clear form
                document.getElementById('newEmployeeId').value = '';
                document.getElementById('newEmployeeName').value = '';
                document.getElementById('newEmployeeEmail').value = '';
                document.getElementById('newEmployeeDept').value = '';
                document.getElementById('newEmployeePos').value = '';
                document.getElementById('newEmployeePhone').value = '';

                // Toggle form
                toggleAddEmployeeForm();

                return true;
            }

            return false;

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message || 'Gagal menambah karyawan', 'error');
            return false;
        }
    },

    /**
     * Get employee by ID
     */
    getEmployeeById(employeeId) {
        return this.allEmployees.find(emp => emp.employee_id === employeeId);
    },

    /**
     * Get employees by department
     */
    getEmployeesByDepartment(department) {
        return this.allEmployees.filter(emp => emp.department === department);
    },

    /**
     * Format employee display name
     */
    formatEmployeeName(employee) {
        if (!employee) return '-';
        let name = employee.employee_name;
        if (employee.position) {
            name += ` (${employee.position})`;
        }
        return name;
    }
};
