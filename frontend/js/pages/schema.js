/* ===========================================
   CB Bikes — Schema Viewer Page
   =========================================== */

async function renderSchema(container) {
    let schema;
    try {
        schema = await API.get('schema');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    // Group tables by category
    const categoryMap = {
        'Customer Domain': ['Customer', 'CustomerEmail', 'CustomerPhone', 'CustomerCyclingType'],
        'Product Catalog': ['Product', 'Bike', 'Clothing', 'Part', 'Service', 'ServicePart', 'Supplier'],
        'Employees & Locations': ['Employee', 'EmployeeSkill', 'Location', 'Shareholder'],
        'Sales & Service': ['Sale', 'SaleLineItem', 'ServiceRecord'],
        'Junior Bike Week': ['Event', 'RaceEvent', 'RecreationalEvent', 'Guardian', 'Participant', 'EventRegistration', 'RaceResult', 'BikeWeekDiscount'],
    };

    // Build a lookup for quick access
    const tableLookup = {};
    for (const t of (schema.tables || schema)) {
        tableLookup[t.table_name] = t;
    }

    const sections = Object.entries(categoryMap).map(([category, tableNames]) => {
        const tables = tableNames.map(name => tableLookup[name]).filter(Boolean);
        if (tables.length === 0) return '';

        return `
            <div class="mb-8">
                <h2 class="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">${escapeHtml(category)}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    ${tables.map(t => schemaTableCard(t)).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Any uncategorized tables
    const allCategorized = new Set(Object.values(categoryMap).flat());
    const uncategorized = (schema.tables || schema).filter(t => !allCategorized.has(t.table_name));
    const uncatSection = uncategorized.length ? `
        <div class="mb-8">
            <h2 class="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Other Tables</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                ${uncategorized.map(t => schemaTableCard(t)).join('')}
            </div>
        </div>
    ` : '';

    container.innerHTML = `
        <div x-data="{ expanded: {} }">
            <div class="section-header">
                <div>
                    <h1 class="section-title">Schema Viewer</h1>
                    <p class="section-subtitle">${(schema.tables || schema).length} tables in the CBBikes database</p>
                </div>
            </div>
            ${sections}
            ${uncatSection}
        </div>
    `;
}

function schemaTableCard(table) {
    const columns = table.columns || [];
    const pkCols = columns.filter(c => c.is_pk);
    const fkCols = columns.filter(c => c.is_fk);

    return `
        <div class="schema-table-card">
            <button
                class="w-full text-left px-4 py-3 flex items-center justify-between"
                @click="expanded['${table.table_name}'] = !expanded['${table.table_name}']"
            >
                <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    <span class="font-mono font-semibold text-sm">${escapeHtml(table.table_name)}</span>
                </div>
                <div class="flex items-center gap-3">
                    ${table.row_count != null ? `<span class="text-xs text-text-muted font-mono">${table.row_count} rows</span>` : ''}
                    <svg
                        class="w-4 h-4 text-text-muted transition-transform"
                        :class="expanded['${table.table_name}'] ? 'rotate-180' : ''"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </button>
            <div
                x-show="expanded['${table.table_name}']"
                x-transition
                class="border-t border-gray-100"
            >
                <table class="w-full text-xs">
                    <thead>
                        <tr class="text-left">
                            <th class="px-4 py-2 text-text-muted font-medium uppercase" style="font-size: 10px;">Column</th>
                            <th class="px-4 py-2 text-text-muted font-medium uppercase" style="font-size: 10px;">Type</th>
                            <th class="px-4 py-2 text-text-muted font-medium uppercase text-center" style="font-size: 10px;">Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${columns.map(col => `
                            <tr class="border-t border-gray-100/50">
                                <td class="px-4 py-1.5 font-mono ${col.is_pk ? 'schema-col-pk' : col.is_fk ? 'schema-col-fk' : 'text-text-primary'}"
                                    ${col.is_fk && col.fk_table ? `title="FK -> ${escapeHtml(col.fk_table)}.${escapeHtml(col.fk_column || '')}" @click="scrollToTable('${escapeHtml(col.fk_table)}')"` : ''}
                                >
                                    ${escapeHtml(col.column_name)}
                                </td>
                                <td class="px-4 py-1.5 text-text-secondary font-mono">${escapeHtml(col.data_type)}</td>
                                <td class="px-4 py-1.5 text-center">
                                    ${col.is_pk ? '<span class="text-warning font-bold" title="Primary Key">PK</span>' : ''}
                                    ${col.is_fk ? '<span class="text-accent font-bold" title="Foreign Key">FK</span>' : ''}
                                    ${col.nullable === false && !col.is_pk ? '<span class="text-danger text-[9px]" title="NOT NULL">NN</span>' : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
