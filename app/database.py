import asyncio
import re
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, date, time as dt_time
from decimal import Decimal

import pyodbc

from app.config import settings


def _to_snake(name: str) -> str:
    """Convert PascalCase/camelCase column names to snake_case."""
    s = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", name)
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", s)
    return s.lower()


def _serialize_value(val):
    """Convert DB values to JSON-safe types."""
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, date):
        return val.isoformat()
    if isinstance(val, dt_time):
        return val.isoformat()
    return val


def _normalize_row(row: dict) -> dict:
    """Convert column names to snake_case and values to JSON-safe types."""
    return {_to_snake(k): _serialize_value(v) for k, v in row.items()}

# ---------------------------------------------------------------------------
# SQL log broadcaster
# ---------------------------------------------------------------------------
_sql_log: deque[dict] = deque(maxlen=500)
_ws_clients: set[asyncio.Queue] = set()
_main_loop: asyncio.AbstractEventLoop | None = None


async def broadcast_sql_entry(entry: dict):
    _sql_log.append(entry)
    dead: set[asyncio.Queue] = set()
    for q in _ws_clients:
        try:
            q.put_nowait(entry)
        except asyncio.QueueFull:
            dead.add(q)
    _ws_clients.difference_update(dead)


def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _ws_clients.add(q)
    return q


def unsubscribe(q: asyncio.Queue):
    _ws_clients.discard(q)


def get_log() -> list[dict]:
    return list(_sql_log)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_OP_MAP = {
    "SELECT": "SELECT",
    "INSERT": "INSERT",
    "UPDATE": "UPDATE",
    "DELETE": "DELETE",
    "EXEC": "EXEC",
    "SET": "SET",
    "WITH": "SELECT",
}


def _detect_operation(sql: str) -> str:
    token = sql.strip().split()[0].upper() if sql.strip() else "OTHER"
    return _OP_MAP.get(token, "OTHER")


def _display_sql(sql: str, params: tuple | None) -> str:
    """Substitute ? placeholders with actual param values for display."""
    display = sql
    if params:
        for val in params:
            if val is None:
                replacement = "NULL"
            elif isinstance(val, str):
                replacement = f"'{val}'"
            else:
                replacement = str(val)
            display = display.replace("?", replacement, 1)
    if len(display) > 240:
        display = display[:237] + "..."
    return display


def _preview_row(row: dict) -> str:
    """Build a short preview string from the first row."""
    parts = []
    for k, v in row.items():
        parts.append(f"{k}={v}")
        if len(" \u00b7 ".join(parts)) > 80:
            break
    return " \u00b7 ".join(parts)


def _build_log_entry(
    sql: str,
    params: tuple | None,
    elapsed_ms: float,
    row_count: int,
    first_row: dict | None,
    error: str | None,
) -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "operation": _detect_operation(sql),
        "sql": _display_sql(sql, params),
        "ms": round(elapsed_ms, 1),
        "rows": row_count,
        "preview": _preview_row(first_row) if first_row else "",
        "status": "error" if error else "success",
    }


# ---------------------------------------------------------------------------
# Thread-pool executor shared across all DB calls
# ---------------------------------------------------------------------------
_executor = ThreadPoolExecutor(max_workers=4)


def _fire_broadcast(entry: dict):
    """Schedule broadcast_sql_entry onto the main event loop from a worker thread."""
    loop = _main_loop
    if loop is not None and loop.is_running():
        try:
            asyncio.run_coroutine_threadsafe(broadcast_sql_entry(entry), loop)
            return
        except RuntimeError:
            pass
    # Fallback: append directly without async broadcast
    _sql_log.append(entry)


