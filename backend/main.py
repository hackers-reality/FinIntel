import os
import json
import asyncio
import logging
import sqlite3
import pytz
import random
import requests
import yfinance as yf
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager, contextmanager
import uvicorn
from duckduckgo_search import DDGS
from dotenv import load_dotenv
from datetime import datetime, time as dtime, timedelta
import openai
from cryptography.fernet import Fernet
from fpdf import FPDF
from kiteconnect import KiteConnect
import threading
import time

# ── Structured Logging ───────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FinIntel")
class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({"timestamp": datetime.now().isoformat(), "level": record.levelname, "message": record.getMessage()})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
fh = logging.FileHandler(os.path.join(BASE_DIR, "system.log"))
fh.setFormatter(JSONFormatter())
logger.addHandler(fh)

def log_system(msg, level="INFO"):
    if level == "ERROR": logger.error(msg)
    else: logger.info(msg)

# ── Setup ────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "finintel.db")
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))
IST = pytz.timezone('Asia/Kolkata')
limiter = Limiter(key_func=get_remote_address)

# ── Security & DB ─────────────────────────────────────────────────────
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

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY, ticker TEXT, qty REAL, price REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY, role TEXT, content TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, asset TEXT, type TEXT, msg TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS pending_events (id INTEGER PRIMARY KEY, ticker TEXT, type TEXT, description TEXT, resolution_date TEXT, status TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS fii_dii_flow (id INTEGER PRIMARY KEY, date TEXT, fii_net REAL, dii_net REAL)")
        conn.commit()

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try: yield conn.cursor()
    finally: conn.commit(); conn.close()

# ── Market Clock ──────────────────────────────────────────────────────
def is_market_open():
    now = datetime.now(IST)
    if now.weekday() >= 5: return False
    return dtime(9, 15) <= now.time() <= dtime(15, 30)

# ── Zerodha Kite Integration ─────────────────────────────────────────
def get_kite_client():
    api_key = decrypt_v(os.getenv("ZERODHA_API_KEY"))
    access_token = decrypt_v(os.getenv("ZERODHA_ACCESS_TOKEN"))
    if not api_key or not access_token: return None
    try:
        kite = KiteConnect(api_key=api_key)
        kite.set_access_token(access_token)
        return kite
    except: return None

# ── Intelligence Engine ──────────────────────────────────────────────
async def call_llm(messages, json_mode=False):
    with db_session() as c:
        c.execute("SELECT value FROM settings WHERE key='openai_api_key'")
        res = c.fetchone()
        api_key = decrypt_v(res[0]) if res else os.getenv("OPENAI_API_KEY")
    if not api_key: return "{}"
    try:
        client = openai.AsyncOpenAI(api_key=api_key)
        resp = await client.chat.completions.create(model="gpt-4o", messages=messages, response_format={"type": "json_object"} if json_mode else None)
        return resp.choices[0].message.content
    except Exception as e: return f"Error: {str(e)}"

# ── Market Data Synthesis ────────────────────────────────────────────
async def get_market_overview_internal():
    base_tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "USDINR=X"]
    results = []
    for t in base_tickers:
        try:
            h = yf.Ticker(t).history(period="1d")
            if not h.empty:
                cur, op = h['Close'].iloc[-1], h['Open'].iloc[0]
                results.append({"symbol": t, "price": cur, "change": ((cur-op)/op)*100})
        except: pass
    sectors = []
    for s, idx in {"Bank": "^CNXBANK", "IT": "^CNXIT", "Auto": "^CNXAUTO"}.items():
        try:
            h = yf.Ticker(idx).history(period="1d")
            if not h.empty: sectors.append({"name": s, "sentiment": round(((h['Close'].iloc[-1]-h['Open'].iloc[0])/h['Open'].iloc[0])*100, 2)})
        except: pass
    return {"Stocks": results, "categories": sectors, "market_status": "OPEN" if is_market_open() else "CLOSED"}

# ── Sentinel Thread ──────────────────────────────────────────────────
def sentinel_sync_loop():
    while True:
        try:
            now = datetime.now(IST)
            if is_market_open():
                vix = yf.Ticker("^INDIAVIX").history(period="1d")
                if not vix.empty and vix['Close'].iloc[-1] > 20:
                    with db_session() as c:
                        c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("VIX", "CRITICAL", "VOLATILITY SPIKE ALERT", now.isoformat()))
            if now.hour == 18 and now.minute <= 15:
                with DDGS() as ddgs:
                    fii = list(ddgs.text("FII DII data today NSE", max_results=1))
                    if fii:
                        with db_session() as c:
                            c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("MARKET", "FII_DII", fii[0]['body'][:200], now.isoformat()))
            time.sleep(900)
        except: time.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_sync_loop, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

@app.get("/market/overview")
async def market_overview(): return await get_market_overview_internal()

@app.get("/market/events/{ticker}")
async def get_events(ticker: str):
    with db_session() as c:
        c.execute("SELECT id, ticker, type, description, resolution_date, status FROM pending_events WHERE ticker=? AND status='pending'", (ticker,))
        return [{"id": r[0], "ticker": r[1], "type": r[2], "description": r[3], "resolution_date": r[4], "status": r[5]} for r in c.fetchall()]

@app.post("/market/events")
async def create_event(data: Dict):
    with db_session() as c:
        c.execute("INSERT INTO pending_events (ticker, type, description, resolution_date, status) VALUES (?, ?, ?, ?, 'pending')",
                  (data['ticker'], data['event_type'], data['description'], data['expected_resolution_date']))
    return {"status": "success"}

@app.patch("/market/events/{event_id}")
async def resolve_event(event_id: int):
    with db_session() as c:
        c.execute("UPDATE pending_events SET status='resolved' WHERE id=?", (event_id,))
    return {"status": "success"}

@app.get("/market/fiidii")
async def get_fiidii():
    with db_session() as c:
        c.execute("SELECT date, fii_net, dii_net FROM fii_dii_flow ORDER BY date DESC LIMIT 5")
        return [{"date": r[0], "fii_net": r[1], "dii_net": r[2]} for r in c.fetchall()]

@app.get("/market/portfolio/summary")
async def portfolio_summary():
    with db_session() as c:
        c.execute("SELECT ticker, qty, price FROM portfolio")
        rows = c.fetchall()
    total_value = 0
    holdings = []
    for r in rows:
        ticker, qty, avg_price = r[0], r[1], r[2]
        try:
            h = yf.Ticker(ticker if ".NS" in ticker else f"{ticker}.NS").history(period="1d")
            cur = h['Close'].iloc[-1] if not h.empty else avg_price
        except: cur = avg_price
        total_value += (cur * qty)
        holdings.append({"ticker": ticker, "qty": qty, "avg_price": avg_price, "current_price": round(cur, 2), "pnl": round((cur - avg_price) * qty, 2)})
    return {"total_value": round(total_value, 2), "holdings": holdings}

@app.get("/market/traders/news")
async def whale_watch():
    year = datetime.now().year
    titans = ["Vijay Kedia", "Ashish Kacholia", "Mukul Agrawal"]
    results = []
    with DDGS() as ddgs:
        for t in titans:
            news = list(ddgs.text(f"'{t}' stock latest buy {year}", max_results=2))
            for n in news: results.append({"trader": t, "title": n.get('title'), "url": n.get('href')})
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
