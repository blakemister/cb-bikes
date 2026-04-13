/* ===========================================
   CB Bikes — SQL Console (WebSocket Client)
   Terminal-style real-time SQL log viewer
   =========================================== */

const SqlConsole = {
    ws: null,
    app: null,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    reconnectAttempts: 0,

    connect(appRef) {
        this.app = appRef;
        this._open();
    },

    _open() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${location.host}/ws/sql-log`;
        try {
            this.ws = new WebSocket(url);
        } catch {
            this._scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            if (this.app) this.app.connected = true;
        };

        this.ws.onmessage = (event) => {
            try {
                const entry = JSON.parse(event.data);
                this._renderEntry(entry);
                this._updateStats(entry);
            } catch { /* ignore malformed messages */ }
        };

        this.ws.onclose = () => {
            if (this.app) this.app.connected = false;
            this._scheduleReconnect();
        };

        this.ws.onerror = () => {
            if (this.app) this.app.connected = false;
        };
    },

    _scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );
        setTimeout(() => this._open(), delay);
    },

    _updateStats(entry) {
        if (!this.app) return;
        this.app.stats.queries++;
        this.app.stats.totalMs += entry.ms || 0;
        if (entry.status === 'error') this.app.stats.errors++;
    },

    _highlightSQL(sql) {
        if (!sql) return '';
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
            'OUTER JOIN', 'CROSS JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
            'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'GROUP BY', 'ORDER BY',
            'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
            'MIN', 'MAX', 'TOP', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'ASC', 'DESC',
            'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE', 'SCOPE_IDENTITY',
            'SET NOCOUNT ON', 'WITH', 'UNION', 'ALL', 'INTO', 'CREATE', 'ALTER', 'DROP',
        ];
        let escaped = escapeHtml(sql);
        // Highlight strings ('...')
        escaped = escaped.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');
        // Highlight keywords (longest first to match multi-word keywords)
        const sorted = keywords.slice().sort((a, b) => b.length - a.length);
        for (const kw of sorted) {
            const re = new RegExp(`\\b${kw}\\b`, 'gi');
            escaped = escaped.replace(re, (m) => `<span class="sql-keyword">${m}</span>`);
        }
        // Highlight numbers
        escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sql-number">$1</span>');
        return escaped;
    },

    _renderEntry(entry) {
        const container = document.getElementById('sql-log-entries');
        if (!container) return;

        // Remove the "Waiting for queries..." placeholder
        const placeholder = container.querySelector('.text-center');
        if (placeholder) placeholder.remove();

        const op = entry.operation || 'OTHER';
        const isError = entry.status === 'error';
        const badgeClass = isError ? 'badge-error' : `badge-${op}`;
        const entryClass = isError ? 'op-error' : `op-${op}`;

        const div = document.createElement('div');
        div.className = `sql-log-entry ${entryClass}`;
        div.innerHTML = `
            <div class="sql-log-header">
                <span class="sql-log-badge ${badgeClass}">${isError ? 'ERROR' : escapeHtml(op)}</span>
                <span class="sql-log-time">${escapeHtml(entry.timestamp)}</span>
                <span class="sql-log-rows">${entry.rows} row${entry.rows !== 1 ? 's' : ''}</span>
                <span class="sql-log-ms">${entry.ms}ms</span>
            </div>
            <div class="sql-log-sql">${this._highlightSQL(entry.sql)}</div>
            ${entry.preview ? `<div class="sql-log-preview">${escapeHtml(entry.preview)}</div>` : ''}
        `;
        container.appendChild(div);

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Keep max 200 entries in DOM
        while (container.children.length > 200) {
            container.removeChild(container.firstChild);
        }
    },

    clear() {
        const container = document.getElementById('sql-log-entries');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-text-muted text-xs font-mono py-8">
                    <svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Waiting for queries...
                </div>
            `;
        }
    },
};
