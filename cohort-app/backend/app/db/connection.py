import pyodbc
from typing import Any
from ..config import settings

_conn: pyodbc.Connection | None = None


def get_connection() -> pyodbc.Connection:
    global _conn
    if _conn is None or _conn.closed:
        conn_str = (
            f"DRIVER={{{settings.DB_DRIVER}}};"
            f"SERVER={settings.DB_SERVER};"
            f"DATABASE={settings.DB_NAME};"
            f"UID={settings.DB_USER};"
            f"PWD={settings.DB_PASS};"
            "TrustServerCertificate=yes;"
        )
        _conn = pyodbc.connect(conn_str, autocommit=True)
    return _conn


def execute_query(sql: str) -> list[dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql)
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
