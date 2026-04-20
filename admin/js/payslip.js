// Slip Gaji / Payslip Module
const Payslip = {
    hourlyRate: 6000,
    breakHours: 1,
    roundingUnit: 1000,
    currentSlipData: null,

    async load() {
        await this.loadEmployeesForSlip();
        this.setDefaultPeriod();
    },

    setDefaultPeriod() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        const startInput = document.getElementById('slipStartDate');
        const endInput = document.getElementById('slipEndDate');

        if (startInput && !startInput.value) startInput.value = monthStart;
        if (endInput && !endInput.value) endInput.value = todayStr;
    },

    async loadEmployeesForSlip() {
        const select = document.getElementById('slipEmployeeId');
        if (!select || select.options.length > 1) return;

        try {
            const response = await API.getEmployees();
            if (response.success) {
                const employees = response.data
                    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
                employees.forEach(emp => {
                    const opt = document.createElement('option');
                    opt.value = emp.employee_id;
                    opt.textContent = `${emp.employee_name} (${emp.employee_id})`;
                    select.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Failed to load employees for payslip:', error);
        }
    },

    calculateIncentive(record) {
        if (!record.checkin_time || !record.checkout_time) {
            return { workHours: 0, incentive: 0 };
        }

        const checkin = new Date(record.checkin_time);
        const checkout = new Date(record.checkout_time);
        const rawHours = (checkout - checkin) / (1000 * 60 * 60);

        if (!Number.isFinite(rawHours) || rawHours <= 0) {
            return { workHours: 0, incentive: 0 };
        }

        // Check checkout hour for break hours and deduction
        const checkoutHour = checkout.getHours();
        let breakHours = 0;
        let incentiveDeduction = 0;

        // Incentive deduction based on checkout time
        if (checkoutHour < 1) {
            // Checkout before 1:00 AM → Rp.3000 deduction
            incentiveDeduction = 3000;
        } else if (checkoutHour >= 2) {
            // Checkout at/after 2:00 AM → Rp.6000 deduction
            incentiveDeduction = 6000;
        } else {
            // Checkout between 1:00 AM and 2:00 AM → no deduction
            incentiveDeduction = 0;
        }

        const netHours = Math.max(0, rawHours - breakHours);
        const rawIncentive = netHours * this.hourlyRate;
        let incentive = Math.round(rawIncentive / this.roundingUnit) * this.roundingUnit;

        // Apply incentive deduction if applicable
        if (incentiveDeduction > 0) {
            incentive = Math.max(0, incentive - incentiveDeduction);
        }

        return { workHours: netHours, incentive };
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

    formatReportDate(value) {
        const date = new Date(value);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    },

    formatPeriode(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const fmt = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        return `${fmt.format(s)} s/d ${fmt.format(e)}`;
    },

    async generateSlip() {
        const employeeId = document.getElementById('slipEmployeeId')?.value;
        const startDate = document.getElementById('slipStartDate')?.value;
        const endDate = document.getElementById('slipEndDate')?.value;

        if (!employeeId) {
            App.showToast('Pilih karyawan terlebih dahulu', 'warning');
            return;
        }
        if (!startDate || !endDate) {
            App.showToast('Pilih periode gaji (tanggal awal & akhir)', 'warning');
            return;
        }
        if (startDate > endDate) {
            App.showToast('Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'warning');
            return;
        }

        try {
            App.showLoading('Membuat slip insentif...');

            // Fetch attendance records for this employee
            const response = await API.getAttendance({
                employeeId,
                startDate,
                endDate,
                limit: 1000
            });

            App.hideLoading();

            if (!response.success) {
                throw new Error(response.error || 'Gagal memuat data absensi');
            }

            // Get employee name from dropdown
            const select = document.getElementById('slipEmployeeId');
            const selectedOption = select.options[select.selectedIndex];
            const employeeName = selectedOption.textContent.replace(` (${employeeId})`, '');

            // Group records by date
            const dailyGroups = new Map();
            response.data.forEach(r => {
                const date = r.timestamp.split('T')[0];
                const existing = dailyGroups.get(date) || {
                    date,
                    checkin: null,
                    checkout: null
                };
                if (r.type === 'checkin') existing.checkin = r.timestamp;
                else if (r.type === 'checkout') existing.checkout = r.timestamp;
                dailyGroups.set(date, existing);
            });

            const sortedDays = Array.from(dailyGroups.values())
                .sort((a, b) => a.date.localeCompare(b.date));

            // Calculate incentives per day
            const slipRows = sortedDays.map(day => {
                const calc = this.calculateIncentive({
                    checkin_time: day.checkin,
                    checkout_time: day.checkout
                });
                return {
                    date: day.date,
                    checkin: day.checkin,
                    checkout: day.checkout,
                    workHours: calc.workHours,
                    incentive: calc.incentive
                };
            });

            const totalIncentive = slipRows.reduce((sum, r) => sum + r.incentive, 0);
            const totalHours = slipRows.reduce((sum, r) => sum + r.workHours, 0);

            this.currentSlipData = {
                employeeId,
                employeeName,
                startDate,
                endDate,
                rows: slipRows,
                totalIncentive,
                totalHours
            };

            this.renderSlipPreview();
            App.showToast('Slip insentif berhasil dibuat', 'success');

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    renderSlipPreview() {
        const container = document.getElementById('slipPreviewContainer');
        if (!this.currentSlipData) {
            container.innerHTML = '<p class="empty-state">Pilih karyawan dan periode gaji, lalu klik "Buat Slip"</p>';
            return;
        }

        const d = this.currentSlipData;
        const periode = this.formatPeriode(d.startDate, d.endDate);

        const bodyRows = d.rows.map(row => {
            const dateStr = this.formatReportDate(row.date);
            const checkin = row.checkin ? API.formatTime(row.checkin) : '-';
            const checkout = row.checkout ? API.formatTime(row.checkout) : '-';
            const hours = row.workHours > 0 ? row.workHours.toFixed(2) : '-';
            const incentive = row.incentive > 0 ? `Rp ${this.formatNumber(row.incentive)}` : '-';

            return `
                <tr>
                    <td>${dateStr}</td>
                    <td class="text-center">${checkin}</td>
                    <td class="text-center">${checkout}</td>
                    <td class="text-center">${hours}</td>
                    <td class="text-right">${incentive}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="slip-insentif" id="slipPrintArea">
                <div class="slip-header">
                    <img src="/admin/img/kop-surat.png" alt="Kop Surat" style="width: 100%; height: auto; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
                </div>

                <h3 class="slip-title">SLIP INSENTIF</h3>

                <div class="slip-meta">
                    <div class="slip-meta-row">
                        <span class="slip-meta-label">Periode Gaji</span>
                        <span class="slip-meta-sep">:</span>
                        <span class="slip-meta-value">${periode}</span>
                    </div>
                    <ul class="slip-meta-list">
                        <li>
                            <span class="slip-meta-label">Nama</span>
                            <span class="slip-meta-sep">:</span>
                            <span class="slip-meta-value">${d.employeeName}</span>
                        </li>
                        <li>
                            <span class="slip-meta-label">ID Karyawan</span>
                            <span class="slip-meta-sep">:</span>
                            <span class="slip-meta-value">${d.employeeId}</span>
                        </li>
                    </ul>
                </div>

                <div class="slip-table-container">
                    <table class="slip-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Masuk</th>
                                <th>Keluar</th>
                                <th>Jumlah Jam</th>
                                <th>Insentif</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                            <tr class="slip-total-row">
                                <td colspan="4"><strong>Total Insentif:</strong></td>
                                <td class="text-right"><strong>Rp ${this.formatNumber(d.totalIncentive)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="slip-summary">
                    <div class="slip-summary-item">
                        <span class="slip-summary-label">Total Jam Kerja</span>
                        <span class="slip-summary-value">${d.totalHours.toFixed(2)} jam</span>
                    </div>
                    <div class="slip-summary-item highlight">
                        <span class="slip-summary-label">Total Insentif</span>
                        <span class="slip-summary-value">${this.formatCurrency(d.totalIncentive)}</span>
                    </div>
                </div>

                <div class="slip-footer">
                    <div class="slip-signature">
                        <p>Penerima</p>
                        <div class="slip-sign-space"></div>
                        <p class="slip-sign-name">( ${d.employeeName} )</p>
                    </div>
                </div>
            </div>
        `;
    },

    async printSlip() {
        if (!this.currentSlipData) {
            App.showToast('Buat slip insentif terlebih dahulu', 'warning');
            return;
        }

        const d = this.currentSlipData;
        const periode = this.formatPeriode(d.startDate, d.endDate);

        try {
            App.showLoading('Membuat PDF slip insentif...');

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
            doc.setFontSize(16);
            doc.text('SLIP INSENTIF', pageWidth / 2, cursorY, { align: 'center' });

            // Metadata
            cursorY += 12;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const metaLabelX = margin;
            const metaSepX = margin + 32;
            const metaValueX = margin + 36;

            doc.text('ID Karyawan', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(d.employeeId, metaValueX, cursorY);

            cursorY += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Nama', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.text(d.employeeName, metaValueX, cursorY);

            cursorY += 7;
            doc.text('Periode Gaji', metaLabelX, cursorY);
            doc.text(':', metaSepX, cursorY);
            doc.setFont('helvetica', 'normal');
            doc.text(periode, metaValueX, cursorY);

            // Table
            cursorY += 8;
            const tableBody = d.rows.map(row => {
                const dateStr = this.formatReportDate(row.date);
                const checkin = row.checkin ? API.formatTime(row.checkin) : '-';
                const checkout = row.checkout ? API.formatTime(row.checkout) : '-';
                const hours = row.workHours > 0 ? row.workHours.toFixed(2) : '-';
                const incentive = row.incentive > 0 ? `Rp ${this.formatNumber(row.incentive)}` : '-';
                return [dateStr, checkin, checkout, hours, incentive];
            });

            // Add total row
            tableBody.push([
                { content: 'Total Insentif:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `Rp ${this.formatNumber(d.totalIncentive)}`, styles: { halign: 'right', fontStyle: 'bold' } }
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['Tanggal', 'Masuk', 'Keluar', 'Jumlah Jam', 'Insentif']],
                body: tableBody,
                margin: { left: margin, right: margin },
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'right' }
                },
                theme: 'grid',
            });

            // Signature
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('Penerima,', margin, finalY);
            doc.setFont('helvetica', 'bold');
            doc.text(`( ${d.employeeName} )`, margin, finalY + 30);

            // Save PDF
            doc.save(`Slip-Insentif-${d.employeeName.replace(/\s+/g, '-')}.pdf`);

            App.hideLoading();
            App.showToast('PDF slip insentif berhasil diunduh', 'success');

        } catch (error) {
            App.hideLoading();
            console.error('PDF generation error:', error);
            App.showToast('Gagal membuat PDF: ' + error.message, 'error');
        }
    },

    // Helper: load image as base64
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


    async generateAllSlips() {
        const startDate = document.getElementById('slipStartDate')?.value;
        const endDate = document.getElementById('slipEndDate')?.value;

        if (!startDate || !endDate) {
            App.showToast('Pilih periode gaji terlebih dahulu', 'warning');
            return;
        }

        try {
            App.showLoading('Memuat data semua karyawan...');

            const empResponse = await API.getEmployees();
            if (!empResponse.success) throw new Error('Gagal memuat data karyawan');

            const employees = empResponse.data.filter(e => e.is_active !== false);
            const container = document.getElementById('slipPreviewContainer');
            container.innerHTML = '';

            let processedCount = 0;

            for (const emp of employees) {
                const attResponse = await API.getAttendance({
                    employeeId: emp.employee_id,
                    startDate,
                    endDate,
                    limit: 1000
                });

                if (!attResponse.success || !attResponse.data.length) continue;

                // Group records by date
                const dailyGroups = new Map();
                attResponse.data.forEach(r => {
                    const date = r.timestamp.split('T')[0];
                    const existing = dailyGroups.get(date) || {
                        date,
                        checkin: null,
                        checkout: null
                    };
                    if (r.type === 'checkin') existing.checkin = r.timestamp;
                    else if (r.type === 'checkout') existing.checkout = r.timestamp;
                    dailyGroups.set(date, existing);
                });

                const sortedDays = Array.from(dailyGroups.values())
                    .sort((a, b) => a.date.localeCompare(b.date));

                const slipRows = sortedDays.map(day => {
                    const calc = this.calculateIncentive({
                        checkin_time: day.checkin,
                        checkout_time: day.checkout
                    });
                    return {
                        date: day.date,
                        checkin: day.checkin,
                        checkout: day.checkout,
                        workHours: calc.workHours,
                        incentive: calc.incentive
                    };
                });

                const totalIncentive = slipRows.reduce((sum, r) => sum + r.incentive, 0);
                if (totalIncentive <= 0) continue;

                processedCount++;

                this.currentSlipData = {
                    employeeId: emp.employee_id,
                    employeeName: emp.employee_name,
                    startDate,
                    endDate,
                    rows: slipRows,
                    totalIncentive,
                    totalHours: slipRows.reduce((sum, r) => sum + r.workHours, 0)
                };

                // Append each slip
                const slipDiv = document.createElement('div');
                slipDiv.style.marginBottom = '32px';
                container.appendChild(slipDiv);

                const d = this.currentSlipData;
                const periode = this.formatPeriode(d.startDate, d.endDate);

                const bodyRows = d.rows.map(row => {
                    const dateStr = this.formatReportDate(row.date);
                    const checkin = row.checkin ? API.formatTime(row.checkin) : '-';
                    const checkout = row.checkout ? API.formatTime(row.checkout) : '-';
                    const hours = row.workHours > 0 ? row.workHours.toFixed(2) : '-';
                    const incentive = row.incentive > 0 ? `Rp ${this.formatNumber(row.incentive)}` : '-';
                    return `
                        <tr>
                            <td>${dateStr}</td>
                            <td class="text-center">${checkin}</td>
                            <td class="text-center">${checkout}</td>
                            <td class="text-center">${hours}</td>
                            <td class="text-right">${incentive}</td>
                        </tr>
                    `;
                }).join('');

                slipDiv.innerHTML = `
                    <div class="slip-insentif">
                        <div class="slip-header">
                            <img src="/admin/img/kop-surat.png" alt="Kop Surat" style="width: 100%; height: auto; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
                        </div>
                        <h3 class="slip-title">SLIP INSENTIF</h3>
                        <div class="slip-meta">
                            <div class="slip-meta-row">
                                <span class="slip-meta-label">Periode Gaji</span>
                                <span class="slip-meta-sep">:</span>
                                <span class="slip-meta-value">${periode}</span>
                            </div>
                            <ul class="slip-meta-list">
                                <li><span class="slip-meta-label">Nama</span><span class="slip-meta-sep">:</span><span class="slip-meta-value">${d.employeeName}</span></li>
                                <li><span class="slip-meta-label">ID Karyawan</span><span class="slip-meta-sep">:</span><span class="slip-meta-value">${d.employeeId}</span></li>
                            </ul>
                        </div>
                        <div class="slip-table-container">
                            <table class="slip-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Masuk</th>
                                        <th>Keluar</th>
                                        <th>Jumlah Jam</th>
                                        <th>Insentif</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bodyRows}
                                    <tr class="slip-total-row">
                                        <td colspan="4"><strong>Total Insentif:</strong></td>
                                        <td class="text-right"><strong>Rp ${this.formatNumber(d.totalIncentive)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="slip-footer">
                            <div class="slip-signature">
                                <p>Penerima</p>
                                <div class="slip-sign-space"></div>
                                <p class="slip-sign-name">( ${d.employeeName} )</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            App.hideLoading();

            if (processedCount === 0) {
                container.innerHTML = '<p class="empty-state">Tidak ada data insentif pada periode tersebut.</p>';
            } else {
                App.showToast(`${processedCount} slip insentif berhasil dibuat`, 'success');
            }

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    },

    // Render a single mini slip onto a jsPDF doc at given position
    renderMiniSlipToPdf(doc, d, periode, x, y, slipW, slipH) {
        const margin = 5;
        const innerW = slipW - margin * 2;
        const startX = x + margin;
        let curY = y + margin;

        // Dashed border for cutting guide
        doc.setDrawColor(150);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(x, y, slipW, slipH);
        doc.setLineDashPattern([], 0);

        // Clean title separator line
        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.line(startX, curY, startX + innerW, curY);
        curY += 4;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('SLIP INSENTIF', x + slipW / 2, curY, { align: 'center' });
        curY += 4;

        // Metadata
        doc.setFontSize(6);
        const lblX = startX;
        const sepX = startX + 14;
        const valX = startX + 17;

        doc.setFont('helvetica', 'bold');
        doc.text('ID', lblX, curY);
        doc.text(':', sepX, curY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(d.employeeId), valX, curY);
        curY += 3;

        doc.setFont('helvetica', 'bold');
        doc.text('Nama', lblX, curY);
        doc.text(':', sepX, curY);
        doc.text(String(d.employeeName), valX, curY);
        curY += 3;

        doc.setFont('helvetica', 'bold');
        doc.text('Periode', lblX, curY);
        doc.text(':', sepX, curY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(periode), valX, curY);
        curY += 3;

        // Table
        const tableBody = d.rows.map(row => {
            const dateStr = new Date(row.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
            const checkin = row.checkin ? API.formatTime(row.checkin) : '-';
            const checkout = row.checkout ? API.formatTime(row.checkout) : '-';
            const hours = row.workHours > 0 ? row.workHours.toFixed(1) : '-';
            const incentive = row.incentive > 0 ? 'Rp ' + this.formatNumber(row.incentive) : '-';
            return [dateStr, checkin, checkout, hours, incentive];
        });

        tableBody.push([
            { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: 'Rp ' + this.formatNumber(d.totalIncentive), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);

        doc.autoTable({
            startY: curY,
            head: [['Tgl', 'Masuk', 'Keluar', 'Jam', 'Insentif']],
            body: tableBody,
            margin: { left: startX, right: doc.internal.pageSize.getWidth() - (startX + innerW) },
            tableWidth: innerW,
            styles: { fontSize: 5.5, cellPadding: 0.8, lineColor: [100, 100, 100], lineWidth: 0.12 },
            headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 5.5 },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' }
            },
            theme: 'grid',
            pageBreak: 'avoid',
            rowPageBreak: 'avoid'
        });

        // Signature
        const sigY = doc.lastAutoTable.finalY + 3;
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Penerima,', startX, sigY);
        doc.setFont('helvetica', 'bold');
        doc.text('( ' + d.employeeName + ' )', startX, Math.min(sigY + 12, y + slipH - margin));
    },

    async printAllSlips() {
        const startDate = document.getElementById('slipStartDate')?.value;
        const endDate = document.getElementById('slipEndDate')?.value;

        if (!startDate || !endDate) {
            App.showToast('Pilih periode gaji terlebih dahulu', 'warning');
            return;
        }

        try {
            App.showLoading('Mengumpulkan data semua karyawan...');

            const empResponse = await API.getEmployees();
            if (!empResponse.success) throw new Error('Gagal memuat data karyawan');

            const employees = empResponse.data
                .filter(e => e.is_active !== false)
                .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

            const allSlipsData = [];
            const periode = this.formatPeriode(startDate, endDate);

            for (const emp of employees) {
                const attResponse = await API.getAttendance({
                    employeeId: emp.employee_id,
                    startDate,
                    endDate,
                    limit: 1000
                });

                if (!attResponse.success || !attResponse.data.length) continue;

                const dailyGroups = new Map();
                attResponse.data.forEach(r => {
                    const date = r.timestamp.split('T')[0];
                    const existing = dailyGroups.get(date) || { date, checkin: null, checkout: null };
                    if (r.type === 'checkin') existing.checkin = r.timestamp;
                    else if (r.type === 'checkout') existing.checkout = r.timestamp;
                    dailyGroups.set(date, existing);
                });

                const sortedDays = Array.from(dailyGroups.values())
                    .sort((a, b) => a.date.localeCompare(b.date));

                const slipRows = sortedDays.map(day => {
                    const calc = this.calculateIncentive({
                        checkin_time: day.checkin,
                        checkout_time: day.checkout
                    });
                    return { date: day.date, checkin: day.checkin, checkout: day.checkout, workHours: calc.workHours, incentive: calc.incentive };
                });

                const totalIncentive = slipRows.reduce((sum, r) => sum + r.incentive, 0);
                if (totalIncentive <= 0) continue;

                allSlipsData.push({
                    employeeId: emp.employee_id,
                    employeeName: emp.employee_name,
                    rows: slipRows,
                    totalIncentive,
                    totalHours: slipRows.reduce((sum, r) => sum + r.workHours, 0)
                });
            }

            if (allSlipsData.length === 0) {
                App.hideLoading();
                App.showToast('Tidak ada data insentif pada periode tersebut', 'warning');
                return;
            }

            App.showLoading('Membuat PDF ' + allSlipsData.length + ' slip insentif...');

            const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const pageMargin = 8;
            const gap = 8; // Increased gap for better cutting space
            const slipsPerPage = 4;

            // Calculate dimensions for 4 vertical slips per page
            const slipW = pageW - pageMargin * 2;
            const slipH = (pageH - pageMargin * 2 - (slipsPerPage - 1) * gap) / slipsPerPage;

            // Generate 4 vertical positions with proper spacing
            const positions = [];
            for (let i = 0; i < slipsPerPage; i++) {
                positions.push({
                    x: pageMargin,
                    y: pageMargin + i * (slipH + gap)
                });
            }

            for (let i = 0; i < allSlipsData.length; i++) {
                const posIdx = i % slipsPerPage;
                if (i > 0 && posIdx === 0) {
                    doc.addPage();
                }
                const pos = positions[posIdx];
                this.renderMiniSlipToPdf(doc, allSlipsData[i], periode, pos.x, pos.y, slipW, slipH);
            }

            doc.save('Slip-Insentif-Semua-' + startDate + '_' + endDate + '.pdf');

            App.hideLoading();
            App.showToast(allSlipsData.length + ' slip berhasil diunduh sebagai PDF (' + Math.ceil(allSlipsData.length / 4) + ' halaman)', 'success');

        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
        }
    }
};
