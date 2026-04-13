/* ===========================================
   CB Bikes — Chart.js Helpers
   =========================================== */

const ChartColors = {
    primary: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    accent: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    navy: '#0F1C3F',
    surface: '#F8FAFC',
    gridLine: '#E2E8F0',
    text: '#475569',
};

// Track active chart instances so we can destroy before re-rendering
const _chartInstances = {};

function destroyChart(canvasId) {
    if (_chartInstances[canvasId]) {
        _chartInstances[canvasId].destroy();
        delete _chartInstances[canvasId];
    }
}

function _defaults() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: { family: 'Inter', size: 12 },
                    color: ChartColors.text,
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: {
                backgroundColor: ChartColors.navy,
                titleFont: { family: 'Inter', size: 13, weight: '600' },
                bodyFont: { family: 'JetBrains Mono', size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 4,
            },
        },
    };
}

function createBarChart(canvasId, labels, data, label, colors) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const colorSet = colors || ChartColors.primary;
    const bgColors = labels.map((_, i) => colorSet[i % colorSet.length]);
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: bgColors,
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 48,
            }],
        },
        options: {
            ..._defaults(),
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: ChartColors.text },
                },
                y: {
                    grid: { color: ChartColors.gridLine, drawBorder: false },
                    ticks: {
                        font: { family: 'JetBrains Mono', size: 11 },
                        color: ChartColors.text,
                        callback: (v) => typeof v === 'number' && v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : v,
                    },
                },
            },
            plugins: {
                ..._defaults().plugins,
                legend: { display: false },
            },
        },
    });
    _chartInstances[canvasId] = chart;
    return chart;
}

function createDonutChart(canvasId, labels, data, colors) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const colorSet = colors || ChartColors.accent;
    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: labels.map((_, i) => colorSet[i % colorSet.length]),
                borderWidth: 2,
                borderColor: '#FFFFFF',
                hoverOffset: 6,
            }],
        },
        options: {
            ..._defaults(),
            cutout: '65%',
            plugins: {
                ..._defaults().plugins,
                legend: {
                    ..._defaults().plugins.legend,
                    position: 'bottom',
                },
            },
        },
    });
    _chartInstances[canvasId] = chart;
    return chart;
}

function createLineChart(canvasId, labels, data, label, color) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const lineColor = color || ChartColors.primary[0];
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: lineColor,
                backgroundColor: lineColor + '1A',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: lineColor,
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
            }],
        },
        options: {
            ..._defaults(),
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: ChartColors.text },
                },
                y: {
                    grid: { color: ChartColors.gridLine, drawBorder: false },
                    ticks: {
                        font: { family: 'JetBrains Mono', size: 11 },
                        color: ChartColors.text,
                    },
                },
            },
        },
    });
    _chartInstances[canvasId] = chart;
    return chart;
}

function createHorizontalBarChart(canvasId, labels, data, label, colors) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const colorSet = colors || ChartColors.accent;
    const bgColors = labels.map((_, i) => colorSet[i % colorSet.length]);
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: bgColors,
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            ..._defaults(),
            indexAxis: 'y',
            scales: {
                x: {
                    grid: { color: ChartColors.gridLine, drawBorder: false },
                    ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: ChartColors.text },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: ChartColors.text },
                },
            },
            plugins: {
                ..._defaults().plugins,
                legend: { display: false },
            },
        },
    });
    _chartInstances[canvasId] = chart;
    return chart;
}
