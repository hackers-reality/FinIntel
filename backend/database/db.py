import sqlite3
from contextlib import contextmanager
from typing import Iterator

from backend.config.settings import get_settings


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_settings().database_path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY,
                ticker TEXT NOT NULL,
                qty REAL NOT NULL,
                price REAL NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS fii_dii_flow (
                id INTEGER PRIMARY KEY,
                date TEXT UNIQUE NOT NULL,
                fii_net REAL NOT NULL,
                dii_net REAL NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS investor_news (
                id INTEGER PRIMARY KEY,
                investor_name TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                ts TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS bulk_deals (
                id INTEGER PRIMARY KEY,
                ticker TEXT NOT NULL,
                client TEXT NOT NULL,
                qty REAL NOT NULL,
                price REAL NOT NULL,
                type TEXT NOT NULL,
                ts TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS pending_events (
                id INTEGER PRIMARY KEY,
                ticker TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                ts TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS provider_settings (
                provider TEXT PRIMARY KEY,
                encrypted_key TEXT NOT NULL,
                base_url TEXT,
                model TEXT,
                verified_at TEXT,
                verification_status TEXT,
                verification_message TEXT
            )
            """
        )
        connection.commit()


@contextmanager
def db_cursor() -> Iterator[sqlite3.Cursor]:
    connection = get_connection()
    try:
        yield connection.cursor()
        connection.commit()
    finally:
        connection.close()
