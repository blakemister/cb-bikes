/* ===========================================
   CB Bikes — Employees Page
   =========================================== */

async function renderEmployees(container) {
    let employees;
    try {
        employees = await API.get('employees');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    // Group by location
    const byLocation = {};
    for (const emp of employees) {
        const loc = emp.location_name || 'Unknown';
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(emp);
    }

    const sections = Object.entries(byLocation).map(([location, emps]) => `
        <div class="card mb-6">
            <div class="card-header">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    ${escapeHtml(location)}
                </div>
                <span class="text-xs text-text-muted">${emps.length} employee${emps.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-body-flush">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Compensation</th>
                            <th>Skills</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${emps.map(e => `
                            <tr>
                                <td class="font-medium">${escapeHtml(e.first_name + ' ' + e.last_name)}</td>
                                <td>
                                    <span class="badge badge-${e.employee_type}">${escapeHtml(e.employee_type)}</span>
                                </td>
                                <td class="font-mono text-sm">
                                    ${e.employee_type === 'Retail'
                                        ? (e.commission_rate != null ? (e.commission_rate * 100).toFixed(0) + '% commission' : '--')
                                        : (e.salary != null ? formatCurrency(e.salary) + '/yr' : '--')
                                    }
                                </td>
                                <td>
                                    <div class="flex flex-wrap gap-1">
                                        ${(e.skills || []).map(s =>
                                            `<span class="badge badge-gray">${escapeHtml(s)}</span>`
                                        ).join('')}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <h1 class="section-title">Employees</h1>
                <p class="section-subtitle">${employees.length} employees across ${Object.keys(byLocation).length} locations</p>
            </div>
        </div>
        ${sections}
    `;
}
