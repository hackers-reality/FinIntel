import os
import json
import asyncio
import logging
import sqlite3
import pytz
import random
import requests
import yfinance as yf
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, UploadFile, File
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
from kiteconnect import KiteConnect
import threading
import time
from fpdf import FPDF
import pyotp
from urllib.parse import urlparse, parse_qs

# ── Elite Domain Mesh ────────────────────────────────────────────────
ELITE_DOMAINS = [
    "moneycontrol.com", "economictimes.indiatimes.com", "livemint.com",
    "business-standard.com", "nseindia.com", "bseindia.com", "sebi.gov.in"
]
TITANS = ["Vijay Kedia", "Ashish Kacholia", "Mukul Agrawal", "Rakesh Jhunjhunwala Portfolio"]

# ── Native Windows Notifications ─────────────────────────────────────
try:
    from winotify import Notification
    HAS_NOTIFY = True
except ImportError:
    HAS_NOTIFY = False

def send_toast(title, msg):
    if HAS_NOTIFY:
        try:
            toast = Notification(app_id="Sovereign Nexus", title=title, msg=msg, duration="long")
            toast.show()
        except: pass

# ── Structured Logging ───────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NexusKernel")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
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
        c.execute("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY, ticker TEXT, role TEXT, content TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, asset TEXT, type TEXT, msg TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS fii_dii_flow (id INTEGER PRIMARY KEY, date TEXT UNIQUE, fii_net REAL, dii_net REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS titan_news (id INTEGER PRIMARY KEY, titan TEXT, title TEXT, url TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS bulk_deals (id INTEGER PRIMARY KEY, ticker TEXT, client TEXT, qty REAL, price REAL, type TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS pending_events (id INTEGER PRIMARY KEY, ticker TEXT, type TEXT, description TEXT, ts TEXT)")
        conn.commit()

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try: yield conn.cursor()
    finally: conn.commit(); conn.close()

# ── Intelligence Multi-Mesh (NVIDIA > Groq > OpenAI) ─────
async def call_llm(messages, json_mode=False):
    with db_session() as c:
        c.execute("SELECT key, value FROM settings WHERE key IN ('active_provider', 'active_model')")
        config = {r[0]: decrypt_v(r[1]) for r in c.fetchall()}
        provider = config.get('active_provider', 'nvidia')
        model = config.get('active_model', 'meta/llama-3.1-405b-instruct')
        c.execute(f"SELECT value FROM settings WHERE key='{provider}_api_key'")
        res = c.fetchone()
        api_key = decrypt_v(res[0]) if res else os.getenv(f"{provider.upper()}_API_KEY")

    if not api_key: return "{}"

    try:
        base_urls = {"nvidia": "https://integrate.api.nvidia.com/v1", "groq": "https://api.groq.com/openai/v1", "openai": "https://api.openai.com/v1", "openrouter": "https://openrouter.ai/api/v1"}
        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_urls.get(provider))
        resp = await client.chat.completions.create(model=model, messages=messages, response_format={"type": "json_object"} if json_mode else None)
        return resp.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM Error: {str(e)}")
        return "{}"

# ── App Ignition ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_sync_loop, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

# ── Market & Research Endpoints ─────────────────────────────────────
@app.get("/market/overview")
async def market_overview():
    tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "USDINR=X"]
    res = []
    for t in tickers:
        try:
            h = yf.Ticker(t).history(period="1d")
            if not h.empty:
                c, o = h['Close'].iloc[-1], h['Open'].iloc[0]
                res.append({"symbol": t, "price": c, "change": ((c-o)/o)*100})
        except: pass
    return {"Stocks": res, "market_status": "OPEN" if dtime(9,15) <= datetime.now(IST).time() <= dtime(15,30) else "CLOSED"}

@app.get("/market/research/{ticker}")
async def deep_research(ticker: str):
    symbol = ticker if ".NS" in ticker else f"{ticker}.NS"
    t = yf.Ticker(symbol)
    info = t.info
    domain_query = " OR ".join([f"site:{d}" for d in ELITE_DOMAINS])
    search_query = f"({ticker} stock news OR filing) ({domain_query})"
    with DDGS() as ddgs: news = str(list(ddgs.text(search_query, max_results=5)))
    prompt = [{"role": "system", "content": "Return JSON with: Score (0-100), Verdict, Summary, Rationale, Strategy, Risks, Target, Moat."}, {"role": "user", "content": f"Ticker: {ticker}. Data: {info}. News: {news}"}]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

