/* ===========================================
   CB Bikes — Sales Page
   =========================================== */

async function renderSales(container) {
    let sales, lookups;
    try {
        [sales, lookups] = await Promise.all([
            API.get('sales'),
            API.get('sales/lookups'),
        ]);
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    const customersJson = escapeAttr(JSON.stringify(lookups.customers || []));
    const employeesJson = escapeAttr(JSON.stringify(lookups.employees || []));
    const locationsJson = escapeAttr(JSON.stringify(lookups.locations || []));
    const productsJson = escapeAttr(JSON.stringify(lookups.products || []));
    const salesJson = escapeAttr(JSON.stringify(sales));

    container.innerHTML = `
        <div x-data="salesPage()" x-init="initData(${salesJson}, ${customersJson}, ${employeesJson}, ${locationsJson}, ${productsJson})">
            <div class="section-header">
                <div>
                    <h1 class="section-title">Sales</h1>
                    <p class="section-subtitle" x-text="sales.length + ' total sales'"></p>
                </div>
                <button class="btn btn-primary" @click="showForm = !showForm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    New Sale
                </button>
            </div>

            <!-- New Sale Form -->
            <div class="card mb-6" x-show="showForm" x-transition>
                <div class="card-header">
                    Create Sale
                    <button @click="showForm = false" class="text-text-muted hover:text-text-primary">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="card-body">
                    <form @submit.prevent="createSale()">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label class="form-label">Customer *</label>
                                <select class="form-select" x-model="form.customer_id" required>
                                    <option value="">Select customer...</option>
                                    <template x-for="c in customersList" :key="c.id">
                                        <option :value="c.id" x-text="c.name"></option>
                                    </template>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">Employee *</label>
                                <select class="form-select" x-model="form.employee_id" required>
                                    <option value="">Select employee...</option>
                                    <template x-for="e in employeesList" :key="e.id">
                                        <option :value="e.id" x-text="e.name"></option>
                                    </template>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">Location *</label>
                                <select class="form-select" x-model="form.location_id" required>
                                    <option value="">Select location...</option>
                                    <template x-for="l in locationsList" :key="l.id">
                                        <option :value="l.id" x-text="l.name"></option>
                                    </template>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">Date *</label>
                                <input type="date" class="form-input" x-model="form.sale_date" required>
                            </div>
                        </div>

                        <!-- Line Items -->
                        <div class="mb-6">
                            <label class="form-label mb-3">Line Items</label>
                            <template x-for="(item, idx) in form.line_items" :key="idx">
                                <div class="flex gap-3 mb-3 items-end">
                                    <div class="flex-1">
                                        <label class="form-label text-xs" x-show="idx === 0">Product</label>
                                        <select class="form-select" x-model.number="item.product_id">
                                            <option value="0">Select product...</option>
                                            <template x-for="p in productsList" :key="p.id">
                                                <option :value="p.id" x-text="p.name + ' (' + formatCurrency(p.price) + ')'"></option>
                                            </template>
                                        </select>
                                    </div>
                                    <div style="width: 80px;">
                                        <label class="form-label text-xs" x-show="idx === 0">Qty</label>
                                        <input type="number" min="1" class="form-input text-center" x-model.number="item.quantity">
                                    </div>
                                    <div style="width: 100px;" class="text-right font-mono font-semibold pt-1" x-text="formatCurrency(lineTotal(item))"></div>
                                    <button type="button" class="btn btn-secondary btn-sm" @click="form.line_items.splice(idx, 1)" x-show="form.line_items.length > 1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                            </template>
                            <button type="button" class="btn btn-secondary btn-sm" @click="addLineItem()" x-show="form.line_items.length < 5">+ Add Item</button>
                        </div>

                        <!-- Running Total -->
                        <div class="flex items-center justify-between border-t border-gray-100 pt-4 mb-6">
                            <span class="text-sm font-medium text-text-secondary">Order Total</span>
                            <span class="running-total" x-text="formatCurrency(orderTotal())"></span>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button type="button" class="btn btn-secondary" @click="showForm = false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting || !isValid()">
                                <span x-show="!submitting">Create Sale</span>
                                <span x-show="submitting">Processing...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Sales Table -->
            <div class="card">
                <div class="card-body-flush">
                    <div class="table-wrap" style="border: none; border-radius: 0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th class="cursor-pointer" @click="sortBy('sale_date')">
                                        Date
                                        <span x-show="sortField === 'sale_date'" x-text="sortDir === 'asc' ? ' \\u2191' : ' \\u2193'"></span>
                                    </th>
                                    <th class="cursor-pointer" @click="sortBy('customer_name')">
                                        Customer
                                        <span x-show="sortField === 'customer_name'" x-text="sortDir === 'asc' ? ' \\u2191' : ' \\u2193'"></span>
                                    </th>
                                    <th>Employee</th>
                                    <th>Location</th>
                                    <th class="text-right cursor-pointer" @click="sortBy('total')">
                                        Total
                                        <span x-show="sortField === 'total'" x-text="sortDir === 'asc' ? ' \\u2191' : ' \\u2193'"></span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="s in sorted()" :key="s.sale_id">
                                    <tr>
                                        <td x-text="formatDate(s.sale_date)"></td>
                                        <td class="font-medium" x-text="s.customer_name"></td>
                                        <td x-text="s.employee_name"></td>
                                        <td x-text="s.location_name"></td>
                                        <td class="text-right font-mono font-semibold" x-text="formatCurrency(s.total)"></td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <template x-if="sales.length === 0">
                        ${emptyStateHTML('No sales yet', 'Create your first sale')}
                    </template>
                </div>
            </div>
        </div>
    `;
}

function salesPage() {
    return {
        sales: [],
        customersList: [],
        employeesList: [],
        locationsList: [],
        productsList: [],
        showForm: false,
        submitting: false,
        sortField: 'sale_date',
        sortDir: 'desc',
        form: {
            customer_id: '',
            employee_id: '',
            location_id: '',
            sale_date: new Date().toISOString().slice(0, 10),
            line_items: [{ product_id: 0, quantity: 1 }],
        },

        initData(sales, customers, employees, locations, products) {
            this.sales = sales;
            this.customersList = customers;
            this.employeesList = employees;
            this.locationsList = locations;
            this.productsList = products;
        },

        sorted() {
            const arr = [...this.sales];
            const field = this.sortField;
            const dir = this.sortDir === 'asc' ? 1 : -1;
            arr.sort((a, b) => {
                const va = a[field] ?? '';
                const vb = b[field] ?? '';
                if (typeof va === 'number') return (va - vb) * dir;
                return String(va).localeCompare(String(vb)) * dir;
            });
            return arr;
        },

        sortBy(field) {
            if (this.sortField === field) {
                this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortField = field;
                this.sortDir = 'desc';
            }
        },

        lineTotal(item) {
            const prod = this.productsList.find(p => p.id === item.product_id);
            return prod ? prod.price * item.quantity : 0;
        },

        orderTotal() {
            return this.form.line_items.reduce((sum, item) => sum + this.lineTotal(item), 0);
        },

        addLineItem() {
            if (this.form.line_items.length < 5) {
                this.form.line_items.push({ product_id: 0, quantity: 1 });
            }
        },

        isValid() {
            return this.form.customer_id && this.form.employee_id &&
                   this.form.location_id && this.form.sale_date &&
                   this.form.line_items.some(li => li.product_id > 0);
        },

        async createSale() {
            if (!this.isValid()) return;
            this.submitting = true;
            try {
                const body = {
                    customer_id: parseInt(this.form.customer_id),
                    employee_id: parseInt(this.form.employee_id),
                    location_id: parseInt(this.form.location_id),
                    sale_date: this.form.sale_date,
                    line_items: this.form.line_items
                        .filter(li => li.product_id > 0)
                        .map(li => ({ product_id: li.product_id, quantity: li.quantity })),
                };
                await API.post('sales', body);
                showToast('Sale created successfully');
                this.showForm = false;
                this.form = {
                    customer_id: '', employee_id: '', location_id: '',
                    sale_date: new Date().toISOString().slice(0, 10),
                    line_items: [{ product_id: 0, quantity: 1 }],
                };
                this.sales = await API.get('sales');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                this.submitting = false;
            }
        },
    };
}
