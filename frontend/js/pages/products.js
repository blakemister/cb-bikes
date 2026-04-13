/* ===========================================
   CB Bikes — Products Page
   =========================================== */

async function renderProducts(container) {
    let products;
    try {
        products = await API.get('products');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    container.innerHTML = `
        <div x-data="productsPage()" x-init="products = ${escapeAttr(JSON.stringify(products))}">
            <div class="section-header">
                <div>
                    <h1 class="section-title">Products</h1>
                    <p class="section-subtitle" x-text="filtered().length + ' products'"></p>
                </div>
            </div>

            <!-- Type Filter Tabs -->
            <div class="tab-nav mb-6">
                <template x-for="t in ['All', 'Bike', 'Clothing', 'Part', 'Service']" :key="t">
                    <button
                        class="tab-btn"
                        :class="activeType === t ? 'active' : ''"
                        @click="activeType = t"
                        x-text="t === 'All' ? 'All' : t + 's'"
                    ></button>
                </template>
            </div>

            <!-- Table -->
            <div class="card">
                <div class="card-body-flush">
                    <div class="table-wrap" style="border: none; border-radius: 0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Type</th>
                                    <th class="text-right">MSRP</th>
                                    <th class="text-right">Cost</th>
                                    <th class="text-right">Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="p in filtered()" :key="p.product_id">
                                    <tr class="cursor-pointer" @click="expanded === p.product_id ? expanded = null : expanded = p.product_id">
                                        <td>
                                            <div class="font-medium" x-text="p.product_name"></div>
                                            <div class="text-xs text-text-muted" x-show="p.description" x-text="p.description"></div>
                                        </td>
                                        <td>
                                            <span class="badge" :class="'badge-' + p.product_type" x-text="p.product_type"></span>
                                        </td>
                                        <td class="text-right font-mono" x-text="formatCurrency(p.msrp)"></td>
                                        <td class="text-right font-mono text-text-secondary" x-text="formatCurrency(p.cost_price)"></td>
                                        <td class="text-right font-mono font-semibold"
                                            :class="margin(p) >= 40 ? 'text-success' : margin(p) >= 20 ? 'text-warning' : 'text-danger'"
                                            x-text="margin(p).toFixed(1) + '%'">
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <template x-if="filtered().length === 0">
                        ${emptyStateHTML('No products found', 'Try a different filter')}
                    </template>
                </div>
            </div>

            <!-- Expanded Bike Detail -->
            <template x-if="expanded && getProduct(expanded)?.product_type === 'Bike' && getProduct(expanded)?.bike_details">
                <div class="card mt-4" x-transition>
                    <div class="card-header">
                        <span x-text="getProduct(expanded)?.product_name + ' - Specifications'"></span>
                        <button @click="expanded = null" class="text-text-muted hover:text-text-primary">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4" x-data="{ bd: getProduct(expanded).bike_details }">
                            <div>
                                <div class="text-xs text-text-muted font-medium uppercase">Frame Material</div>
                                <div class="font-medium mt-1" x-text="bd.frame_material"></div>
                            </div>
                            <div>
                                <div class="text-xs text-text-muted font-medium uppercase">Frame Size</div>
                                <div class="font-medium mt-1" x-text="bd.frame_size"></div>
                            </div>
                            <div>
                                <div class="text-xs text-text-muted font-medium uppercase">Build Kit</div>
                                <div class="font-medium mt-1" x-text="bd.build_kit || '--'"></div>
                            </div>
                            <div>
                                <div class="text-xs text-text-muted font-medium uppercase">Suspension</div>
                                <div class="font-medium mt-1" x-text="bd.suspension_type || '--'"></div>
                            </div>
                            <div>
                                <div class="text-xs text-text-muted font-medium uppercase">Drivetrain</div>
                                <div class="font-medium mt-1" x-text="bd.drivetrain || '--'"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    `;
}

function productsPage() {
    return {
        products: [],
        activeType: 'All',
        expanded: null,

        filtered() {
            if (this.activeType === 'All') return this.products;
            return this.products.filter(p => p.product_type === this.activeType);
        },

        margin(p) {
            if (!p.msrp || p.msrp === 0) return 0;
            return ((p.msrp - p.cost_price) / p.msrp) * 100;
        },

        getProduct(id) {
            return this.products.find(p => p.product_id === id);
        },
    };
}
