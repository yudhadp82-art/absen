// ========================================
// Employee Management
// ========================================

const Employees = {
    allEmployees: [],

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

    populateEmployeeSelect() {
        const input = document.getElementById('employeeSearch');
        const datalist = document.getElementById('employeeDatalist');

        if (!input || !datalist) return;

        datalist.innerHTML = '';

        this.allEmployees.forEach(emp => {
            const option = document.createElement('option');
            const label = `${emp.employee_id} - ${emp.employee_name}${emp.department ? ' (' + emp.department + ')' : ''}`;
            option.value = label;
            datalist.appendChild(option);
        });

        input.oninput = () => {
            const val = input.value;
            const employee = this.allEmployees.find(emp => {
                const label = `${emp.employee_id} - ${emp.employee_name}${emp.department ? ' (' + emp.department + ')' : ''}`;
                return val === label || val === emp.employee_id || val === emp.employee_name;
            });

            if (employee) {
                document.getElementById('employeeId').value = employee.employee_id;
                document.getElementById('employeeName').value = employee.employee_name;
                App.state.employeeId = employee.employee_id;
                App.state.employeeName = employee.employee_name;
            } else if (val.trim() === '') {
                document.getElementById('employeeId').value = '';
                document.getElementById('employeeName').value = '';
                App.state.employeeId = '';
                App.state.employeeName = '';
            }
        };
    }
};
