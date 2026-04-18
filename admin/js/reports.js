// Reports
const Reports = {
    hourlyRate: 6000,
    breakHours: 1,
    roundingUnit: 1000,

    async showDailyReport() {
        const date = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = date;
        this.initializeRangeFilters();
        await this.generateDailyReport();
    },
    async showWeeklyReport() {
        App.showToast('Laporan mingguan belum tersedia', 'warning');
    },
    async showMonthlyReport() {
        App.showToast('Laporan bulanan belum tersedia', 'warning');
    },
    async generateDailyReport() {
        const date = document.getElementById('reportDate').value;
        if (!date) return App.showToast('Pilih tanggal', 'warning');
        try {
            App.showLoading('Memuat laporan...');
            const response = await API.getDailyReport(date);
            App.hideLoading();
            if (response.success) {
                this.currentReport = response;
                this.displayDailyReport(response);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    calculateIncentive(record) {
        if (!record.checkin_time || !record.checkout_time) {
            return {
                workHours: 0,
                incentive: 0
            };
        }

        const checkin = new Date(record.checkin_time);
        const checkout = new Date(record.checkout_time);
        const rawHours = (checkout - checkin) / (1000 * 60 * 60);

        if (!Number.isFinite(rawHours) || rawHours <= 0) {
            return {
                workHours: 0,
                incentive: 0
            };
        }

        const netHours = Math.max(0, rawHours - this.breakHours);
        const rawIncentive = netHours * this.hourlyRate;
        const incentive = Math.round(rawIncentive / this.roundingUnit) * this.roundingUnit;

        return {
            workHours: netHours,
            incentive
        };
    },
    formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(value);
    },
    formatNumber(value) {
        return new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0
        }).format(value);
    },
    toSafeNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    },
    formatReportDate(value) {
        const date = new Date(value);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    },
    async initializeRangeFilters() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

        const startInput = document.getElementById('reportStartDate');
        const endInput = document.getElementById('reportEndDate');

        if (startInput && !startInput.value) {
            startInput.value = monthStart;
        }

        if (endInput && !endInput.value) {
            endInput.value = todayString;
        }

        // Load employees for filter
        await this.loadEmployeesForFilter();
    },
    async loadEmployeesForFilter() {
        const select = document.getElementById('reportEmployeeId');
        if (!select || select.options.length > 1) return;

        try {
            const response = await API.getEmployees();
            if (response.success) {
                const employees = response.data.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
                employees.forEach(emp => {
                    const opt = document.createElement('option');
                    opt.value = emp.employee_id;
                    opt.textContent = `${emp.employee_name} (${emp.employee_id})`;
                    select.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Failed to load employees for report filter:', error);
        }
    },
    renderPaperReport(report, incentiveRows) {
        const reportDate = this.formatReportDate(report.date);
        const year = new Date(report.date).getFullYear();
        const totalIncentive = incentiveRows.reduce((sum, row) => sum + row.incentive, 0);
        const sortedRows = [...incentiveRows].sort((a, b) => (a.employee_name || '').localeCompare(b.employee_name || ''));

        const bodyRows = Array.from({ length: 20 }).map((_, index) => {
            const row = sortedRows[index];
            if (!row) {
                return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                `;
            }

            const checkin = row.checkin_time ? API.formatTime(row.checkin_time) : '';
            const checkout = row.checkout_time ? API.formatTime(row.checkout_time) : '';
            const workHours = this.toSafeNumber(row.workHours);
            const incentiveValue = this.toSafeNumber(row.incentive);
            const hours = workHours > 0 ? workHours.toFixed(2) : '';
            const incentive = incentiveValue > 0 ? this.formatNumber(incentiveValue) : '';

            return `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${row.employee_name || ''}</td>
                    <td class="text-center">${checkin}</td>
                    <td class="text-center">${checkout}</td>
                    <td class="text-center">${hours}</td>
                    <td class="text-right">${incentive}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }).join('');

        return `
            <div class="paper-report">
                <div class="paper-header">
                    <img src="/admin/img/kop-surat.png" alt="Kop Surat" style="width: 100%; height: auto; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">
                </div>

                <h4 class="paper-title">DAFTAR HADIR KARYAWAN HARIAN</h4>
                <p class="paper-subtitle">UNIT SUPLAYER SAYURAN</p>

                <div class="paper-meta">
                    <div class="meta-row">
                        <span class="meta-label">Tanggal</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">${reportDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Outlet</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">Unit Suplayer Sayuran</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Jenis Pekerjaan</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">-</span>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table paper-table">
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>NAMA</th>
                                <th>JAM MASUK</th>
                                <th>JAM SELESAI</th>
                                <th>JUMLAH JAM KERJA</th>
                                <th>INSENTIF</th>
                                <th>TTD</th>
                                <th>KET</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                            <tr class="paper-total-row">
                                <td colspan="5" class="text-right"><strong>JUMLAH:</strong></td>
                                <td class="text-right"><strong>${this.formatNumber(totalIncentive)}</strong></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="paper-signature">
                    <p>Cianjur, ${year}</p>
                    <p class="paper-sign-name">(UIANG RUKMANA)</p>
                    <p>Ketua KOMP Sindangjaya</p>
                </div>
            </div>
        `;
    },
    renderRangePaperReport(report) {
        const range = report.range || {};
        const startDate = range.startDate ? this.formatReportDate(range.startDate) : '-';
        const endDate = range.endDate ? this.formatReportDate(range.endDate) : '-';
        const totals = {
            days: 0,
            checkins: 0,
            checkouts: 0,
            overtimes: 0,
            uniqueEmployees: 0,
            totalWorkHours: 0,
            totalIncentive: 0
        };
        Object.assign(totals, report.totals || {});

        const dailyRows = (report.data || []).map((row, index) => `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${row.date || ''}</td>
                <td class="text-center">${this.toSafeNumber(row.checkins)}</td>
                <td class="text-center">${this.toSafeNumber(row.checkouts)}</td>
                <td class="text-center">${this.toSafeNumber(row.overtimes)}</td>
                <td class="text-center">${this.toSafeNumber(row.uniqueEmployees)}</td>
                <td class="text-center">${this.toSafeNumber(row.departments)}</td>
            </tr>
        `).join('') || `
            <tr><td colspan="7" class="text-center">Tidak ada data.</td></tr>
        `;

        const paymentByEmployee = new Map(
            (report.paymentDetails || []).map((row) => [row.employeeId, row])
        );

        const employeeRows = (report.employeeRecap || []).map((row, index) => `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${row.employeeName || ''}</td>
                <td>${row.department || '-'}</td>
                <td class="text-center">${this.toSafeNumber(row.attendanceDays)}</td>
                <td class="text-center">${this.toSafeNumber(row.overtimeDays)}</td>
                <td class="text-center">${this.toSafeNumber(row.completedDays)}</td>
                <td class="text-center">${this.toSafeNumber(paymentByEmployee.get(row.employeeId)?.workHours).toFixed(2)}</td>
                <td class="text-right">${this.formatNumber(this.toSafeNumber(paymentByEmployee.get(row.employeeId)?.incentive))}</td>
                <td>${row.status || '-'}</td>
            </tr>
        `).join('') || `
            <tr><td colspan="8" class="text-center">Tidak ada data.</td></tr>
        `;

        return `
            <div class="paper-report range-paper-report">
                <div class="paper-header">
                    <img src="/admin/img/kop-surat.png" alt="Kop Surat" style="width: 100%; height: auto; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">
                </div>

                <h4 class="paper-title">REKAP PERIODE ABSENSI</h4>
                <p class="paper-subtitle">UNIT SUPLAYER SAYURAN</p>

                <div class="paper-meta">
                    <div class="meta-row">
                        <span class="meta-label">Periode</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value"><strong>${startDate} s/d ${endDate}</strong></span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Hari Tercatat</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">${this.toSafeNumber(totals.days)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Total Pembayaran</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">${this.formatCurrency(this.toSafeNumber(totals.totalIncentive))}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Total Jam Kerja</span>
                        <span class="meta-sep">:</span>
                        <span class="meta-value">${this.toSafeNumber(totals.totalWorkHours).toFixed(2)} jam</span>
                    </div>
                </div>

                <h5 class="paper-section-title">Rekap Harian</h5>
                <div class="table-container">
                    <table class="data-table paper-table">
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>TANGGAL</th>
                                <th>MASUK</th>
                                <th>KELUAR</th>
                                <th>LEMBUR</th>
                                <th>HADIR</th>
                                <th>DEPT</th>
                            </tr>
                        </thead>
                        <tbody>${dailyRows}</tbody>
                    </table>
                </div>

                <h5 class="paper-section-title">Rekap Insentif Per Nama</h5>
                <div class="table-container">
                    <table class="data-table paper-table">
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>NAMA</th>
                                <th>DEPARTEMEN</th>
                                <th>HADIR</th>
                                <th>LEMBUR</th>
                                <th>LENGKAP</th>
                                <th>JAM KERJA</th>
                                <th>INSENTIF</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>${employeeRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    },
    renderReportStats(report, incentiveRows) {
        const statsContainer = document.getElementById('dailyReportStats');
        const totalWorkHours = incentiveRows.reduce((sum, row) => sum + this.toSafeNumber(row.workHours), 0);
        const totalIncentive = incentiveRows.reduce((sum, row) => sum + this.toSafeNumber(row.incentive), 0);

        statsContainer.innerHTML = `
            <div class="report-stat">
                <div class="report-stat-value">${report.data.length}</div>
                <div class="report-stat-label">Karyawan Tercatat</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totalWorkHours.toFixed(2)} jam</div>
                <div class="report-stat-label">Total Jam Kerja Bersih</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${this.formatCurrency(totalIncentive)}</div>
                <div class="report-stat-label">Total Insentif</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${this.formatCurrency(this.hourlyRate)}</div>
                <div class="report-stat-label">Tarif per Jam</div>
            </div>
        `;
    },
    displayDailyReport(report) {
        const container = document.getElementById('dailyReportContent');
        if (!report.data || !report.data.length) {
            container.innerHTML = '<p class="empty-state">Tidak ada data</p>';
            document.getElementById('dailyReportStats').innerHTML = '';
            return;
        }

        const incentiveRows = report.data.map(emp => ({
            ...emp,
            ...this.calculateIncentive(emp)
        }));

        this.renderReportStats(report, incentiveRows);

        container.innerHTML = this.renderPaperReport(report, incentiveRows);
    },
    renderRangeStats(report) {
        const statsContainer = document.getElementById('rangeReportStats');
        const totals = {
            days: 0,
            checkins: 0,
            checkouts: 0,
            overtimes: 0,
            uniqueEmployees: 0,
            paymentEmployees: 0,
            totalWorkHours: 0,
            totalIncentive: 0
        };
        Object.assign(totals, report.totals || {});
        totals.totalWorkHours = this.toSafeNumber(totals.totalWorkHours);
        totals.totalIncentive = this.toSafeNumber(totals.totalIncentive);

        statsContainer.innerHTML = `
            <div class="report-stat">
                <div class="report-stat-value">${totals.days}</div>
                <div class="report-stat-label">Hari Tercatat</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.checkins}</div>
                <div class="report-stat-label">Total Masuk</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.checkouts}</div>
                <div class="report-stat-label">Total Keluar</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.overtimes}</div>
                <div class="report-stat-label">Total Lembur</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.uniqueEmployees}</div>
                <div class="report-stat-label">Akumulasi Hadir</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${totals.totalWorkHours.toFixed(2)} jam</div>
                <div class="report-stat-label">Total Jam Kerja</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${this.formatCurrency(totals.totalIncentive)}</div>
                <div class="report-stat-label">Total Pembayaran</div>
            </div>
        `;
    },
    displayRangeReport(report) {
        const tableBody = document.getElementById('rangeReportTableBody');
        const employeeRecapBody = document.getElementById('rangeEmployeeRecapTableBody');
        const rows = report.data || [];
        const employeeRows = report.employeeRecap || [];
        const paymentRows = report.paymentDetails || [];

        this.renderRangeStats(report);

        if (!rows.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data pada rentang tanggal tersebut.</td></tr>';
        } else {
            tableBody.innerHTML = rows.map((row) => `
                <tr>
                    <td>${row.date}</td>
                    <td>${row.checkins}</td>
                    <td>${row.checkouts}</td>
                    <td>${row.overtimes}</td>
                    <td>${row.uniqueEmployees}</td>
                    <td>${row.departments}</td>
                </tr>
            `).join('');
        }

        const paymentByEmployee = new Map(
            paymentRows.map((row) => [row.employeeId, row])
        );

        if (!employeeRows.length) {
            employeeRecapBody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada rekap insentif per nama pada rentang tanggal tersebut.</td></tr>';
        } else {
            employeeRecapBody.innerHTML = employeeRows.map((row) => {
                const payment = paymentByEmployee.get(row.employeeId);
                const escapedName = row.employeeName.replace(/'/g, "\\'");
                return `
                    <tr>
                        <td><strong>${row.employeeName}</strong></td>
                        <td>${row.department || '-'}</td>
                        <td class="text-center">${row.attendanceDays}</td>
                        <td class="text-center">${row.overtimeDays}</td>
                        <td class="text-center">${row.completedDays}</td>
                        <td class="text-center">${this.toSafeNumber(payment?.workHours).toFixed(2)} jam</td>
                        <td class="text-right"><strong>${this.formatCurrency(this.toSafeNumber(payment?.incentive))}</strong></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="Reports.showEmployeeDetail('${row.employeeId}', '${escapedName}')">
                                Detail
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },
    async generateRangeReport() {
        this.initializeRangeFilters();

        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;
        const employeeId = document.getElementById('reportEmployeeId')?.value;

        if (!startDate || !endDate) {
            App.showToast('Pilih tanggal awal dan akhir', 'warning');
            return;
        }

        if (startDate > endDate) {
            App.showToast('Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'warning');
            return;
        }

        try {
            App.showLoading('Memuat rekap periode...');
            const response = await API.getRangeReport(startDate, endDate, employeeId);
            App.hideLoading();

            if (!response.success) {
                throw new Error(response.error || 'Gagal memuat rekap periode');
            }

            this.currentRangeReport = response;
            this.displayRangeReport(response);
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    async showEmployeeDetail(employeeId, employeeName) {
        if (!this.currentRangeReport) return;
        
        const startDate = this.currentRangeReport.range.startDate;
        const endDate = this.currentRangeReport.range.endDate;

        try {
            App.showLoading('Memuat rincian...');
            // We fetch specific attendance records for this employee in this range
            const response = await API.getAttendance({ 
                employeeId, 
                startDate, 
                endDate, 
                limit: 1000 
            });
            App.hideLoading();

            if (response.success) {
                this.displayEmployeeDetailModal(employeeId, employeeName, response.data);
            }
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },
    displayEmployeeDetailModal(employeeId, employeeName, records) {
        const modal = document.getElementById('detailReportModal');
        const header = document.getElementById('detailReportHeader');
        const tbody = document.getElementById('detailReportTableBody');

        // Group records by date
        const dailyGroups = new Map();
        records.forEach(r => {
            const date = r.timestamp.split('T')[0];
            const existing = dailyGroups.get(date) || {
                date,
                checkin: null,
                checkout: null,
                overtime: null
            };
            if (r.type === 'checkin') existing.checkin = r.timestamp;
            else if (r.type === 'checkout') existing.checkout = r.timestamp;
            else if (r.type === 'overtime') existing.overtime = r.timestamp;
            dailyGroups.set(date, existing);
        });

        const sortedDays = Array.from(dailyGroups.values()).sort((a, b) => a.date.localeCompare(b.date));
        let totalHours = 0;
        let totalIncentive = 0;

        const rowsHtml = sortedDays.map(day => {
            const calc = this.calculateIncentive({
                checkin_time: day.checkin,
                checkout_time: day.checkout
            });
            
            totalHours += calc.workHours;
            totalIncentive += calc.incentive;

            return `
                <tr>
                    <td>${day.date}</td>
                    <td class="text-center">${day.checkin ? API.formatTime(day.checkin) : '-'}</td>
                    <td class="text-center">${day.checkout ? API.formatTime(day.checkout) : '-'}</td>
                    <td class="text-center">${day.overtime ? API.formatTime(day.overtime) : '-'}</td>
                    <td class="text-center">${calc.workHours.toFixed(2)}</td>
                    <td class="text-right">${this.formatNumber(calc.incentive)}</td>
                </tr>
            `;
        }).join('');

        header.innerHTML = `
            <div class="detail-info">
                <p><strong>Nama:</strong> ${employeeName}</p>
                <p><strong>ID:</strong> ${employeeId}</p>
                <p><strong>Periode:</strong> ${this.formatReportDate(this.currentRangeReport.range.startDate)} - ${this.formatReportDate(this.currentRangeReport.range.endDate)}</p>
                <div class="detail-totals">
                    <div class="detail-total-item">
                        <span class="label">Total Jam:</span>
                        <span class="value">${totalHours.toFixed(2)} jam</span>
                    </div>
                    <div class="detail-total-item">
                        <span class="label">Total Insentif:</span>
                        <span class="value">${this.formatCurrency(totalIncentive)}</span>
                    </div>
                </div>
            </div>
        `;

        tbody.innerHTML = rowsHtml || '<tr><td colspan="6" class="text-center">Tidak ada rincian data.</td></tr>';
        
        // Store current detail for printing
        this.currentEmployeeDetail = {
            employeeId,
            employeeName,
            totalHours,
            totalIncentive,
            days: sortedDays
        };

        modal.classList.add('active');
    },
    closeDetailModal() {
        document.getElementById('detailReportModal').classList.remove('active');
    },
    async printIndividualReport() {
        const detail = this.currentEmployeeDetail;
        if (!detail) return;

        try {
            App.showLoading('Membuat PDF laporan insentif...');

            const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF library is not loaded. Please check your internet connection and refresh the page.');
            }
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Setup page
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let cursorY = 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('RINCIAN INSENTIF KARYAWAN', pageWidth / 2, cursorY, { align: 'center' });

            // Metadata
            cursorY += 12;
            doc.setFontSize(11);
            const metaLabelX = margin;
            const metaSepX = margin + 30;
            const metaValueX = margin + 34;

            doc.setFont('helvetica', 'bold');
            doc.text('Nama', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.text(detail.employeeName, metaValueX, cursorY);

            cursorY += 7;
            doc.text('ID Karyawan', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(detail.employeeId, metaValueX, cursorY);

            cursorY += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Periode', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.setFont('helvetica', 'normal');
            const periodeText = this.formatReportDate(this.currentRangeReport.range.startDate) + ' s/d ' + this.formatReportDate(this.currentRangeReport.range.endDate);
            doc.text(periodeText, metaValueX, cursorY);

            // Table
            cursorY += 10;
            const tableBody = detail.days.map((day, idx) => {
                const calc = this.calculateIncentive({
                    checkin_time: day.checkin,
                    checkout_time: day.checkout
                });
                return [
                    String(idx + 1),
                    this.formatReportDate(day.date),
                    day.checkin ? API.formatTime(day.checkin) : '-',
                    day.checkout ? API.formatTime(day.checkout) : '-',
                    calc.workHours.toFixed(2),
                    this.formatNumber(calc.incentive),
                    ''
                ];
            });

            tableBody.push([
                { content: 'JUMLAH TOTAL:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: detail.totalHours.toFixed(2), styles: { halign: 'center', fontStyle: 'bold' } },
                { content: this.formatNumber(detail.totalIncentive), styles: { halign: 'right', fontStyle: 'bold' } },
                ''
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['NO.', 'TANGGAL', 'JAM MASUK', 'JAM PULANG', 'JAM KERJA', 'INSENTIF', 'PARAIF']],
                body: tableBody,
                margin: { left: margin, right: margin },
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { halign: 'left' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'center', cellWidth: 20 }
                },
                theme: 'grid',
            });

            // Signature
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const sigX = pageWidth - margin - 55;
            doc.text('Cianjur, ' + new Date().getFullYear(), sigX, finalY);
            doc.text('( ________________ )', sigX, finalY + 30);
            doc.setFont('helvetica', 'bold');
            doc.text('Bagian Keuangan', sigX, finalY + 37);

            doc.save('Laporan-Insentif-' + detail.employeeName.replace(/\s+/g, '-') + '.pdf');

            App.hideLoading();
            App.showToast('PDF laporan insentif berhasil diunduh', 'success');

        } catch (error) {
            App.hideLoading();
            console.error('PDF generation error:', error);
            App.showToast('Gagal membuat PDF: ' + error.message, 'error');
        }
    },

    // Helper: load image as base64 for PDF generation
    loadImageAsBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    // Fallback jika canvas gagal (CORS issues)
                    console.warn('Canvas fallback failed, trying direct approach:', e);
                    // Create simple placeholder letterhead
                    const placeholderCanvas = document.createElement('canvas');
                    placeholderCanvas.width = 800;
                    placeholderCanvas.height = 100;
                    const placeholderCtx = placeholderCanvas.getContext('2d');
                    placeholderCtx.fillStyle = '#ffffff';
                    placeholderCtx.fillRect(0, 0, 800, 100);
                    placeholderCtx.fillStyle = '#333333';
                    placeholderCtx.font = 'bold 24px Arial';
                    placeholderCtx.textAlign = 'center';
                    placeholderCtx.fillText('KOP SURAT', 400, 50);
                    placeholderCtx.font = '14px Arial';
                    placeholderCtx.fillText('PT. ABSEN INDONESIA', 400, 75);
                    resolve(placeholderCanvas.toDataURL('image/png'));
                }
            };
            img.onerror = () => {
                // Fallback jika gambar tidak bisa dimuat
                console.warn('Image load failed, using placeholder letterhead');
                const placeholderCanvas = document.createElement('canvas');
                placeholderCanvas.width = 800;
                placeholderCanvas.height = 100;
                const placeholderCtx = placeholderCanvas.getContext('2d');
                placeholderCtx.fillStyle = '#ffffff';
                placeholderCtx.fillRect(0, 0, 800, 100);
                placeholderCtx.fillStyle = '#333333';
                placeholderCtx.font = 'bold 24px Arial';
                placeholderCtx.textAlign = 'center';
                placeholderCtx.fillText('KOP SURAT', 400, 50);
                placeholderCtx.font = '14px Arial';
                placeholderCtx.fillText('PT. ABSEN INDONESIA', 400, 75);
                resolve(placeholderCanvas.toDataURL('image/png'));
            };
            img.src = url;
        });
    },
    exportRangeReport() {
        const report = this.currentRangeReport;
        if (!report?.data?.length) {
            App.showToast('Tidak ada data rekap untuk diexport', 'warning');
            return;
        }

        const dailyRows = report.data || [];
        const employeeRows = report.employeeRecap || [];
        const paymentByEmployee = new Map(
            (report.paymentDetails || []).map((row) => [row.employeeId, row])
        );
        const maxRows = Math.max(dailyRows.length, employeeRows.length, 1);
        const exportRows = Array.from({ length: maxRows }, (_, index) => {
            const daily = dailyRows[index];
            const employee = employeeRows[index];
            const payment = employee ? paymentByEmployee.get(employee.employeeId) : null;

            return {
                Tanggal: daily?.date || '',
                Total_Masuk: daily?.checkins ?? '',
                Total_Keluar: daily?.checkouts ?? '',
                Total_Lembur: daily?.overtimes ?? '',
                Karyawan_Hadir: daily?.uniqueEmployees ?? '',
                Jumlah_Departemen: daily?.departments ?? '',
                Rekap_Karyawan: employee?.employeeName || '',
                Rekap_Departemen: employee?.department || '',
                Rekap_Hari_Hadir: employee?.attendanceDays ?? '',
                Rekap_Hari_Lembur: employee?.overtimeDays ?? '',
                Rekap_Hari_Lengkap: employee?.completedDays ?? '',
                Rekap_Jam_Kerja_Bersih: payment?.workHours != null ? this.toSafeNumber(payment.workHours).toFixed(2) : '',
                Rekap_Insentif: payment?.incentive != null ? this.toSafeNumber(payment.incentive) : '',
                Rekap_Status: employee?.status || '',
            };
        });

        const suffix = `${report.range?.startDate || 'awal'}_sd_${report.range?.endDate || 'akhir'}`;
        API.exportToXLSX(exportRows, `rekap-periode-${suffix}`, 'Rekap Periode');
        App.showToast('Rekap periode XLSX berhasil diunduh', 'success');
    },
    async printRangeRecap() {
        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;
        const employeeId = document.getElementById('reportEmployeeId')?.value;

        if (!startDate || !endDate) {
            App.showToast('Pilih tanggal awal dan akhir dulu', 'warning');
            return;
        }

        let report = this.currentRangeReport;
        const isDifferentRange = !report || report.range?.startDate !== startDate || report.range?.endDate !== endDate;

        if (isDifferentRange) {
            try {
                App.showLoading('Menyiapkan rekap periode...');
                const response = await API.getRangeReport(startDate, endDate, employeeId);
                App.hideLoading();
                if (!response.success) {
                    App.showToast('Gagal mengambil data rekap periode', 'error');
                    return;
                }
                report = response;
                this.currentRangeReport = response;
                this.displayRangeReport(response);
            } catch (error) {
                App.hideLoading();
                App.showToast(error.message || 'Gagal mengambil data rekap periode', 'error');
                return;
            }
        }

        try {
            App.showLoading('Membuat PDF rekap periode...');

            const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Setup page
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 10;
            let cursorY = 15;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('REKAP PERIODE ABSENSI', pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 5;
            doc.setFontSize(12);
            doc.text('UNIT SUPLAYER SAYURAN', pageWidth / 2, cursorY, { align: 'center' });

            // Metadata
            cursorY += 10;
            doc.setFontSize(10);
            const totals = report.totals || {};
            const leftColX = margin;
            const leftValX = margin + 35;
            const rightColX = pageWidth / 2 + 10;
            const rightValX = rightColX + 35;

            // Row 1
            doc.setFont('helvetica', 'bold');
            doc.text('Periode', leftColX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(`: ${this.formatReportDate(report.range.startDate)} s/d ${this.formatReportDate(report.range.endDate)}`, leftValX, cursorY);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Total Pembayaran', rightColX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(`: ${this.formatCurrency(this.toSafeNumber(totals.totalIncentive))}`, rightValX, cursorY);

            // Row 2
            cursorY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Hari Tercatat', leftColX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(`: ${this.toSafeNumber(totals.days)} hari`, leftValX, cursorY);

            doc.setFont('helvetica', 'bold');
            doc.text('Total Jam Kerja', rightColX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(`: ${this.toSafeNumber(totals.totalWorkHours).toFixed(2)} jam`, rightValX, cursorY);

            // Table 1: Rekap Harian
            cursorY += 10;
            doc.setFont('helvetica', 'bold');
            doc.text('1. Rekap Harian', margin, cursorY);
            cursorY += 2;

            const dailyTableData = (report.data || []).map((row, index) => [
                index + 1,
                row.date,
                row.checkins,
                row.checkouts,
                row.overtimes,
                row.uniqueEmployees,
                row.departments
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['NO.', 'TANGGAL', 'MASUK', 'KELUAR', 'LEMBUR', 'HADIR', 'DEPT']],
                body: dailyTableData,
                margin: { left: margin, right: margin },
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                theme: 'grid'
            });

            // Table 2: Rekap Per Nama
            cursorY = doc.lastAutoTable.finalY + 10;
            // Check if we need a new page
            if (cursorY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                cursorY = 20;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text('2. Rekap Insentif Per Nama', margin, cursorY);
            cursorY += 2;

            const paymentByEmployee = new Map((report.paymentDetails || []).map(r => [r.employeeId, r]));
            const employeeTableData = (report.employeeRecap || []).map((row, index) => {
                const p = paymentByEmployee.get(row.employeeId);
                return [
                    index + 1,
                    row.employeeName,
                    row.department || '-',
                    row.attendanceDays,
                    row.overtimeDays,
                    row.completedDays,
                    this.toSafeNumber(p?.workHours).toFixed(2),
                    this.formatNumber(this.toSafeNumber(p?.incentive)),
                    row.status || '-'
                ];
            });

            doc.autoTable({
                startY: cursorY,
                head: [['NO.', 'NAMA', 'DEPARTEMEN', 'HADIR', 'LEMBUR', 'LENGKAP', 'JAM KERJA', 'INSENTIF', 'STATUS']],
                body: employeeTableData,
                margin: { left: margin, right: margin },
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                theme: 'grid'
            });

            doc.save(`Rekap-Periode-${startDate}-sd-${endDate}.pdf`);
            App.hideLoading();
            App.showToast('PDF rekap periode berhasil diunduh', 'success');

        } catch (error) {
            App.hideLoading();
            console.error(error);
            App.showToast('Gagal membuat PDF: ' + error.message, 'error');
        }
    },
    async printDailyRecap() {
        const date = document.getElementById('reportDate').value;
        if (!date) {
            App.showToast('Pilih tanggal laporan dulu', 'warning');
            return;
        }

        let report = this.currentReport;
        if (!report || report.date !== date) {
            try {
                App.showLoading('Menyiapkan rekapan harian...');
                const response = await API.getDailyReport(date);
                App.hideLoading();
                if (!response.success) {
                    App.showToast('Gagal mengambil data laporan', 'error');
                    return;
                }
                report = response;
                this.currentReport = response;
                this.displayDailyReport(response);
            } catch (error) {
                App.hideLoading();
                App.showToast(error.message || 'Gagal mengambil data laporan', 'error');
                return;
            }
        }

        try {
            App.showLoading('Membuat PDF laporan harian...');

            const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Setup page
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let cursorY = 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('DAFTAR HADIR KARYAWAN HARIAN', pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 6;
            doc.text('UNIT SUPLAYER SAYURAN', pageWidth / 2, cursorY, { align: 'center' });

            // Meta
            cursorY += 12;
            doc.setFontSize(11);
            const labelX = margin;
            const sepX = margin + 35;
            const valX = margin + 38;

            doc.text('Tanggal', labelX, cursorY);
            doc.text(':', sepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(this.formatReportDate(report.date), valX, cursorY);

            cursorY += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Outlet', labelX, cursorY);
            doc.text(':', sepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text('Unit Suplayer Sayuran', valX, cursorY);

            cursorY += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Jenis Pekerjaan', labelX, cursorY);
            doc.text(':', sepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text('-', valX, cursorY);

            // Table
            cursorY += 10;
            const incentiveRows = report.data.map((emp) => ({
                ...emp,
                ...this.calculateIncentive(emp)
            }));
            const sortedRows = [...incentiveRows].sort((a, b) => (a.employee_name || '').localeCompare(b.employee_name || ''));
            const totalIncentive = incentiveRows.reduce((sum, row) => sum + row.incentive, 0);

            // Generate 20 rows (fixed as per original design)
            const tableBody = Array.from({ length: 20 }).map((_, idx) => {
                const row = sortedRows[idx];
                if (!row) return [idx + 1, '', '', '', '', '', '', ''];
                
                const calc = row;
                return [
                    idx + 1,
                    row.employee_name || '',
                    row.checkin_time ? API.formatTime(row.checkin_time) : '',
                    row.checkout_time ? API.formatTime(row.checkout_time) : '',
                    calc.workHours > 0 ? calc.workHours.toFixed(2) : '',
                    calc.incentive > 0 ? this.formatNumber(calc.incentive) : '',
                    '',
                    ''
                ];
            });

            tableBody.push([
                { content: 'JUMLAH:', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: this.formatNumber(totalIncentive), styles: { halign: 'right', fontStyle: 'bold' } },
                '',
                ''
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['NO.', 'NAMA', 'MASUK', 'SELESAI', 'JAM KERJA', 'INSENTIF', 'TTD', 'KET']],
                body: tableBody,
                margin: { left: margin, right: margin },
                styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1, lineColor: [0, 0, 0] },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'center', cellWidth: 20 },
                    7: { halign: 'center' }
                },
                theme: 'grid'
            });

            // Signature
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const sigX = pageWidth - margin - 60;
            doc.text(`Cianjur, ${new Date(report.date).getFullYear()}`, sigX, finalY);
            doc.setFont('helvetica', 'bold');
            doc.text('(UIANG RUKMANA)', sigX, finalY + 25);
            doc.setFontSize(10);
            doc.text('Ketua KOMP Sindangjaya', sigX, finalY + 30);

            doc.save(`Laporan-Harian-${report.date}.pdf`);
            App.hideLoading();
            App.showToast('PDF laporan harian berhasil diunduh', 'success');

        } catch (error) {
            App.hideLoading();
            console.error(error);
            App.showToast('Gagal membuat PDF: ' + error.message, 'error');
        }
    },
    exportReport() {
        if (!this.currentReport?.data) return App.showToast('Tidak ada data', 'warning');
        const date = document.getElementById('reportDate').value;
        const data = this.currentReport.data.map(emp => {
            const calc = this.calculateIncentive(emp);
            return ({
            ID: emp.employee_id,
            Nama: emp.employee_name,
            Departemen: emp.department || '-',
            Check_In: emp.checkin_time ? API.formatTime(emp.checkin_time) : '-',
            Check_Out: emp.checkout_time ? API.formatTime(emp.checkout_time) : '-',
            Jam_Kerja_Bersih: this.toSafeNumber(calc.workHours).toFixed(2),
            Tarif_Per_Jam: this.hourlyRate,
            Insentif_Bulat_Bawah: this.toSafeNumber(calc.incentive),
            Status: !emp.checkin_time && !emp.checkout_time ? 'Belum Absen' : emp.checkin_time && !emp.checkout_time ? 'Sudah Check-In' : 'Selesai'
        });
        });
        try {
            API.exportToXLSX(data, 'laporan-' + date, 'Laporan Harian');
            App.showToast('Laporan XLSX berhasil diunduh', 'success');
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    }
};

