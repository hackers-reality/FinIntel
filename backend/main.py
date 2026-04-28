import os
import json
import asyncio
import threading
import sqlite3
import time
import random
import requests
import math
import yfinance as yf
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager, contextmanager
import uvicorn
from duckduckgo_search import DDGS
from dotenv import load_dotenv, set_key
from datetime import datetime
import openai
import anthropic
from cryptography.fernet import Fernet

# ── Setup ────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), ".env")
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "finintel.db")
SETTINGS_PATH = os.path.join(os.path.dirname(BASE_DIR), "settings.json")
LOG_PATH = os.path.join(BASE_DIR, "system.log")

load_dotenv(ENV_PATH)

# Encryption Engine
def get_fernet():
    key_path = os.path.join(os.path.dirname(BASE_DIR), "secret.key")
    if not os.path.exists(key_path):
        key = Fernet.generate_key()
        with open(key_path, "wb") as f: f.write(key)
    with open(key_path, "rb") as f: return Fernet(f.read())

cipher = get_fernet()

def encrypt_val(val: str) -> str:
    return cipher.encrypt(val.encode()).decode() if val else ""

def decrypt_val(val: str) -> str:
    try: return cipher.decrypt(val.encode()).decode() if val else ""
    except: return ""

# ── Database Engine ──────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS chat_history 
                     (id INTEGER PRIMARY KEY, role TEXT, content TEXT, timestamp TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS semantic_memory 
                     (id INTEGER PRIMARY KEY, key TEXT, value TEXT, importance INTEGER)""")
        c.execute("""CREATE TABLE IF NOT EXISTS research_history 
                     (id INTEGER PRIMARY KEY, ticker TEXT, data TEXT, timestamp TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS saved_opportunities 
                     (id INTEGER PRIMARY KEY, ticker TEXT, reason TEXT, timestamp TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS notifications 
                     (id INTEGER PRIMARY KEY, asset TEXT, event_type TEXT, message TEXT, timestamp TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS price_alerts 
                     (id INTEGER PRIMARY KEY, ticker TEXT, target REAL, condition TEXT, active INTEGER)""")
        conn.commit()

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try: yield conn.cursor()
    finally: conn.commit(); conn.close()

# ── Memory & Intelligence ────────────────────────────────────────────
def log_system(msg):
    with open(LOG_PATH, "a") as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

# ── Elite Financial Source Matrix ─────────────
ELITE_SOURCES = [
    "economictimes.indiatimes.com", "livemint.com", "moneycontrol.com", "business-standard.com",
    "ndtvprofit.com", "zeebiz.com", "thehindubusinessline.com", "businesstoday.in",
    "financialexpress.com", "pulse.zerodha.com", "forbesindia.com", "bqprime.com",
    "businessinsider.in", "timesofindia.indiatimes.com", "ibef.org", "the-ken.com",
    "finshots.in", "capitalmind.in", "freefincal.com", "in.investing.com",
    "nseindia.com", "bseindia.com", "mcxindia.com", "ncdex.com", "sebi.gov.in",
    "rbi.org.in", "equitymaster.com", "tradebrains.in", "tickertape.in", "groww.in",
    "5paisa.com", "investorji.in", "myinvestmentideas.com", "alphaideas.in",
    "tavaga.com", "gauravblog.com", "brameshtechanalysis.com", "gale.in",
    "abovestocks.com", "investmentguruindia.com", "smartinvestor.in", "equitypandit.com",
    "icicidirect.com", "hdfcsec.com", "angelone.in", "sharekhan.com",
    "rmoneyindia.com", "coindcx.com", "wazirx.com", "tradingview.com"
]

# ── Global Settings ──────────────────────────────────────────────────
def load_settings():
    if os.path.exists(SETTINGS_PATH):
        with open(SETTINGS_PATH, "r") as f: return json.load(f)
    return {"llm_provider": "openai", "llm_model": "gpt-4o", "favorites": ["^NSEI"], "notifications_enabled": True}

settings = load_settings()

# ── Multi-Provider Mesh Logic ──────────────────────────────────────────
PROVIDER_PRIORITY = ["nvidia", "openai", "anthropic", "groq", "gemini"]

async def call_llm(messages: List[Dict[str, str]], json_mode: bool = False, task_type: str = "general", forced_settings: Optional[Dict] = None):
    active_settings = forced_settings or settings
    primary_provider = active_settings.get("llm_provider", "openai")
    
    TASK_MODELS = {
        "sentinel": {"groq": "llama-3.1-70b-versatile", "nvidia": "meta/llama-3.1-70b-instruct", "anthropic": "claude-3-haiku-20240307"},
        "research": {"nvidia": "meta/llama-3.1-70b-instruct", "openai": "gpt-4o", "anthropic": "claude-3-5-sonnet-20240620"},
        "general": {"openai": "gpt-4o", "groq": "llama-3.1-70b-versatile", "gemini": "gemini-1.5-pro"}
    }

    providers_to_try = [primary_provider] + [p for p in PROVIDER_PRIORITY if p != primary_provider]
    
    for provider in providers_to_try:
        raw_key = os.getenv(f"{provider.upper()}_API_KEY") or active_settings.get(f"{provider}_api_key")
        if not raw_key: continue
        
        api_key = decrypt_val(raw_key)
        model = TASK_MODELS.get(task_type, {}).get(provider) or active_settings.get("llm_model")
        if not model: continue

        for attempt in range(3):
            try:
                if provider in ["openai", "groq", "nvidia"]:
                    base_url = None
                    if provider == "groq": base_url = "https://api.groq.com/openai/v1"
                    elif provider == "nvidia": base_url = "https://integrate.api.nvidia.com/v1"
                    
                    client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
                    args = {"model": model, "messages": messages, "timeout": 20.0}
                    if json_mode: args["response_format"] = {"type": "json_object"}
                    
                    res = await client.chat.completions.create(**args)
                    content = res.choices[0].message.content
                    return json.loads(content) if json_mode else content
                
                if provider == "anthropic":
                    client = anthropic.AsyncAnthropic(api_key=api_key)
                    sys_msg = next((m["content"] for m in messages if m["role"] == "system"), "Expert Advisor")
                    filtered = [m for m in messages if m["role"] != "system"]
                    res = await client.messages.create(model=model, system=sys_msg, messages=filtered, max_tokens=2048)
                    content = res.content[0].text
                    return json.loads(content) if json_mode else content
                    
            except Exception as e:
                log_system(f"Attempt {attempt+1} failed for {provider}: {e}")
                await asyncio.sleep(2)
        
    return {"error": "CRITICAL: Sovereign mesh failed. All providers exhausted."}

# ── Data Sanitizer ───────────────────────────────────────────────────
def sanitize_data(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj): return 0
        return obj
    if isinstance(obj, dict): return {k: sanitize_data(v) for k, v in obj.items()}
    if isinstance(obj, list): return [sanitize_data(x) for x in obj]
    return obj

# ── Market Logic ─────────────────────────────────────────────────────
class SmartCache:
    _store = {}
    
    @classmethod
    def set(cls, key, val): cls._store[key] = (val, time.time())
    
    @classmethod
    def get(cls, key, ttl=60):
        if key in cls._store:
            val, ts = cls._store[key]
            if time.time() - ts < ttl: return val
        return None

async def get_market_overview_internal():
    cached = SmartCache.get("overview", ttl=60)
    if cached: return cached
    
    favs = settings.get("favorites", ["^NSEI", "RELIANCE.NS", "TCS.NS", "BTC-INR", "ETH-INR"])
    results = []
    for ticker in favs:
        try:
            t = yf.Ticker(ticker)
            h = t.history(period="1d")
            if h.empty: continue
            cur = h['Close'].iloc[-1]
            prev = h['Open'].iloc[0]
            change = ((cur - prev) / prev) * 100
            results.append({
                "symbol": ticker,
                "price": round(cur, 2),
                "change": round(change, 2),
                "high": round(h['High'].max(), 2),
                "low": round(h['Low'].min(), 2)
            })
        except: continue
    
    # Mocking categories for UI alignment
    final_data = {
        "Stocks": results,
        "categories": [
            {"name": "Energy", "sentiment": random.randint(30, 90)},
            {"name": "Tech", "sentiment": random.randint(30, 90)},
            {"name": "Finance", "sentiment": random.randint(30, 90)},
            {"name": "Crypto", "sentiment": random.randint(30, 90)}
        ]
    }
    SmartCache.set("overview", final_data)
    return final_data

# ── Background Sentinel ──────────────────────────────────────────────
async def autonomous_sentinel_news():
    if not settings.get("notifications_enabled", True): return
    log_system("Sentinel Scanning Elite Matrix...")
    try:
        with DDGS() as ddgs:
            sampled = random.sample(ELITE_SOURCES, 5)
            curr_date = datetime.now().strftime("%B %Y")
            queries = [f"site:{s} market breaking news {curr_date}" for s in sampled]
            
            raw_news = []
            for q in queries:
                try: raw_news.extend(list(ddgs.text(q, max_results=2)))
                except: continue
            
            if not raw_news: return
            
            snippets = [f"{n['title']}: {n['body']}" for n in raw_news]
            prompt = [{"role": "system", "content": "You are a market sentinel. Identify critical triggers."},
                      {"role": "user", "content": f"Analyze these news snippets and return a JSON list of alerts: {snippets[:10]}"}]
            
            alerts = await call_llm(prompt, json_mode=True, task_type="sentinel")
            if isinstance(alerts, list):
                with db_session() as c:
                    for a in alerts:
                        c.execute("INSERT INTO notifications (asset, event_type, message, timestamp) VALUES (?, ?, ?, ?)",
                                  (a.get("asset", "Market"), "Intelligence Trigger", a.get("message"), datetime.now().isoformat()))
    except Exception as e: log_system(f"Sentinel Error: {e}")

def sentinel_thread():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    while True:
        loop.run_until_complete(autonomous_sentinel_news())
        time.sleep(900)

# ── FastAPI App ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    threading.Thread(target=sentinel_thread, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/market/overview")
async def get_overview():
    data = await get_market_overview_internal()
    return sanitize_data(data)

@app.get("/market/chart/{ticker}")
async def get_chart(ticker: str):
    cached = SmartCache.get(f"chart_{ticker}", ttl=60)
    if cached: return sanitize_data(cached)
    
    sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
    try:
        t = yf.Ticker(sym)
        h = t.history(period="1mo", interval="1d")
        if h.empty: return []
        chart = []
        for i, row in h.iterrows():
            chart.append({
                "time": i.strftime("%Y-%m-%d"),
                "open": row['Open'],
                "high": row['High'],
                "low": row['Low'],
                "close": row['Close'],
                "volume": row['Volume']
            })
        SmartCache.set(f"chart_{ticker}", chart)
        return sanitize_data(chart)
    except: return []

@app.get("/market/notifications")
async def get_notifications():
    with db_session() as c:
        c.execute("SELECT asset, event_type, message, timestamp FROM notifications ORDER BY id DESC LIMIT 20")
        rows = c.fetchall()
    return [{"asset": r[0], "type": r[1], "message": r[2], "time": r[3]} for r in rows]

@app.get("/market/research/{ticker}")
async def deep_research(ticker: str):
    sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
    try:
        t = yf.Ticker(sym)
        info = await asyncio.to_thread(lambda: t.info)
        
        with DDGS() as ddgs:
            sampled = random.sample(ELITE_SOURCES, 3)
            news = list(ddgs.text(f"site:{sampled[0]} {ticker} analysis", max_results=3))
        
        prompt = [{"role": "system", "content": "Analyze investment quality."},
                  {"role": "user", "content": f"Data: {info.get('longBusinessSummary','')} | News: {news}"}]
        
        res = await call_llm(prompt, json_mode=True, task_type="research")
        res["provider"] = settings.get("llm_provider") # Track which mesh node worked
        return res
    except Exception as e: return {"error": str(e)}

@app.get("/settings")
async def get_settings():
    return settings

@app.post("/settings")
async def save_settings(new_settings: Dict[str, Any]):
    global settings
    for k, v in new_settings.items():
        if "_api_key" in k and v and not v.startswith("gAAAA"):
            new_settings[k] = encrypt_val(v)
    settings.update(new_settings)
    with open(SETTINGS_PATH, "w") as f: json.dump(settings, f)
    return {"status": "success"}

@app.post("/settings/verify")
async def verify_settings(data: Dict[str, Any]):
    provider, model, key = data.get("provider"), data.get("model"), data.get("key")
    test_settings = {"llm_provider": provider, "llm_model": model, f"{provider}_api_key": key}
    res = await call_llm([{"role": "user", "content": "ping"}], forced_settings=test_settings)
    if isinstance(res, dict) and "error" in res: return {"status": "error", "message": res["error"]}
    return {"status": "success", "message": f"Verified via {provider}"}

@app.post("/chat")
async def chat_advisor(data: Dict[str, Any]):
    msg = data.get("message")
    prompt = [{"role": "system", "content": "You are the FinIntel Sovereign Advisor."},
              {"role": "user", "content": msg}]
    response = await call_llm(prompt)
    
    with db_session() as c:
        c.execute("INSERT INTO chat_history (role, content, timestamp) VALUES (?, ?, ?)", ("user", msg, datetime.now().isoformat()))
        c.execute("INSERT INTO chat_history (role, content, timestamp) VALUES (?, ?, ?)", ("assistant", str(response), datetime.now().isoformat()))
    
    return {"response": str(response)}

@app.get("/chat/history")
async def get_chat_history():
    with db_session() as c:
        c.execute("SELECT role, content, timestamp FROM chat_history ORDER BY id ASC LIMIT 50")
        rows = c.fetchall()
    return [{"role": r[0], "content": r[1], "time": r[2]} for r in rows]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
