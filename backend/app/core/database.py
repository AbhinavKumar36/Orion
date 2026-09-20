"""
Database connection and lifecycle manager for SQLite.
Strictly enforces foreign key constraints and WAL journal mode.
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

DEFAULT_DB_PATH = Path("backend/data/orion.db")


def get_db_path() -> Path:
    env_path = os.getenv("ORION_DB_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DB_PATH


def init_db(schema_path: Path | str = "backend/app/models/schema.sql") -> None:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")

        schema_file = Path(schema_path)
        if not schema_file.exists():
            raise FileNotFoundError(f"Schema file not found at {schema_file.resolve()}")

        with open(schema_file, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        conn.executescript(schema_sql)
        conn.commit()


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def check_db_health() -> dict:
    try:
        with get_db() as conn:
            fk = conn.execute("PRAGMA foreign_keys;").fetchone()[0]
            wal = conn.execute("PRAGMA journal_mode;").fetchone()[0]
            tables = conn.execute(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='incidents';"
            ).fetchone()[0]
            return {
                "connected": True,
                "foreign_keys_on": bool(fk),
                "journal_mode": str(wal).lower(),
                "schema_initialized": bool(tables),
            }
    except Exception as e:
        return {"connected": False, "error": str(e)}
