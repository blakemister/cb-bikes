/* ===========================================
   CB Bikes — Dashboard Page
   =========================================== */

async function renderDashboard(container) {
    let data;
    try {
        data = await API.get('dashboard');
    } catch (err) {
        container.innerHTML = errorStateHTML('Could not load dashboard. Is the database running?');
        return;
    }

    const kpis = data.kpis || {};
    const revenueByLocation = data.revenue_by_location || [];
    const revenueByType = data.revenue_by_product_type || [];
    const recentSales = data.recent_sales || [];

    container.innerHTML = `
        <div class="section-header">
            <div>
                <h1 class="section-title">Dashboard</h1>
                <p class="section-subtitle">Business overview at a glance</p>
            </div>
        </div>

        <!-- KPI Strip -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            ${kpiCard('Total Revenue', formatCurrency(kpis.total_revenue))}
            ${kpiCard('Active Customers', formatNumber(kpis.active_customers))}
            ${kpiCard('Products', formatNumber(kpis.total_products))}
            ${kpiCard('Total Sales', formatNumber(kpis.total_sales))}
            ${kpiCard('Bike Week Participants', formatNumber(kpis.bike_week_participants), true)}
            ${kpiCard('Avg Sale Value', formatCurrency(kpis.avg_sale_value))}
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="card">
                <div class="card-header">Revenue by Location</div>
                <div class="card-body">
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="chart-revenue-location"></canvas>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">Revenue by Product Type</div>
                <div class="card-body">
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="chart-revenue-type"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Sales -->
        <div class="card">
            <div class="card-header">Recent Sales</div>
            <div class="card-body-flush">
                ${recentSales.length ? `
                    <div class="table-wrap" style="border: none; border-radius: 0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Employee</th>
                                    <th>Location</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentSales.map(s => `
                                    <tr>
                                        <td>${formatDate(s.sale_date)}</td>
                                        <td class="font-medium">${escapeHtml(s.customer_name)}</td>
                                        <td>${escapeHtml(s.employee_name)}</td>
                                        <td>${escapeHtml(s.location_name)}</td>
                                        <td class="text-right font-mono font-semibold">${formatCurrency(s.total)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : emptyStateHTML('No sales yet', 'Create a sale to see it here')}
            </div>
        </div>
    `;

    // Render charts
    if (revenueByLocation.length) {
        createBarChart(
            'chart-revenue-location',
            revenueByLocation.map(r => r.location_name),
            revenueByLocation.map(r => r.revenue),
            'Revenue'
        );
    }
    if (revenueByType.length) {
        createDonutChart(
            'chart-revenue-type',
            revenueByType.map(r => r.product_type),
            revenueByType.map(r => r.revenue)
        );
    }
}

function kpiCard(label, value, isWarning = false) {
    return `
        <div class="kpi-card ${isWarning ? 'kpi-warning' : ''}">
            <div class="kpi-value">${value}</div>
            <div class="kpi-label">${escapeHtml(label)}</div>
        </div>
    `;
}
