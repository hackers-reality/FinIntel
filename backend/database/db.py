import sqlite3
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import datetime

from backend.config.settings import get_settings

Base = declarative_base()


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, index=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    provider = Column(String)  # which LLM responded
    timestamp = Column(DateTime, default=datetime.utcnow)


class SemanticMemory(Base):
    __tablename__ = "semantic_memory"
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResearchHistory(Base):
    __tablename__ = "research_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    query = Column(Text)
    ticker = Column(String, nullable=True)
    report = Column(Text)
    provider = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    thesis = Column(Text)
    entry_price = Column(Float, nullable=True)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


_settings = get_settings()
engine = create_engine(_settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    import backend.models.user
    Base.metadata.create_all(bind=engine)

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
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                id INTEGER PRIMARY KEY,
                jti TEXT UNIQUE NOT NULL,
                revoked_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_settings().database_path)
    connection.row_factory = sqlite3.Row
    return connection


@contextmanager
def db_cursor() -> Iterator[sqlite3.Cursor]:
    connection = get_connection()
    try:
        yield connection.cursor()
        connection.commit()
    finally:
        connection.close()
