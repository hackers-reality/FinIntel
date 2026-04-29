import os
import json
import asyncio
import logging
import sqlite3
import pytz
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager, contextmanager
import uvicorn
from dotenv import load_dotenv
from datetime import datetime, time as dtime
import openai
from cryptography.fernet import Fernet
import yfinance as yf
from duckduckgo_search import DDGS

# ── PROFESSIONAL BRANDING ──────────────────────────────────────────
# REPLACED: "Sovereign Nexus", "Whale Feed", "Tactical Lock"
# WITH: "FinIntel Terminal", "Institutional Flow", "Strategic Lock"

# ── LOGGING ─────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FinIntelKernel")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "finintel.db")
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))
IST = pytz.timezone('Asia/Kolkata')

# ── SECURITY ─────────────────────────────────────────────────────────
def get_fernet():
    key_path = os.path.join(os.path.dirname(BASE_DIR), "secret.key")
    if not os.path.exists(key_path):
        key = Fernet.generate_key()
        with open(key_path, "wb") as f: f.write(key)
    with open(key_path, "rb") as f: return Fernet(f.read())

cipher = get_fernet()
def encrypt_v(v: str): return cipher.encrypt(v.encode()).decode() if v else ""
def decrypt_v(v: str): 
    try: return cipher.decrypt(v.encode()).decode() if v else ""
    except: return ""

# ── DATABASE ─────────────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY, ticker TEXT, qty REAL, price REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS fii_dii_flow (id INTEGER PRIMARY KEY, date TEXT UNIQUE, fii_net REAL, dii_net REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS titan_news (id INTEGER PRIMARY KEY, titan TEXT, title TEXT, url TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS bulk_deals (id INTEGER PRIMARY KEY, ticker TEXT, client TEXT, qty REAL, price REAL, type TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS pending_events (id INTEGER PRIMARY KEY, ticker TEXT, type TEXT, description TEXT, ts TEXT, status TEXT)")
        conn.commit()

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try: yield conn.cursor()
    finally: conn.commit(); conn.close()

# ── CORE SERVICES ──────────────────────────────────────────────────
async def get_market_indices():
    tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "USDINR=X"]
    res = []
    for t in tickers:
        try:
            h = yf.Ticker(t).history(period="1d")
            if not h.empty:
                c, o = h['Close'].iloc[-1], h['Open'].iloc[0]
                res.append({"symbol": t, "price": round(c, 2), "change": round(((c-o)/o)*100, 2)})
        except: pass
    return res

async def get_sector_data():
    indices = {"BANK": "^CNXBANK", "AUTO": "^CNXAUTO", "IT": "^CNXIT", "PHARMA": "^CNXPHARMA", "FMCG": "^CNXFMCG", "METAL": "^CNXMETAL"}
    res = []
    for name, sym in indices.items():
        try:
            h = yf.Ticker(sym).history(period="1d")
            if not h.empty:
                c, o = h['Close'].iloc[-1], h['Open'].iloc[0]
                res.append({"sector": name, "change": round(((c-o)/o)*100, 2)})
        except: pass
    return sorted(res, key=lambda x: x['change'], reverse=True)

# ── APP INITIALIZATION ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("FinIntel Terminal Kernel Ignited.")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── ENDPOINTS ────────────────────────────────────────────────────────
@app.get("/market/overview")
async def market_overview():
    indices = await get_market_indices()
    status = "OPEN" if dtime(9,15) <= datetime.now(IST).time() <= dtime(15,30) else "CLOSED"
    return {"Stocks": indices, "market_status": status}

@app.get("/market/sectors")
async def sector_perf():
    return await get_sector_data()

@app.get("/market/portfolio/summary")
async def portfolio_summary():
    with db_session() as c:
        c.execute("SELECT ticker, qty, price FROM portfolio")
        rows = c.fetchall()
    total_val = 0; holdings = []
    for r in rows:
        ticker, qty, avg = r[0], r[1], r[2]
        try:
            h = yf.Ticker(ticker if ".NS" in ticker else f"{ticker}.NS").history(period="1d")
            cur = h['Close'].iloc[-1] if not h.empty else avg
        except: cur = avg
        pnl = (cur - avg) * qty
        total_val += (cur * qty)
        holdings.append({"symbol": ticker, "qty": qty, "avg_price": avg, "curr_price": round(cur, 2), "pnl": round(pnl, 2)})
    return {"total_value": round(total_val, 2), "holdings": holdings}

@app.get("/market/traders/news")
async def institutional_news():
    with db_session() as c:
        c.execute("SELECT titan, title, url, ts FROM titan_news ORDER BY ts DESC LIMIT 15")
        return [{"titan": r[0], "title": r[1], "url": r[2], "date": r[3]} for r in c.fetchall()]

@app.get("/market/fiidii")
async def institutional_flow():
    with db_session() as c:
        c.execute("SELECT date, fii_net, dii_net FROM fii_dii_flow ORDER BY date DESC LIMIT 10")
        return [{"date": r[0], "fii": r[1], "dii": r[2]} for r in c.fetchall()]

@app.get("/market/bulkdeals")
async def bulk_deals_data():
    with db_session() as c:
        c.execute("SELECT ticker, client, qty, price, type, ts FROM bulk_deals ORDER BY ts DESC LIMIT 10")
        return [{"ticker": r[0], "client": r[1], "qty": r[2], "price": r[3], "type": r[4], "date": r[5]} for r in c.fetchall()]

@app.get("/market/events")
async def pending_strategic_events():
    with db_session() as c:
        c.execute("SELECT * FROM pending_events WHERE status='pending'")
        rows = c.fetchall()
        return [{"id": r[0], "ticker": r[1], "type": r[2], "description": r[3], "ts": r[4], "status": r[5]} for r in rows]

# ── COMPLIANCE & LEGAL ──────────────────────────────────────────────
@app.get("/system/compliance")
async def get_compliance():
    return {
        "disclaimer": "Not financial advice. SEBI registration required for advisory.",
        "risk_warning": "Trading stocks involves significant risk of capital loss.",
        "data_source": "Market data via Yahoo Finance API. Institutional news via DuckDuckGo Forensic Scraper.",
        "version": "Professional Strategic Terminal v5.0"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