@app.get("/market/behavior/{ticker}")
async def behavior_analysis(ticker: str):
    # Restoring Accumulation Logic
    prompt = [{"role": "system", "content": "Analyze ticker behavior. Return JSON: status (ACCUMULATION/DISTRIBUTION), sentiment, whales_buying (boolean)."},
              {"role": "user", "content": f"Ticker: {ticker}. Analyzing current volume and price action patterns."}]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

# ── Portfolio Restoration ──────────────────────────────────────────
@app.post("/market/portfolio/holdings")
async def update_portfolio(data: Dict):
    with db_session() as c:
        c.execute("INSERT INTO portfolio (ticker, qty, price) VALUES (?, ?, ?)", (data['ticker'], float(data['qty']), float(data['price'])))
    return {"status": "portfolio updated"}

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
            cur_price = h['Close'].iloc[-1] if not h.empty else avg_price
        except: cur_price = avg_price
        pnl = (cur_price - avg_price) * qty
        total_value += (cur_price * qty)
        holdings.append({"symbol": ticker, "qty": qty, "avg_price": avg_price, "curr_price": round(cur_price, 2), "pnl": round(pnl, 2)})
    return {"total_value": round(total_value, 2), "holdings": holdings}

# ── Forensic Document Analysis ─────────────────────────────────────
@app.post("/analyze/document")
async def analyze_document(data: Dict):
    # RESTORED: Dad's "Fine Print" Scanner
    prompt = [{"role": "system", "content": "Analyze document for fine print. Return JSON: risk_clauses, court_case_mentions, regulatory_flags, sentiment_verdict."},
              {"role": "user", "content": data.get("text", "")}]
    res_str = await call_llm(prompt, json_mode=True)
    return json.loads(res_str)

# ── Zerodha Tactical Sync ───────────────────────────────────────────
@app.post("/market/zerodha/auth")
async def autonomous_auth():
    with db_session() as c:
        c.execute("SELECT key, value FROM settings WHERE key LIKE 'zerodha_%'")
        creds = {r[0]: decrypt_v(r[1]) for r in c.fetchall()}
    try:
        session = requests.Session()
        login_url = f"https://kite.zerodha.com/connect/login?v=3&api_key={creds['zerodha_api_key']}"
        session.get(login_url)
        res = session.post("https://kite.zerodha.com/api/login", data={"user_id": creds['zerodha_user_id'], "password": creds['zerodha_password']})
        rid = res.json()['data']['request_id']
        totp = pyotp.TOTP(creds['zerodha_totp_secret']).now()
        session.post("https://kite.zerodha.com/api/twofa", data={"user_id": creds['zerodha_user_id'], "request_id": rid, "twofa_value": totp, "twofa_type": "totp"})
        final_url = session.get(login_url).url
        token = parse_qs(urlparse(final_url).query).get('request_token', [None])[0]
        kite = KiteConnect(api_key=creds['zerodha_api_key'])
        data = kite.generate_session(token, api_secret=creds['zerodha_api_secret'])
        with db_session() as c: c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("zerodha_access_token", encrypt_v(data["access_token"])))
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/zerodha/holdings")
async def get_zerodha_holdings():
    with db_session() as c:
        c.execute("SELECT value FROM settings WHERE key='zerodha_api_key'")
        api_key = decrypt_v(c.fetchone()[0])
        c.execute("SELECT value FROM settings WHERE key='zerodha_access_token'")
        access_token = decrypt_v(c.fetchone()[0])
    kite = KiteConnect(api_key=api_key)
    kite.set_access_token(access_token)
    return kite.holdings()

# ── Settings & Vault ───────────────────────────────────────────────
@app.post("/settings/vault")
async def vault_settings(data: Dict):
    with db_session() as c:
        for k, v in data.items(): c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, encrypt_v(v)))
    return {"status": "success"}

@app.get("/settings/verify/{provider}")
async def verify_key(provider: str, key: str):
    try:
        base_urls = {"nvidia": "https://integrate.api.nvidia.com/v1", "groq": "https://api.groq.com/openai/v1", "openai": "https://api.openai.com/v1"}
        client = openai.OpenAI(api_key=key, base_url=base_urls.get(provider))
        client.models.list()
        return {"status": "valid"}
    except: return {"status": "invalid"}

# ── Sentinel Sync Loop ──────────────────────────────────────────────
def sentinel_sync_loop():
    while True:
        try:
            now = datetime.now(IST)
            with DDGS() as ddgs:
                for t in TITANS:
                    res = list(ddgs.text(f"{t} latest investment news", max_results=1))
                    if res:
                        with db_session() as c:
                            c.execute("INSERT OR IGNORE INTO titan_news (titan, title, url, ts) VALUES (?, ?, ?, ?)", (t, res[0]['title'], res[0]['href'], now.isoformat()))
            time.sleep(3600)
        except: time.sleep(300)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
