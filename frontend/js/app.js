/* ===========================================
   CB Bikes — Main App (Alpine.js)
   =========================================== */

const Pages = {
    dashboard: renderDashboard,
    customers: renderCustomers,
    products: renderProducts,
    employees: renderEmployees,
    sales: renderSales,
    'bike-week': renderBikeWeek,
    reports: renderReports,
    schema: renderSchema,
};

function app() {
    return {
        currentPage: 'dashboard',
        connected: false,
        sidebarOpen: window.innerWidth >= 1024,
        sqlPanelOpen: true,
        stats: { queries: 0, totalMs: 0, errors: 0 },

        init() {
            const hash = window.location.hash.slice(1);
            this.navigate(hash || 'dashboard');
            SqlConsole.connect(this);

            // Listen for hash changes (back/forward)
            window.addEventListener('hashchange', () => {
                const page = window.location.hash.slice(1) || 'dashboard';
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadPage(page);
                }
            });

            // Close sidebar on resize to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) {
                    this.sidebarOpen = true;
                }
            });
        },

        navigate(page) {
            this.currentPage = page;
            window.location.hash = page;
            this.loadPage(page);
        },

        async loadPage(page) {
            const container = document.getElementById('page-content');
            container.innerHTML = loadingHTML();
            try {
                const loader = Pages[page];
                if (loader) {
                    await loader(container);
                } else {
                    container.innerHTML = emptyStateHTML('Page Not Found', 'The page you requested does not exist.');
                }
            } catch (err) {
                container.innerHTML = errorStateHTML(err.message);
            }
        },

        clearSqlLog() {
            SqlConsole.clear();
            this.stats = { queries: 0, totalMs: 0, errors: 0 };
        },
    };
}
