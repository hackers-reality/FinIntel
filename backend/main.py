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
        c.execute("CREATE TABLE IF NOT EXISTS morning_briefs (id INTEGER PRIMARY KEY, date TEXT, content TEXT)")
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
    
    if not api_key: return "API Key Missing"
    try:
        client = openai.AsyncOpenAI(api_key=api_key)
        resp = await client.chat.completions.create(model="gpt-4o", messages=messages, response_format={"type": "json_object"} if json_mode else None)
        return resp.choices[0].message.content
    except Exception as e: return f"Error: {str(e)}"

# ── Market Data Synthesis ────────────────────────────────────────────
async def get_market_overview_internal():
    kite = get_kite_client()
    favs = ["^NSEI", "^BSESN", "^INDIAVIX"]
    stocks = []
    
    for t in favs:
        try:
            h = yf.Ticker(t).history(period="1d")
            if not h.empty:
                cur, op = h['Close'].iloc[-1], h['Open'].iloc[0]
                stocks.append({"symbol": t, "price": cur, "change": ((cur-op)/op)*100})
        except: pass
    
    sectors = []
    for s, idx in {"Nifty Bank": "^CNXBANK", "Nifty IT": "^CNXIT", "Nifty Auto": "^CNXAUTO"}.items():
        try:
            h = yf.Ticker(idx).history(period="1d")
            if not h.empty: sectors.append({"name": s, "sentiment": ((h['Close'].iloc[-1]-h['Open'].iloc[0])/h['Open'].iloc[0])*100})
        except: pass
        
    return {"Stocks": stocks, "categories": sectors, "market_status": "OPEN" if is_market_open() else "CLOSED"}

# ── Background Task Runner (Sentinel) ────────────────────────────────
def sentinel_thread():
    """Sync Sentinel Thread for News & Market Hours Awareness"""
    while True:
        try:
            now = datetime.now(IST)
            log_system(f"Sentinel Pulse: {now.isoformat()}")
            
            # Scrape FII/DII at 6 PM
            if now.hour == 18 and now.minute == 0:
                with DDGS() as ddgs:
                    fii = list(ddgs.text("FII DII net buy sell today NSE India", max_results=1))
                    if fii:
                        with db_session() as c:
                            c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("FII/DII", "STRATEGIC", fii[0]['body'][:200], now.isoformat()))
            
            # VIX Monitoring every 5 min
            if is_market_open() and now.minute % 5 == 0:
                vix = yf.Ticker("^INDIAVIX").history(period="1d")
                if not vix.empty and vix['Close'].iloc[-1] > 20:
                    with db_session() as c:
                        c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("VIX", "CRITICAL", "HIGH VOLATILITY - REDUCE POSITION SIZE", now.isoformat()))
            
            time.sleep(900) # Run every 15 min
        except Exception as e:
            log_system(f"Sentinel Error: {str(e)}", "ERROR")
            time.sleep(60)

import threading
import time

# ── App Definition ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_thread, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

@app.get("/market/overview")
async def market_overview(): return await get_market_overview_internal()

@app.get("/market/zerodha/holdings")
async def zerodha_holdings():
    kite = get_kite_client()
    if not kite: return []
    try: return kite.holdings()
    except: return []

@app.post("/analyze/document")
async def analyze_document(data: Dict):
    text = data.get("text", "")
    prompt = [{"role": "system", "content": "You are a legal financial analyst. Extract risk clauses, court cases, regulatory flags, and sentiment verdict in JSON."},
              {"role": "user", "content": text}]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

@app.get("/market/behavior/{ticker}")
async def get_behavior(ticker: str):
    t = yf.Ticker(ticker if ".NS" in ticker else f"{ticker}.NS")
    h = t.history(period="20d")
    if h.empty: return {"status": "NEUTRAL"}
    
    vol_avg = h['Volume'].mean()
    vol_today = h['Volume'].iloc[-1]
    score = (vol_today / vol_avg)
    
    pattern = "CONSOLIDATION"
    if h['Close'].iloc[-1] > h['Close'].max() * 0.98: pattern = "BREAKOUT"
    elif h['Close'].iloc[-1] < h['Close'].min() * 1.02: pattern = "DISTRIBUTION"
    
    return {
        "score": round(score, 2),
        "pattern": pattern,
        "status": "ACCUMULATION" if score > 1.5 and h['Close'].iloc[-1] > h['Open'].iloc[-1] else "NEUTRAL"
    }

@app.get("/market/events/{ticker}")
async def get_events(ticker: str):
    with db_session() as c:
        c.execute("SELECT type, description, resolution_date, status FROM pending_events WHERE ticker = ? AND status = 'pending'", (ticker,))
        return [{"type": r[0], "desc": r[1], "date": r[2], "status": r[3]} for r in c.fetchall()]

@app.post("/market/events")
async def create_event(data: Dict):
    with db_session() as c:
        c.execute("INSERT INTO pending_events (ticker, type, description, resolution_date, status) VALUES (?, ?, ?, ?, ?)",
                  (data['ticker'], data['type'], data['desc'], data['date'], 'pending'))
    return {"status": "success"}

@app.get("/market/research/{ticker}")
@limiter.limit("10/hour")
async def deep_research(ticker: str, request: Request):
    # Expanded Research with actual data
    t = yf.Ticker(ticker if ".NS" in ticker else f"{ticker}.NS")
    info = t.info
    news = ""
    with DDGS() as ddgs:
        news = str(list(ddgs.text(f"{ticker} stock news today", max_results=3)))
    
    prompt = [{"role": "system", "content": "Analyze ticker with data. Return JSON: Score, Verdict, Summary, Investment_Rationale, Strategy, Risks, Target_Price, Moat_Score."},
              {"role": "user", "content": f"Data: {info}. News: {news}"}]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
