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
from kiteconnect import KiteConnect
import threading
import time
from fpdf import FPDF
import pyotp
from urllib.parse import urlparse, parse_qs

# ── Elite Domain Mesh ────────────────────────────────────────────────
ELITE_DOMAINS = [
    "moneycontrol.com", "economictimes.indiatimes.com", "livemint.com",
    "business-standard.com", "nseindia.com", "bseindia.com", "sebi.gov.in",
    "bqprime.com", "financialexpress.com", "ndtv.com/business"
]

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
        c.execute("CREATE TABLE IF NOT EXISTS pending_events (id INTEGER PRIMARY KEY, ticker TEXT, type TEXT, description TEXT, resolution_date TEXT, status TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS fii_dii_flow (id INTEGER PRIMARY KEY, date TEXT, fii_net REAL, dii_net REAL)")
        conn.commit()

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try: yield conn.cursor()
    finally: conn.commit(); conn.close()

# ── Intelligence Multi-Mesh (NVIDIA > Groq > Anthropic > OpenAI) ─────
async def call_llm(messages, json_mode=False):
    keys = {
        "nv": os.getenv("NVIDIA_API_KEY"),
        "gr": os.getenv("GROQ_API_KEY"),
        "an": os.getenv("ANTHROPIC_API_KEY"),
        "oa": os.getenv("OPENAI_API_KEY"),
        "gm": os.getenv("GEMINI_API_KEY")
    }
    
    # 1. NVIDIA NIM (Recommended: Free & Powerful)
    if keys["nv"]:
        try:
            client = openai.AsyncOpenAI(api_key=keys["nv"], base_url="https://integrate.api.nvidia.com/v1")
            resp = await client.chat.completions.create(model="meta/llama-3.1-405b-instruct", messages=messages, response_format={"type": "json_object"} if json_mode else None)
            return resp.choices[0].message.content
        except: pass
        
    # 2. Groq (High Speed Llama 3)
    if keys["gr"]:
        try:
            client = openai.AsyncOpenAI(api_key=keys["gr"], base_url="https://api.groq.com/openai/v1")
            resp = await client.chat.completions.create(model="llama3-70b-8192", messages=messages, response_format={"type": "json_object"} if json_mode else None)
            return resp.choices[0].message.content
        except: pass

    # 3. OpenAI Fallback
    if keys["oa"]:
        try:
            client = openai.AsyncOpenAI(api_key=keys["oa"])
            resp = await client.chat.completions.create(model="gpt-4o", messages=messages, response_format={"type": "json_object"} if json_mode else None)
            return resp.choices[0].message.content
        except: pass
        
    return "{}"

# ── Zerodha Autonomous Auth ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_sync_loop, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

@app.post("/settings/zerodha")
async def save_zerodha_creds(data: Dict):
    with db_session() as c:
        for k, v in data.items():
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, encrypt_v(v)))
    return {"status": "credentials encrypted and saved"}

@app.post("/market/zerodha/auth")
async def autonomous_auth():
    with db_session() as c:
        c.execute("SELECT key, value FROM settings WHERE key LIKE 'zerodha_%'")
        creds = {r[0]: decrypt_v(r[1]) for r in c.fetchall()}
    if not all(k in creds for k in ["zerodha_api_key", "zerodha_api_secret", "zerodha_user_id", "zerodha_password", "zerodha_totp_secret"]):
        raise HTTPException(status_code=400, detail="Incomplete credentials in vault")
    try:
        session = requests.Session()
        login_url = f"https://kite.zerodha.com/connect/login?v=3&api_key={creds['zerodha_api_key']}"
        res = session.get(login_url)
        res = session.post("https://kite.zerodha.com/api/login", data={"user_id": creds['zerodha_user_id'], "password": creds['zerodha_password']})
        request_id = res.json()['data']['request_id']
        totp = pyotp.TOTP(creds['zerodha_totp_secret']).now()
        res = session.post("https://kite.zerodha.com/api/twofa", data={"user_id": creds['zerodha_user_id'], "request_id": request_id, "twofa_value": totp, "twofa_type": "totp"})
        final_url = session.get(login_url).url
        request_token = parse_qs(urlparse(final_url).query).get('request_token', [None])[0]
        kite = KiteConnect(api_key=creds['zerodha_api_key'])
        data = kite.generate_session(request_token, api_secret=creds['zerodha_api_secret'])
        with db_session() as c:
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("zerodha_access_token", encrypt_v(data["access_token"])))
        send_toast("🛡️ NEXUS AUTHENTICATED", "Zerodha session synchronized successfully.")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/market/research/{ticker}")
@limiter.limit("10/hour")
async def deep_research(ticker: str, request: Request):
    t = yf.Ticker(ticker if ".NS" in ticker else f"{ticker}.NS")
    info = t.info
    domain_query = " OR ".join([f"site:{d}" for d in ELITE_DOMAINS])
    search_query = f"({ticker} stock news OR filing) ({domain_query})"
    with DDGS() as ddgs: news = str(list(ddgs.text(search_query, max_results=5)))
    prompt = [{"role": "system", "content": "Return JSON with EXACT keys: Score, Verdict, Summary, Investment_Rationale, Strategy, Risks, Target_Price, Moat_Score."},
              {"role": "user", "content": f"Ticker: {ticker}. Data: {info}. News Mesh: {news}"}]
    res = await call_llm(prompt, json_mode=True)
    return json.loads(res)

def sentinel_sync_loop():
    while True:
        try:
            now = datetime.now(IST)
            if is_market_open():
                vix = yf.Ticker("^INDIAVIX").history(period="1d")
                if not vix.empty and vix['Close'].iloc[-1] > 20:
                    send_toast("⚠️ VOLATILITY SPIKE", f"India VIX is at {round(vix['Close'].iloc[-1], 2)}. Reduce positions.")
                    with db_session() as c:
                        c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("VIX", "CRITICAL", "VOLATILITY SPIKE", now.isoformat()))
            if now.hour == 18 and now.minute <= 15:
                with DDGS() as ddgs:
                    news = list(ddgs.text("NSE India FII DII flow today net", max_results=1))
                    if news:
                        send_toast("📡 INSTITUTIONAL FLOW", "New FII/DII data available.")
                        with db_session() as c:
                            c.execute("INSERT INTO notifications (asset, type, msg, ts) VALUES (?, ?, ?, ?)", ("MARKET", "FII_DII", news[0]['body'][:200], now.isoformat()))
            time.sleep(900)
        except: time.sleep(60)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
