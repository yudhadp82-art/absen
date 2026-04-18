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

            const response = await API.request('/employees?_=' + new Date().getTime(), {
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
     * Populate employee datalist and handle search input
     */
    populateEmployeeSelect() {
        const input = document.getElementById('employeeSearch');
        const datalist = document.getElementById('employeeDatalist');

        if (!input || !datalist) return;

        // Clear existing options
        datalist.innerHTML = '';

        // Add employee options to datalist
        this.allEmployees.forEach(emp => {
            const option = document.createElement('option');
            // Format: ID - Nama (Dept)
            const label = `${emp.employee_id} - ${emp.employee_name}${emp.department ? ' (' + emp.department + ')' : ''}`;
            option.value = label;
            datalist.appendChild(option);
        });

        // Add input event listener to detect selection
        input.oninput = () => {
            const val = input.value;
            // Find employee by matching the prefix (ID) or the entire label
            const employee = this.allEmployees.find(emp => {
                const label = `${emp.employee_id} - ${emp.employee_name}${emp.department ? ' (' + emp.department + ')' : ''}`;
                return val === label || val === emp.employee_id || val === emp.employee_name;
            });

            if (employee) {
                document.getElementById('employeeId').value = employee.employee_id;
                document.getElementById('employeeName').value = employee.employee_name;
                App.state.employeeId = employee.employee_id;
                App.state.employeeName = employee.employee_name;
            } else {
                if (val.trim() === '') {
                    document.getElementById('employeeId').value = '';
                    document.getElementById('employeeName').value = '';
                    App.state.employeeId = '';
                    App.state.employeeName = '';
                }
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
