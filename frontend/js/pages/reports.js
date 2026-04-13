/* ===========================================
   CB Bikes — Reports Page
   =========================================== */

async function renderReports(container) {
    let reportsList;
    try {
        reportsList = await API.get('reports');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    const reportsJson = escapeAttr(JSON.stringify(reportsList));

    container.innerHTML = `
        <div x-data="reportsPage()" x-init="reports = ${reportsJson}">
            <div class="section-header">
                <div>
                    <h1 class="section-title">Reports</h1>
                    <p class="section-subtitle">Pre-built queries and analytics</p>
                </div>
            </div>

            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Report Sidebar -->
                <div class="w-full lg:w-64 shrink-0">
                    <template x-for="cat in categories()" :key="cat">
                        <div class="mb-4">
                            <h3 class="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2 px-2" x-text="cat"></h3>
                            <ul>
                                <template x-for="r in reportsByCategory(cat)" :key="r.id">
                                    <li>
                                        <button
                                            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                            :class="selectedReport?.id === r.id ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-gray-50'"
                                            @click="selectReport(r)"
                                            x-text="r.name"
                                        ></button>
                                    </li>
                                </template>
                            </ul>
                        </div>
                    </template>
                </div>

                <!-- Report Content -->
                <div class="flex-1 min-w-0">
                    <template x-if="!selectedReport">
                        ${emptyStateHTML('Select a report', 'Choose a report from the sidebar to view results')}
                    </template>

                    <template x-if="selectedReport">
                        <div>
                            <div class="card">
                                <div class="card-header">
                                    <span x-text="selectedReport.name"></span>
                                    <span class="text-xs text-text-muted" x-text="selectedReport.description"></span>
                                </div>

                                <!-- Report Tabs -->
                                <div class="px-4 pt-3">
                                    <div class="tab-nav" style="margin-bottom: 0;">
                                        <button class="tab-btn" :class="reportTab === 'results' ? 'active' : ''" @click="reportTab = 'results'">Results</button>
                                        <button class="tab-btn" :class="reportTab === 'sql' ? 'active' : ''" @click="reportTab = 'sql'">SQL</button>
                                        <button class="tab-btn" :class="reportTab === 'chart' ? 'active' : ''" @click="reportTab = 'chart'" x-show="selectedReport.chart_type">Chart</button>
                                    </div>
                                </div>

                                <!-- Results Tab -->
                                <div class="card-body-flush" x-show="reportTab === 'results'">
                                    <div x-show="loading" class="p-8">
                                        <div class="loading-spinner-container"><div class="loading-spinner"></div></div>
                                    </div>
                                    <div x-show="!loading && reportData.length > 0">
                                        <div class="overflow-x-auto">
                                            <table class="data-table">
                                                <thead>
                                                    <tr>
                                                        <template x-for="col in reportColumns()" :key="col">
                                                            <th x-text="formatColumnName(col)"></th>
                                                        </template>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <template x-for="(row, idx) in reportData" :key="idx">
                                                        <tr>
                                                            <template x-for="col in reportColumns()" :key="col">
                                                                <td x-text="formatCell(row[col], col)"></td>
                                                            </template>
                                                        </tr>
                                                    </template>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div x-show="!loading && reportData.length === 0" class="p-8">
                                        ${emptyStateHTML('No results', 'This report returned no data')}
                                    </div>
                                </div>

                                <!-- SQL Tab -->
                                <div class="card-body" x-show="reportTab === 'sql'">
                                    <div class="flex justify-end mb-2">
                                        <button class="copy-btn" @click="copySql()">
                                            <span x-text="copied ? 'Copied!' : 'Copy'"></span>
                                        </button>
                                    </div>
                                    <div class="sql-code-block" x-html="highlightReportSql()"></div>
                                </div>

                                <!-- Chart Tab -->
                                <div class="card-body" x-show="reportTab === 'chart' && selectedReport?.chart_type">
                                    <div class="chart-container" style="height: 320px;">
                                        <canvas id="chart-report"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    `;
}

function reportsPage() {
    return {
        reports: [],
        selectedReport: null,
        reportTab: 'results',
        reportData: [],
        reportSql: '',
        loading: false,
        copied: false,

        categories() {
            const cats = [...new Set(this.reports.map(r => r.category))];
            return cats.sort();
        },

        reportsByCategory(cat) {
            return this.reports.filter(r => r.category === cat);
        },

        async selectReport(report) {
            this.selectedReport = report;
            this.reportTab = 'results';
            this.loading = true;
            this.reportData = [];
            this.reportSql = '';
            try {
                const result = await API.get(`reports/${report.id}`);
                this.reportData = result.data || [];
                this.reportSql = result.sql || '';
                // Render chart if applicable
                if (report.chart_type && this.reportData.length) {
                    this.$nextTick(() => this.renderReportChart());
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        reportColumns() {
            if (!this.reportData.length) return [];
            return Object.keys(this.reportData[0]);
        },

        formatColumnName(col) {
            return col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        },

        formatCell(value, col) {
            if (value == null) return '--';
            const lower = col.toLowerCase();
            if (lower.includes('revenue') || lower.includes('total') || lower.includes('price') ||
                lower.includes('msrp') || lower.includes('cost') || lower.includes('salary') ||
                lower.includes('fee') || lower.includes('amount')) {
                return formatCurrency(value);
            }
            if (lower.includes('rate') || lower.includes('margin') || lower.includes('percent')) {
                return typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value;
            }
            if (lower.includes('date') && typeof value === 'string' && value.includes('-')) {
                return formatDate(value);
            }
            return String(value);
        },

        highlightReportSql() {
            return SqlConsole._highlightSQL(this.reportSql);
        },

        async copySql() {
            try {
                await navigator.clipboard.writeText(this.reportSql);
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
            } catch {
                showToast('Failed to copy', 'error');
            }
        },

        renderReportChart() {
            if (!this.selectedReport?.chart_type || !this.reportData.length) return;
            const cols = Object.keys(this.reportData[0]);
            const labelCol = cols[0];
            const dataCol = cols.find(c => typeof this.reportData[0][c] === 'number') || cols[1];
            const labels = this.reportData.map(r => String(r[labelCol]));
            const data = this.reportData.map(r => r[dataCol]);

            switch (this.selectedReport.chart_type) {
                case 'bar':
                    createBarChart('chart-report', labels, data, this.formatColumnName(dataCol));
                    break;
                case 'donut':
                case 'doughnut':
                case 'pie':
                    createDonutChart('chart-report', labels, data);
                    break;
                case 'line':
                    createLineChart('chart-report', labels, data, this.formatColumnName(dataCol));
                    break;
                case 'horizontal_bar':
                    createHorizontalBarChart('chart-report', labels, data, this.formatColumnName(dataCol));
                    break;
                default:
                    createBarChart('chart-report', labels, data, this.formatColumnName(dataCol));
            }
        },
    };
}
