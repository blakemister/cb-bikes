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
        sqlPanelWidth: (() => {
            const defaultW = Math.max(280, Math.round(window.innerWidth * 0.25));
            const stored = parseInt(localStorage.getItem('sqlPanelWidth'), 10);
            // only honor stored value if it's sensible for current viewport
            if (stored && stored >= 280 && stored <= window.innerWidth - 200) return stored;
            return defaultW;
        })(),
        sqlPanelResizing: false,
        stats: { queries: 0, totalMs: 0, errors: 0 },

        resetSqlPanelWidth() {
            this.sqlPanelWidth = Math.max(280, Math.round(window.innerWidth * 0.25));
            localStorage.setItem('sqlPanelWidth', String(this.sqlPanelWidth));
        },

        startSqlPanelResize(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.sqlPanelResizing = true;
            const pointX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);
            const startX = pointX(ev);
            const startWidth = this.sqlPanelWidth;
            const minW = 280;
            const onMove = (e) => {
                // panel is pinned right; dragging LEFT grows, RIGHT shrinks
                const dx = startX - pointX(e);
                const maxW = Math.max(minW, window.innerWidth - 200);
                this.sqlPanelWidth = Math.min(maxW, Math.max(minW, startWidth + dx));
                if (e.cancelable) e.preventDefault();
            };
            const onUp = () => {
                this.sqlPanelResizing = false;
                localStorage.setItem('sqlPanelWidth', String(this.sqlPanelWidth));
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onUp);
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            };
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        },

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