# ---------------------------------------------------------------------------
# Database class
# ---------------------------------------------------------------------------
class Database:
    def __init__(self, conn_string: str):
        self._conn_string = conn_string
        self._local = threading.local()

    def _get_conn(self) -> pyodbc.Connection:
        conn = getattr(self._local, "conn", None)
        if conn is None:
            self._local.conn = pyodbc.connect(self._conn_string)
            self._local.conn.autocommit = True
        return self._local.conn

    def _reconnect(self) -> pyodbc.Connection:
        old = getattr(self._local, "conn", None)
        if old:
            try:
                old.close()
            except Exception:
                pass
        self._local.conn = pyodbc.connect(self._conn_string)
        self._local.conn.autocommit = True
        return self._local.conn

    # ---- sync primitives (run in thread pool) ----------------------------

    def _query_sync(self, sql: str, params: tuple | None) -> list[dict]:
        t0 = time.perf_counter()
        error = None
        rows: list[dict] = []
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            columns = [col[0] for col in cursor.description] if cursor.description else []
            rows = [_normalize_row(dict(zip(columns, row))) for row in cursor.fetchall()]
        except pyodbc.Error as exc:
            error = str(exc)
            # Try reconnecting once
            try:
                conn = self._reconnect()
                cursor = conn.cursor()
                cursor.execute(sql, params or ())
                columns = [col[0] for col in cursor.description] if cursor.description else []
                rows = [_normalize_row(dict(zip(columns, row))) for row in cursor.fetchall()]
                error = None
            except pyodbc.Error as exc2:
                error = str(exc2)
                raise
        finally:
            elapsed = (time.perf_counter() - t0) * 1000
            entry = _build_log_entry(sql, params, elapsed, len(rows), rows[0] if rows else None, error)
            _fire_broadcast(entry)
        return rows

    def _scalar_sync(self, sql: str, params: tuple | None):
        t0 = time.perf_counter()
        error = None
        result = None
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            row = cursor.fetchone()
            result = row[0] if row else None
        except pyodbc.Error as exc:
            error = str(exc)
            try:
                conn = self._reconnect()
                cursor = conn.cursor()
                cursor.execute(sql, params or ())
                row = cursor.fetchone()
                result = row[0] if row else None
                error = None
            except pyodbc.Error as exc2:
                error = str(exc2)
                raise
        finally:
            elapsed = (time.perf_counter() - t0) * 1000
            preview = f"result={result}" if result is not None else ""
            entry = _build_log_entry(sql, params, elapsed, 1 if result is not None else 0, None, error)
            entry["preview"] = preview
            _fire_broadcast(entry)
        return result

    def _execute_sync(self, sql: str, params: tuple | None) -> int:
        t0 = time.perf_counter()
        error = None
        affected = 0
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            affected = cursor.rowcount
        except pyodbc.Error as exc:
            error = str(exc)
            try:
                conn = self._reconnect()
                cursor = conn.cursor()
                cursor.execute(sql, params or ())
                affected = cursor.rowcount
                error = None
            except pyodbc.Error as exc2:
                error = str(exc2)
                raise
        finally:
            elapsed = (time.perf_counter() - t0) * 1000
            entry = _build_log_entry(sql, params, elapsed, affected, None, error)
            _fire_broadcast(entry)
        return affected

    def _execute_return_id_sync(self, sql: str, params: tuple | None) -> int:
        """Execute an INSERT and return the new SCOPE_IDENTITY() value."""
        t0 = time.perf_counter()
        error = None
        new_id = 0
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            full_sql = f"SET NOCOUNT ON; {sql}; SELECT SCOPE_IDENTITY();"
            cursor.execute(full_sql, params or ())
            # SCOPE_IDENTITY may come after nextset
            row = cursor.fetchone()
            if row is None:
                cursor.nextset()
                row = cursor.fetchone()
            new_id = int(row[0]) if row and row[0] is not None else 0
        except pyodbc.Error as exc:
            error = str(exc)
            try:
                conn = self._reconnect()
                cursor = conn.cursor()
                full_sql = f"SET NOCOUNT ON; {sql}; SELECT SCOPE_IDENTITY();"
                cursor.execute(full_sql, params or ())
                row = cursor.fetchone()
                if row is None:
                    cursor.nextset()
                    row = cursor.fetchone()
                new_id = int(row[0]) if row and row[0] is not None else 0
                error = None
            except pyodbc.Error as exc2:
                error = str(exc2)
                raise
        finally:
            elapsed = (time.perf_counter() - t0) * 1000
            entry = _build_log_entry(sql, params, elapsed, 1 if new_id else 0, None, error)
            entry["preview"] = f"new_id={new_id}" if new_id else ""
            _fire_broadcast(entry)
        return new_id

    # ---- async wrappers --------------------------------------------------

    async def query(self, sql: str, params: tuple | None = None) -> list[dict]:
        global _main_loop
        loop = asyncio.get_running_loop()
        _main_loop = loop
        return await loop.run_in_executor(_executor, self._query_sync, sql, params)

    async def scalar(self, sql: str, params: tuple | None = None):
        global _main_loop
        loop = asyncio.get_running_loop()
        _main_loop = loop
        return await loop.run_in_executor(_executor, self._scalar_sync, sql, params)

    async def execute(self, sql: str, params: tuple | None = None) -> int:
        global _main_loop
        loop = asyncio.get_running_loop()
        _main_loop = loop
        return await loop.run_in_executor(_executor, self._execute_sync, sql, params)

    async def execute_return_id(self, sql: str, params: tuple | None = None) -> int:
        global _main_loop
        loop = asyncio.get_running_loop()
        _main_loop = loop
        return await loop.run_in_executor(_executor, self._execute_return_id_sync, sql, params)

    async def health_check(self) -> bool:
        try:
            result = await self.scalar("SELECT 1")
            return result == 1
        except Exception:
            return False


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
db = Database(settings.connection_string)
