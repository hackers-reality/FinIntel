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
        c.execute("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY, role TEXT, content TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, asset TEXT, type TEXT, msg TEXT, ts TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS fii_dii_flow (id INTEGER PRIMARY KEY, date TEXT UNIQUE, fii_net REAL, dii_net REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS titan_news (id INTEGER PRIMARY KEY, titan TEXT, title TEXT, url TEXT, ts TEXT)")
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

# ── Intelligence Mesh (NVIDIA > Groq > OpenAI) ───────────────────────
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
        base_urls = {
            "nvidia": "https://integrate.api.nvidia.com/v1",
            "groq": "https://api.groq.com/openai/v1",
            "openai": "https://api.openai.com/v1",
            "openrouter": "https://openrouter.ai/api/v1"
        }
        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_urls.get(provider))
        resp = await client.chat.completions.create(model=model, messages=messages, response_format={"type": "json_object"} if json_mode else None)
        return resp.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM Error: {str(e)}")
        return "{}"

# ── WebSocket Manager ────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self): self.active_connections: List[WebSocket] = []
    async def connect(self, ws: WebSocket): await ws.accept(); self.active_connections.append(ws)
    def disconnect(self, ws: WebSocket): self.active_connections.remove(ws)
    async def broadcast(self, msg: str):
        for c in self.active_connections:
            try: await c.send_text(msg)
            except: pass

manager = ConnectionManager()

# ── App Ignition ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_sync_loop, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

# ── WebSocket Price Stream ──────────────────────────────────────────
@app.websocket("/ws/prices")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            if is_market_open():
                tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "RELIANCE.NS", "HDFCBANK.NS"]
                prices = []
                for t in tickers:
                    try:
                        h = yf.Ticker(t).history(period="1d")
                        if not h.empty:
                            c, o = h['Close'].iloc[-1], h['Open'].iloc[0]
                            prices.append({"symbol": t, "price": round(c, 2), "change": round(((c-o)/o)*100, 2)})
                    except: pass
                await websocket.send_text(json.dumps({"Stocks": prices}))
            await asyncio.sleep(5)
    except WebSocketDisconnect: manager.disconnect(websocket)

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
    sectors = []
    for s, idx in {"Bank": "^CNXBANK", "IT": "^CNXIT", "Auto": "^CNXAUTO"}.items():
        try:
            h = yf.Ticker(idx).history(period="1d")
            if not h.empty: sectors.append({"name": s, "sentiment": round(((h['Close'].iloc[-1]-h['Open'].iloc[0])/h['Open'].iloc[0])*100, 2)})
        except: pass
    return {"Stocks": res, "categories": sectors, "market_status": "OPEN" if is_market_open() else "CLOSED"}

@app.get("/market/traders/news")
async def titan_news():
    with db_session() as c:
        c.execute("SELECT titan, title, url, ts FROM titan_news ORDER BY ts DESC LIMIT 10")
        return [{"titan": r[0], "title": r[1], "url": r[2], "date": r[3]} for r in c.fetchall()]

@app.get("/market/fiidii")
async def fii_dii_data():
    with db_session() as c:
        c.execute("SELECT date, fii_net, dii_net FROM fii_dii_flow ORDER BY date DESC LIMIT 10")
        return [{"date": r[0], "fii": r[1], "dii": r[2]} for r in c.fetchall()]

@app.get("/market/research/{ticker}")
async def deep_research(ticker: str):
    symbol = ticker if ".NS" in ticker else f"{ticker}.NS"
    t = yf.Ticker(symbol)
    info = t.info
    domain_query = " OR ".join([f"site:{d}" for d in ELITE_DOMAINS])
    search_query = f"({ticker} stock news OR filing) ({domain_query})"
    with DDGS() as ddgs: news = str(list(ddgs.text(search_query, max_results=5)))
    
    prompt = [
        {"role": "system", "content": "Return JSON with: Score (0-100), Verdict (Buy/Sell/Hold), Summary, Rationale, Strategy, Risks, Target, Moat."},
        {"role": "user", "content": f"Ticker: {ticker}. Data: {info}. News: {news}"}
    ]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

# ── Portfolio Management ───────────────────────────────────────────
@app.get("/market/portfolio/summary")
async def portfolio_summary():
    with db_session() as c:
        c.execute("SELECT ticker, qty, price FROM portfolio")
        holdings = c.fetchall()
    total_val = 0
    items = []
    for h in holdings:
        try:
            curr = yf.Ticker(h[0] if ".NS" in h[0] else f"{h[0]}.NS").history(period="1d")['Close'].iloc[-1]
            total_val += curr * h[1]
            items.append({"symbol": h[0], "qty": h[1], "avg_price": h[2], "curr_price": curr, "pnl": (curr - h[2]) * h[1]})
        except: pass
    return {"total_value": total_val, "holdings": items}

@app.post("/market/portfolio/holdings")
async def add_holding(data: Dict):
    with db_session() as c:
        c.execute("INSERT INTO portfolio (ticker, qty, price) VALUES (?, ?, ?)", (data['ticker'], data['qty'], data['price']))
    return {"status": "added"}

# ── Forensic Document Analysis ─────────────────────────────────────
@app.post("/analyze/document")
async def analyze_doc(file: UploadFile = File(...)):
    # Basic text extraction from filename for mock forensic
    prompt = [
        {"role": "system", "content": "Analyze this financial filing for hidden risks and fine print liabilities. Return JSON."},
        {"role": "user", "content": f"Document: {file.filename}. Scan for liabilities."}
    ]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

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

# ── Sentinel Sync Loop ──────────────────────────────────────────────
def sentinel_sync_loop():
    while True:
        try:
            now = datetime.now(IST)
            with DDGS() as ddgs:
                # 1. Titan News
                for t in TITANS:
                    res = list(ddgs.text(f"{t} latest investment news", max_results=1))
                    if res:
                        with db_session() as c:
                            c.execute("INSERT OR IGNORE INTO titan_news (titan, title, url, ts) VALUES (?, ?, ?, ?)", (t, res[0]['title'], res[0]['href'], now.isoformat()))
                
                # 2. FII/DII Scrape
                fii = list(ddgs.text("NSE FII DII cash market net flow today", max_results=1))
                if fii:
                    # Mock parsing for the net flow (In production, use nsepy or a real scraper)
                    with db_session() as c:
                        c.execute("INSERT OR IGNORE INTO fii_dii_flow (date, fii_net, dii_net) VALUES (?, ?, ?)", (now.date().isoformat(), random.uniform(-1000, 1000), random.uniform(-1000, 1000)))
            time.sleep(3600)
        except Exception as e:
            logger.error(f"Sentinel Error: {e}")
            time.sleep(300)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
