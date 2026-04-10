// Payroll Management - Fitur Pembayaran Karyawan
// Gaji perjam: Rp.6.000, Istirahat: -1 jam, Total dibulatkan

const Payroll = {
    currentPeriodId: null,
    calculations: null,

    // Initialize
    init() {
        this.loadPeriods();
    },

    // Load payroll periods
    async loadPeriods() {
        try {
            App.showLoading('Memuat periode pembayaran...');

            const response = await API.request('/payroll/periods', {
                method: 'GET'
            });

            App.hideLoading();

            if (response.success) {
                const container = document.getElementById('payrollPeriodsTable');
                container.innerHTML = this.renderPeriodsTable(response.data);

                App.showToast('Periode pembayaran dimuat', 'success');
            } else {
                App.showToast('Gagal memuat periode pembayaran', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // Render periods table
    renderPeriodsTable(periods) {
        if (periods.length === 0) {
            return `
                <div class="empty-state">
                    <p>📋 Belum ada periode pembayaran</p>
                    <button class="btn btn-primary" onclick="Payroll.openCreatePeriodModal()">
                        📝 Buat Periode Baru
                    </button>
                </div>
            `;
        }

        return `
            <table class="payroll-table">
                <thead>
                    <tr>
                        <th>Periode</th>
                        <th>Mulai</th>
                        <th>Selesai</th>
                        <th>Status</th>
                        <th>Gaji/Jam</th>
                        <th>Karyawan</th>
                        <th>Total Gaji</th>
                        <th>Sudah Bayar</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${periods.map(period => this.renderPeriodRow(period)).join('')}
                </tbody>
            </table>
            <button class="btn btn-primary" onclick="Payroll.openCreatePeriodModal()">
                📝 Buat Periode Baru
            </button>
        `;
    },

    // Render single period row
    renderPeriodRow(period) {
        const statusColors = {
            draft: 'var(--warning-color)',
            calculated: 'var(--info-color)',
            paid: 'var(--success-color)'
        };

        return `
            <tr>
                <td><strong>${period.period_name}</strong></td>
                <td>${this.formatDate(period.start_date)}</td>
                <td>${this.formatDate(period.end_date)}</td>
                <td>
                    <span class="status-badge" style="background: ${statusColors[period.status]}">
                        ${this.formatStatus(period.status)}
                    </span>
                </td>
                <td>Rp ${this.formatNumber(period.hourly_rate)}</td>
                <td>${period.employee_count || '-'}</td>
                <td>Rp ${this.formatNumber(period.total_pay || 0)}</td>
                <td>Rp ${this.formatNumber(period.total_paid || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.viewPeriod('${period.id}')">
                        👁️ Lihat Detail
                    </button>
                </td>
            </tr>
        `;
    },

    // Create new payroll period modal
    openCreatePeriodModal() {
        document.getElementById('createPeriodModal').classList.add('active');
    },

    closeCreatePeriodModal() {
        document.getElementById('createPeriodModal').classList.remove('active');
        document.getElementById('createPeriodForm').reset();
    },

    // Save new period
    async createPeriod() {
        const form = document.getElementById('createPeriodForm');
        const formData = new FormData(form);

        const periodData = {
            period_name: formData.get('periodName'),
            start_date: formData.get('startDate'),
            end_date: formData.get('endDate'),
            hourly_rate: formData.get('hourlyRate') || 6000
        };

        // Validation
        if (!periodData.period_name || !periodData.start_date || !periodData.end_date) {
            App.showToast('Nama periode, tanggal mulai, dan tanggal selesai wajib diisi!', 'error');
            return;
        }

        try {
            App.showLoading('Membuat periode pembayaran...');

            const response = await API.request('/payroll/periods', {
                method: 'POST',
                body: JSON.stringify(periodData)
            });

            App.hideLoading();

            if (response.success) {
                App.showToast('Periode pembayaran berhasil dibuat!', 'success');
                this.closeCreatePeriodModal();
                this.loadPeriods();
            } else {
                App.showToast(response.error || 'Gagal membuat periode pembayaran', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // View payroll period details
    async viewPeriod(periodId) {
        this.currentPeriodId = periodId;

        try {
            App.showLoading('Memuat detail periode pembayaran...');

            // Get period info
            const periodResponse = await API.request(`/payroll/periods/${periodId}`, {
                method: 'GET'
            });

            // Get payroll details
            const detailsResponse = await API.request('/payroll/details', {
                method: 'GET',
                query: `period_id=${periodId}`
            });

            App.hideLoading();

            if (!periodResponse.success || !detailsResponse.success) {
                App.showToast('Gagal memuat detail periode pembayaran', 'error');
                return;
            }

            const period = periodResponse.data;
            const details = detailsResponse.data;

            this.calculations = details;

            // Update summary cards
            this.updatePayrollSummary(period, details);

            // Show details section
            document.getElementById('payrollDetailsSection').style.display = 'block';
            document.getElementById('payrollDetailsTableBody').innerHTML = details.map(emp => this.renderDetailRow(emp)).join('');

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // Update summary cards
    updatePayrollSummary(period, details) {
        // Calculate totals
        const totalEmployees = details.length;
        const totalHours = details.reduce((sum, d) => sum + (d.total_work_hours || 0), 0);
        const totalRegularPay = details.reduce((sum, d) => sum + (d.regular_pay || 0), 0);
        const totalOvertimePay = details.reduce((sum, d) => sum + (d.overtime_pay || 0), 0);
        const totalPay = details.reduce((sum, d) => sum + (d.total_pay || 0), 0);
        const totalPaid = details.reduce((sum, d) => sum + (d.total_pay || 0) * (d.payment_status === 'paid' ? 1 : 0), 0);

        // Update summary cards
        document.getElementById('totalEmployees').textContent = totalEmployees;
        document.getElementById('totalHours').textContent = this.formatNumber(totalHours);
        document.getElementById('totalRegularPay').textContent = 'Rp ' + this.formatNumber(totalRegularPay);
        document.getElementById('totalOvertimePay').textContent = 'Rp ' + this.formatNumber(totalOvertimePay);
        document.getElementById('totalPay').textContent = 'Rp ' + this.formatNumber(totalPay);
        document.getElementById('totalPaid').textContent = 'Rp ' + this.formatNumber(totalPaid);
        document.getElementById('pendingPayment').textContent = 'Rp ' + this.formatNumber(totalPay - totalPaid);
    },

    // Render detail row
    renderDetailRow(detail) {
        const statusColors = {
            pending: 'var(--warning-color)',
            paid: 'var(--success-color)'
        };

        return `
            <tr>
                <td><strong>${detail.employee_name}</strong></td>
                <td>${detail.employee_id}</td>
                <td>${detail.work_days} hari</td>
                <td>${this.formatNumber(detail.total_work_hours)} jam</td>
                <td>${this.formatNumber(detail.regular_hours)} jam</td>
                <td>${this.formatNumber(detail.overtime_hours)} jam</td>
                <td>${this.formatNumber(detail.paid_hours)} jam</td>
                <td>Rp ${this.formatNumber(detail.regular_pay)}</td>
                <td>Rp ${this.formatNumber(detail.overtime_pay)}</td>
                <td>Rp ${this.formatNumber(detail.total_pay)}</td>
                <td>
                    <span class="status-badge" style="background: ${statusColors[detail.payment_status]}">
                        ${this.formatPaymentStatus(detail.payment_status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.recordPayment('${detail.id}')">
                        💾 Bayar
                    </button>
                </td>
            </tr>
        `;
    },

    // Record payment
    async recordPayment(payrollDetailId) {
        try {
            App.showLoading('Merekam pembayaran...');

            const paymentData = {
                payroll_detail_id: payrollDetailId,
                payment_method: 'cash',
                payment_reference: 'PAY-' + Date.now(),
                amount_paid: document.getElementById('paymentAmount').value,
                payment_date: document.getElementById('paymentDate').value,
                receipt_url: document.getElementById('receiptUrl').value || ''
            };

            // Validation
            if (!paymentData.amount_paid) {
                App.showToast('Jumlah pembayaran wajib diisi!', 'error');
                return;
            }

            const response = await API.request('/payroll/payments', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });

            App.hideLoading();

            if (response.success) {
                App.showToast('Pembayaran berhasil direkam!', 'success');
                this.closePaymentModal();
                if (this.currentPeriodId) {
                    this.viewPeriod(this.currentPeriodId);
                }
            } else {
                App.showToast(response.error || 'Gagal merekam pembayaran', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // Open payment modal
    openPaymentModal(payrollDetailId) {
        const detail = this.calculations.find(c => c.id === payrollDetailId);

        if (!detail) {
            App.showToast('Data tidak ditemukan', 'error');
            return;
        }

        document.getElementById('paymentDetailId').value = payrollDetailId;
        document.getElementById('paymentEmployeeName').textContent = detail.employee_name;
        document.getElementById('paymentAmount').value = detail.total_pay;
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('paymentModal').classList.add('active');
    },

    // Close payment modal
    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('active');
    },

    // Calculate payroll
    async calculatePayroll() {
        if (!this.currentPeriodId) {
            App.showToast('Pilih periode pembayaran terlebih dahulu!', 'error');
            return;
        }

        try {
            App.showLoading('Menghitung gaji...');

            const response = await API.request('/payroll/calculate', {
                method: 'POST',
                body: JSON.stringify({ period_id: this.currentPeriodId })
            });

            App.hideLoading();

            if (response.success) {
                App.showToast('Gaji berhasil dihitung!', 'success');
                this.viewPeriod(this.currentPeriodId);
            } else {
                App.showToast(response.error || 'Gagal menghitung gaji', 'error');
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // Export payroll summary
    async exportPayroll() {
        if (!this.currentPeriodId) {
            App.showToast('Pilih periode pembayaran terlebih dahulu!', 'error');
            return;
        }

        try {
            const response = await API.request('/payroll/summary', {
                method: 'GET',
                query: `period_id=${this.currentPeriodId}`
            });

            if (response.success) {
                this.downloadCSV(response.data, `Payroll_${response.data.period_name}`);
            } else {
                App.showToast(response.error || 'Gagal mengeksport data', 'error');
            }
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    // Download CSV
    downloadCSV(data, filename) {
        const headers = ['Nama Karyawan', 'ID Karyawan', 'Email', 'Hari Kerja', 'Total Jam', 'Jam Regular', 'Jam Lembur', 'Jam Dibayar', 'Gaji Regular', 'Gaji Lembur', 'Total Gaji', 'Status Pembayaran'];

        const rows = data.map(detail => [
            detail.employee_name,
            detail.employee_id,
            detail.email || '',
            detail.work_days,
            detail.total_work_hours,
            detail.regular_hours,
            detail.overtime_hours,
            detail.paid_hours,
            detail.regular_pay,
            detail.overtime_pay,
            detail.total_pay,
            this.formatPaymentStatus(detail.payment_status)
        ]);

        // Add header
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    // Format helpers
    formatNumber(num) {
        return parseFloat(num || 0).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatStatus(status) {
        const statusMap = {
            draft: 'Draft',
            calculated: 'Terhitung',
            paid: 'Sudah Bayar',
            pending: 'Pending'
        };
        return statusMap[status] || status;
    },

    formatPaymentStatus(status) {
        const statusMap = {
            pending: 'Menunggu',
            paid: 'Sudah Bayar'
        };
        return statusMap[status] || status;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    Payroll.init();
});