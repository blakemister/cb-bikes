/* ===========================================
   CB Bikes — Customers Page
   =========================================== */

async function renderCustomers(container) {
    let customers;
    try {
        customers = await API.get('customers');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    container.innerHTML = `
        <div x-data="customersPage()" x-init="customers = ${escapeAttr(JSON.stringify(customers))}">
            <div class="section-header">
                <div>
                    <h1 class="section-title">Customers</h1>
                    <p class="section-subtitle" x-text="filtered().length + ' customers'"></p>
                </div>
                <button class="btn btn-primary" @click="showForm = !showForm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Customer
                </button>
            </div>

            <!-- Add Customer Form -->
            <div class="card mb-6" x-show="showForm" x-transition>
                <div class="card-header">
                    New Customer
                    <button @click="showForm = false" class="text-text-muted hover:text-text-primary">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="card-body">
                    <form @submit.prevent="createCustomer()">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="form-label">First Name *</label>
                                <input type="text" class="form-input" x-model="form.first_name" required>
                            </div>
                            <div>
                                <label class="form-label">Last Name *</label>
                                <input type="text" class="form-input" x-model="form.last_name" required>
                            </div>
                            <div class="md:col-span-2">
                                <label class="form-label">Street Address</label>
                                <input type="text" class="form-input" x-model="form.street_address">
                            </div>
                            <div>
                                <label class="form-label">City</label>
                                <input type="text" class="form-input" x-model="form.city">
                            </div>
                            <div>
                                <label class="form-label">State</label>
                                <input type="text" class="form-input" maxlength="2" x-model="form.state" placeholder="CO">
                            </div>
                            <div>
                                <label class="form-label">Zip Code</label>
                                <input type="text" class="form-input" x-model="form.zip_code">
                            </div>
                        </div>

                        <!-- Emails -->
                        <div class="mb-4">
                            <label class="form-label">Email Addresses</label>
                            <template x-for="(email, idx) in form.emails" :key="idx">
                                <div class="flex gap-2 mb-2">
                                    <input type="email" class="form-input" x-model="form.emails[idx]" placeholder="email@example.com">
                                    <button type="button" class="btn btn-secondary btn-sm" @click="form.emails.splice(idx, 1)">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                            </template>
                            <button type="button" class="btn btn-secondary btn-sm" @click="form.emails.push('')">+ Add Email</button>
                        </div>

                        <!-- Phones -->
                        <div class="mb-4">
                            <label class="form-label">Phone Numbers</label>
                            <template x-for="(phone, idx) in form.phones" :key="idx">
                                <div class="flex gap-2 mb-2">
                                    <input type="tel" class="form-input" x-model="form.phones[idx].number" placeholder="555-1234">
                                    <select class="form-select" style="max-width: 140px;" x-model="form.phones[idx].type">
                                        <option>Mobile</option>
                                        <option>Home</option>
                                        <option>Work</option>
                                    </select>
                                    <button type="button" class="btn btn-secondary btn-sm" @click="form.phones.splice(idx, 1)">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                            </template>
                            <button type="button" class="btn btn-secondary btn-sm" @click="form.phones.push({number:'', type:'Mobile'})">+ Add Phone</button>
                        </div>

                        <!-- Cycling Types -->
                        <div class="mb-6">
                            <label class="form-label">Cycling Types</label>
                            <div class="flex flex-wrap gap-2">
                                <template x-for="ct in allCyclingTypes" :key="ct">
                                    <label
                                        class="badge cursor-pointer transition-all"
                                        :class="form.cycling_types.includes(ct) ? cyclingBadgeClass(ct) : 'badge-gray opacity-60'"
                                        @click="toggleCyclingType(ct)"
                                    >
                                        <span x-text="ct"></span>
                                    </label>
                                </template>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button type="button" class="btn btn-secondary" @click="showForm = false">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting">
                                <span x-show="!submitting">Create Customer</span>
                                <span x-show="submitting">Creating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Search -->
            <div class="mb-4">
                <div class="search-input-wrap">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input type="text" class="form-input" style="padding-left: 36px;" placeholder="Search by name or city..." x-model="search">
                </div>
            </div>

            <!-- Table -->
            <div class="card">
                <div class="card-body-flush">
                    <div class="table-wrap" style="border: none; border-radius: 0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>City / State</th>
                                    <th>Emails</th>
                                    <th>Phones</th>
                                    <th>Cycling Types</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="c in filtered()" :key="c.customer_id">
                                    <tr>
                                        <td class="font-medium" x-text="c.first_name + ' ' + c.last_name"></td>
                                        <td x-text="[c.city, c.state].filter(Boolean).join(', ') || '--'"></td>
                                        <td>
                                            <div class="flex flex-wrap gap-1">
                                                <template x-for="e in (c.emails || [])" :key="e">
                                                    <span class="badge badge-gray text-xs" x-text="e"></span>
                                                </template>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex flex-wrap gap-1">
                                                <template x-for="p in (c.phones || [])" :key="p.number">
                                                    <span class="text-sm" x-text="p.number + (p.type ? ' (' + p.type + ')' : '')"></span>
                                                </template>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex flex-wrap gap-1">
                                                <template x-for="ct in (c.cycling_types || [])" :key="ct">
                                                    <span class="badge" :class="cyclingBadgeClass(ct)" x-text="ct"></span>
                                                </template>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <template x-if="filtered().length === 0">
                        ${emptyStateHTML('No customers found', 'Try adjusting your search')}
                    </template>
                </div>
            </div>
        </div>
    `;
}

function customersPage() {
    return {
        customers: [],
        search: '',
        showForm: false,
        submitting: false,
        allCyclingTypes: ['Road', 'XC', 'Enduro', 'Downhill', 'Gravel', 'Trail', 'Cyclocross'],
        form: {
            first_name: '',
            last_name: '',
            street_address: '',
            city: '',
            state: '',
            zip_code: '',
            emails: [''],
            phones: [{ number: '', type: 'Mobile' }],
            cycling_types: [],
        },

        filtered() {
            if (!this.search) return this.customers;
            const q = this.search.toLowerCase();
            return this.customers.filter(c =>
                `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
                (c.city && c.city.toLowerCase().includes(q))
            );
        },

        cyclingBadgeClass(ct) {
            const map = {
                Road: 'badge-blue', XC: 'badge-green', Enduro: 'badge-purple',
                Downhill: 'badge-red', Gravel: 'badge-amber', Trail: 'badge-teal',
                Cyclocross: 'badge-orange',
            };
            return map[ct] || 'badge-gray';
        },

        toggleCyclingType(ct) {
            const idx = this.form.cycling_types.indexOf(ct);
            if (idx >= 0) this.form.cycling_types.splice(idx, 1);
            else this.form.cycling_types.push(ct);
        },

        async createCustomer() {
            if (!this.form.first_name || !this.form.last_name) return;
            this.submitting = true;
            try {
                const body = {
                    ...this.form,
                    emails: this.form.emails.filter(e => e.trim()),
                    phones: this.form.phones.filter(p => p.number.trim()),
                };
                await API.post('customers', body);
                showToast('Customer created successfully');
                this.showForm = false;
                this.resetForm();
                // Reload
                this.customers = await API.get('customers');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                this.submitting = false;
            }
        },

        resetForm() {
            this.form = {
                first_name: '', last_name: '', street_address: '',
                city: '', state: '', zip_code: '',
                emails: [''], phones: [{ number: '', type: 'Mobile' }],
                cycling_types: [],
            };
        },
    };
}

