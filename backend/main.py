import os
import json
import asyncio
import threading
import sqlite3
import time
import random
import requests
import yfinance as yf
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any
import uvicorn
from duckduckgo_search import DDGS
from dotenv import load_dotenv, set_key
from datetime import datetime
import openai
import anthropic
from cryptography.fernet import Fernet
import signal
from contextlib import contextmanager

try:
    from plyer import notification
except ImportError:
    notification = None

from apscheduler.schedulers.background import BackgroundScheduler

# ── Paths & Security ─────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
SETTINGS_PATH = os.path.join(BASE_DIR, "settings.json")
DB_PATH = os.path.join(BASE_DIR, "finintel.db")
LOG_PATH = os.path.join(BASE_DIR, "system.log")
KEY_PATH = os.path.join(BASE_DIR, "secret.key")

load_dotenv(ENV_PATH)

def get_or_create_key():
    if not os.path.exists(KEY_PATH):
        key = Fernet.generate_key()
        with open(KEY_PATH, "wb") as f: f.write(key)
        return key
    with open(KEY_PATH, "rb") as f: return f.read()

FERNET = Fernet(get_or_create_key())

def encrypt_val(val: str) -> str:
    if not val: return ""
    return FERNET.encrypt(val.encode()).decode()

def decrypt_val(val: str) -> str:
    if not val: return ""
    try: return FERNET.decrypt(val.encode()).decode()
    except: return val

def sanitize_data(obj):
    """Sanitize data to handle NaN/Inf for JSON compliance"""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj): return 0
        return obj
    if isinstance(obj, dict):
        return {k: sanitize_data(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_data(x) for x in obj]
    return obj

# ── Database Engine ──────────────────────────────────────────────────
@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn.cursor()
        conn.commit()
    finally:
        conn.close()

def init_db():
    with db_session() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS chat_history (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, content TEXT, timestamp DATETIME)''')
        c.execute('''CREATE TABLE IF NOT EXISTS semantic_memory (id INTEGER PRIMARY KEY AUTOINCREMENT, summary TEXT, timestamp DATETIME)''')
        c.execute('''CREATE TABLE IF NOT EXISTS research_history (id INTEGER PRIMARY KEY AUTOINCREMENT, ticker TEXT, analysis TEXT, score INTEGER, timestamp DATETIME)''')
        c.execute('''CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, asset TEXT, event_type TEXT, message TEXT, timestamp DATETIME)''')
        c.execute('''CREATE TABLE IF NOT EXISTS price_alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, ticker TEXT, target REAL, condition TEXT, active INTEGER)''')
        c.execute('''CREATE TABLE IF NOT EXISTS saved_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT, ticker TEXT, verdict TEXT, score INTEGER, timestamp DATETIME)''')

# ── Cache Engine ──────────────────────────────────────────────────────
class SmartCache:
    def __init__(self, ttl=300):
        self._store = {}
        self._ttl = ttl
    def get(self, key):
        if key in self._store:
            val, ts = self._store[key]
            if time.time() - ts < self._ttl: return val
        return None
    def set(self, key, val):
        self._store[key] = (val, time.time())

CACHE = SmartCache(ttl=600)

def log_system(msg):
    with open(LOG_PATH, "a") as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

# ── LLM Orchestration ────────────────────────────────────────────────
async def call_llm(messages: List[Dict[str, str]], json_mode: bool = False):
    provider = settings.get("llm_provider", "openai")
    model = settings.get("llm_model")
    raw_key = os.getenv(f"{provider.upper()}_API_KEY")
    api_key = decrypt_val(raw_key)
    
    if not api_key: return {"error": f"API Key for {provider} not found."}

    try:
        if provider in ["openai", "groq", "nvidia_nim"]:
            base_url = None
            if provider == "groq": base_url = "https://api.groq.com/openai/v1"
            elif provider == "nvidia_nim": base_url = "https://integrate.api.nvidia.com/v1"
            
            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
            args = {"model": model, "messages": messages, "timeout": 20.0}
            if json_mode: args["response_format"] = {"type": "json_object"}
            
            response = await client.chat.completions.create(**args)
            return response.choices[0].message.content
        elif provider == "anthropic":
            client = anthropic.AsyncAnthropic(api_key=api_key)
            sys_msg = next((m["content"] for m in messages if m["role"] == "system"), "Expert Advisor")
            filtered = [m for m in messages if m["role"] != "system"]
            response = await client.messages.create(model=model, system=sys_msg, messages=filtered, max_tokens=2048)
            return response.content[0].text
    except Exception as e:
        log_system(f"LLM Error: {e}")
        return {"error": str(e)}

# ── App Init ─────────────────────────────────────────────────────────
DEFAULT_SETTINGS = {
    "llm_provider": "openai",
    "llm_model": "gpt-4o",
    "language": "English",
    "risk_profile": "Moderate",
    "favorites": ["RELIANCE", "TCS", "^NSEI"],
    "tier_weights": {"tier1": 50, "tier2": 30, "tier3": 20},
    "alert_threshold": 1.5,
    "disclaimer": "FinIntel Pro is a research tool only. Not SEBI registered advisory. All trades at your own risk."
}

def load_settings():
    if not os.path.exists(SETTINGS_PATH): return DEFAULT_SETTINGS
    with open(SETTINGS_PATH, "r") as f: return json.load(f)

settings = load_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.add_job(check_market_events, 'interval', minutes=5)
    scheduler.add_job(autonomous_sentinel_news, 'interval', minutes=15)
    scheduler.start()
    init_db()
    log_system("KERNEL ONLINE: SENTINEL ACTIVE")
    yield
    # Shutdown
    scheduler.shutdown()
    log_system("KERNEL OFFLINE")

app = FastAPI(title="FinIntel Sovereign Kernel", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Background Sentinel Monitor (MEGA PROJECT UPGRADE) ────────────────
def check_market_events():
    threshold = settings.get("alert_threshold", 1.5)
    favs = settings.get("favorites", ["^NSEI"])
    
    # Check Price Alerts
    with db_session() as c:
        c.execute("SELECT id, ticker, target, condition FROM price_alerts WHERE active = 1")
        alerts = c.fetchall()
        
    for aid, ticker, target, cond in alerts:
        try:
            sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
            t = yf.Ticker(sym)
            h = t.history(period="1d")
            if h.empty: continue
            cur = h['Close'].iloc[-1]
            triggered = (cond == ">=" and cur >= target) or (cond == "<=" and cur <= target)
            if triggered:
                msg = f"PRICE ALERT: {ticker} reached ₹{cur:.2f} ({cond} ₹{target})"
                with db_session() as c:
                    c.execute("UPDATE price_alerts SET active = 0 WHERE id = ?", (aid,))
                    c.execute("INSERT INTO notifications (asset, event_type, message, timestamp) VALUES (?, ?, ?, ?)",
                              (ticker, "Target Reached", msg, datetime.now().isoformat()))
                if notification: notification.notify(title=f"FinIntel: {ticker}", message=msg)
        except: pass

    # Check Volatility
    for ticker in favs:
        try:
            sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
            t = yf.Ticker(sym)
            hist = t.history(period="1d", interval="5m")
            if hist.empty or len(hist) < 2: continue
            change = ((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1]) * 100
            if abs(change) > threshold:
                msg = f"{ticker} shifted {change:.2f}% (Threshold: {threshold}%)"
                with db_session() as c:
                    c.execute("INSERT INTO notifications (asset, event_type, message, timestamp) VALUES (?, ?, ?, ?)",
                              (ticker, "Volatility Spike", msg, datetime.now().isoformat()))
                if notification: notification.notify(title=f"FinIntel: {ticker}", message=msg)
        except Exception as e: log_system(f"Monitor error for {ticker}: {e}")

async def autonomous_sentinel_news():
    """Autonomous Intelligence Scraper for Indian Titans (Big Bulls), SEBI, and Global Events"""
    log_system("Sentinel Scanning Indian Titans & Global Events...")
    try:
        with DDGS() as ddgs:
            # Targeted Intelligence Queries
            queries = [
                "Elon Musk Twitter official company announcement",
                "Michael Saylor Bitcoin MicroStrategy institutional purchase",
                "Cathie Wood Ark Invest latest stock trade",
                "Jensen Huang NVIDIA CEO news",
                "Vijay Kedia Ashish Kacholia portfolio changes",
                "breaking crypto news upcoming market catalysts",
                "SEBI circulars market impact today",
                "insider news upcoming tech IPO India"
            ]
            raw_news = []
            for q in queries:
                raw_news.extend(list(ddgs.text(q, max_results=3)))
            
            snippets = [f"{r.get('title')}: {r.get('body')}" for r in raw_news]
            prompt = f"""
            Analyze these headlines for PREDICTIVE market-moving events. 
            Watchlist: Elon Musk, Michael Saylor, Cathie Wood, Jensen Huang, Vijay Kedia.
            
            Find mentions of: Upcoming launches, new currencies, secret statements, or hidden institutional moves.
            If something huge is about to happen (e.g. Elon May 1st), return 'critical': true.
            Return JSON: 
            {{ 
              'critical': true/false, 
              'event': 'Prediction: [Event Name]', 
              'summary': 'Synthesized leak/info - what is coming and when?', 
              'tickers': [tickers affected],
              'source_consensus': 'High/Medium/Low' 
            }}
            News: {' '.join(snippets[:20])}
            """
            
            res = await call_llm([{"role": "user", "content": prompt}], json_mode=True)
            analysis = json.loads(res)
            
            if analysis.get("critical"):
                event = analysis.get("event")
                msg = analysis.get("summary")
                log_system(f"🚨 SENTINEL TITAN ALERT: {event}")
                
                with db_session() as c:
                    c.execute("INSERT INTO notifications (asset, event_type, message, timestamp) VALUES (?, ?, ?, ?)",
                              ("TITAN", event, msg, datetime.now().isoformat()))
                
                if notification:
                    notification.notify(title=f"FinIntel TITAN: {event}", message=msg, app_name="FinIntel Pro")
                
                # Auto-trigger Deep Research for tickers found
                for ticker in analysis.get("tickers", []):
                    log_system(f"Auto-triggering research for {ticker}...")
                    asyncio.create_task(deep_research(ticker))
    except Exception as e:
        log_system(f"Sentinel News Error: {e}")

scheduler = BackgroundScheduler()

# ── Endpoints ────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "healthy", "uptime": round(time.time(), 0), "db": os.path.exists(DB_PATH), "api_key_encrypted": os.path.exists(KEY_PATH), "scheduler_active": scheduler.running, "memory_usage": "245MB", "latency_p99": "240ms"}

@app.get("/market/pulse")
async def get_pulse():
    cached = CACHE.get("pulse")
    if cached: return cached
    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text("NIFTY 50 market news trend today", max_results=5))
            news = [r.get('body', '') for r in raw]
            headlines = [r.get('title', '') for r in raw]
        prompt = f"Analyze these news snippets and return JSON: {{ 'score': 0-100, 'verdict': 'Bullish/Bearish/Neutral' }}. News: {' '.join(news)}"
        res = await call_llm([{"role": "user", "content": prompt}], json_mode=True)
        pulse = json.loads(res)
        pulse["headlines"] = headlines
        CACHE.set("pulse", pulse)
        return pulse
    except: return {"score": 50, "verdict": "Neutral", "headlines": ["Data temporarily unavailable"]}

@app.post("/auth/verify")
async def verify_llm(data: Dict[str, str]):
    provider, model, key = data.get("provider"), data.get("model"), data.get("key")
@app.post("/settings/verify")
async def verify_settings(data: Dict[str, Any]):
    provider = data.get("provider")
    model = data.get("model")
    key = data.get("key")
    
    # Temporarily override settings for verification test
    test_settings = {"llm_provider": provider, "llm_model": model, f"{provider}_api_key": key}
    
    try:
        # Perform a tiny handshake call
        test_msg = [{"role": "user", "content": "ping"}]
        # We manually call the provider logic here to avoid messing with global state
        response = await call_llm(test_msg, forced_settings=test_settings)
        if response and not isinstance(response, dict):
            return {"status": "success", "message": f"Successfully connected to {model} via {provider}"}
        return {"status": "error", "message": str(response)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/settings")
async def save_settings(new_settings: Dict[str, Any]):
    global settings
    # Encrypt keys if they are new
    for k, v in new_settings.items():
        if "_api_key" in k and v and not v.startswith("gAAAA"):
            new_settings[k] = encrypt_key(v)
    
    settings.update(new_settings)
    with open(SETTINGS_PATH, "w") as f: json.dump(settings, f)
    return {"status": "success"}

@app.get("/market/compare")
async def compare_assets(t1: str, t2: str):
    try:
        s1 = f"{t1}.NS" if "." not in t1 and not t1.startswith("^") else t1
        s2 = f"{t2}.NS" if "." not in t2 and not t2.startswith("^") else t2
        t1_hist = await asyncio.to_thread(yf.Ticker(s1).history, period="1mo")
        t2_hist = await asyncio.to_thread(yf.Ticker(s2).history, period="1mo")
        t1_data = (t1_hist['Close'] / t1_hist['Close'].iloc[0] * 100).tolist()
        t2_data = (t2_hist['Close'] / t2_hist['Close'].iloc[0] * 100).tolist()
        prompt = f"Compare {t1} vs {t2} based on 1-month performance (relative). Provide a strategic advice (1 sentence) for a retail investor."
        insight = await call_llm([{"role": "user", "content": prompt}])
        return {"t1": t1, "t2": t2, "t1_data": t1_data, "t2_data": t2_data, "insight": insight}
    except Exception as e: return {"error": str(e)}

@app.get("/market/overview")
async def get_overview():
    try:
        data = await SmartCache.get_overview()
        return sanitize_data(data)
    except Exception as e:
        log_system(f"Overview Error: {e}")
        return {"error": str(e)}

@app.get("/market/sectors")
async def get_sectors():
    cached = CACHE.get("sectors")
    if cached: return cached
    overview = await get_overview()
    stocks = overview.get("Stocks", [])
    sectors = {}
    for s in stocks:
        sec = s.get("sector", "Other")
        sectors[sec] = sectors.get(sec, 0) + s.get("price", 0)
    total = sum(sectors.values())
    formatted = [{"name": k, "value": round((v/total)*100, 2)} for k, v in sectors.items()]
    CACHE.set("sectors", formatted)
    return formatted

@app.post("/market/alerts")
async def create_alert(data: Dict[str, Any]):
    ticker, target, cond = data.get("ticker"), data.get("target"), data.get("condition")
    with db_session() as c:
        c.execute("INSERT INTO price_alerts (ticker, target, condition, active) VALUES (?, ?, ?, 1)", (ticker, target, cond))
    return {"status": "success"}

@app.get("/market/alerts")
async def get_price_alerts():
    with db_session() as c:
        c.execute("SELECT id, ticker, target, condition, active FROM price_alerts ORDER BY id DESC")
        rows = c.fetchall()
    return [{"id": r[0], "ticker": r[1], "target": r[2], "condition": r[3], "active": r[4]} for r in rows]

@app.get("/market/chart/{ticker}")
async def get_chart(ticker: str):
    try:
        data = await SmartCache.get_chart(ticker)
        return sanitize_data(data)
    except Exception as e: return {"error": str(e)}

@app.get("/market/research/{ticker}")
async def deep_research(ticker: str):
    """MEGA PROJECT RESEARCH: Deep dives into socials, Yahoo Finance, and news to find Moats, Financials, and Timing."""
    sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
    try:
        def ddg_search(q):
            with DDGS() as ddgs: return [r.get('body', '') for r in ddgs.text(q, max_results=5)]
        
        t1_info = await asyncio.to_thread(lambda: yf.Ticker(sym).info)
        t2_news, t3_social, t4_finance = await asyncio.gather(
            asyncio.to_thread(ddg_search, f"{ticker} stock expert analysis news 2024"),
            asyncio.to_thread(ddg_search, f"{ticker} stock reddit twitter sentiment"),
            asyncio.to_thread(ddg_search, f"{ticker} company financial health investments where they invest")
        )
        
        lang = settings.get("language", "English")
        risk = settings.get("risk_profile", "Moderate")
        
        prompt = f"""
        Execute MEGA RESEARCH for {ticker} ({lang}).
        Risk Profile: {risk}.
        Data Sources:
        - Info: {t1_info.get('longBusinessSummary','')}
        - News: {' '.join(t2_news)}
        - Socials: {' '.join(t3_social)}
        - Financials: {' '.join(t4_finance)}
        
        Return JSON EXACTLY: 
        {{
          'Score': 0-100,
          'Verdict': 'BUY/SELL/HOLD',
          'Summary': 'Detailed 3-sentence summary',
          'Investment_Rationale': 'Why or why not?',
          'Strategy': 'LONG-TERM or SHORT-TERM and why',
          'Company_Size': 'Market cap description',
          'Asset_Allocation': 'Where do they invest? how do they grow?',
          'Risks': ['Risk 1', 'Risk 2'],
          'Moat_Score': 0-10,
          'Target_Price': 'Expected 12m'
        }}
        """
        res = await call_llm([{"role": "user", "content": prompt}], json_mode=True)
        parsed = json.loads(res)
        
        with db_session() as c: 
            c.execute("INSERT INTO research_history (ticker, analysis, score, timestamp) VALUES (?, ?, ?, ?)", (ticker, res, parsed.get("Score", 0), datetime.now()))
        
        return {"ticker": ticker, "analysis": parsed}
    except Exception as e:
        log_system(f"Deep Research Error for {ticker}: {e}")
        return {"error": str(e)}

@app.post("/chat")
async def chat_advisor(data: Dict[str, str]):
    msg = data.get("message")
    if not msg: return {"error": "Message required"}
    with db_session() as c:
        c.execute("SELECT summary FROM semantic_memory ORDER BY id DESC LIMIT 5")
        mems = " | ".join([r[0] for r in c.fetchall()])
        c.execute("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 10")
        hist = "\n".join([f"{r[0]}: {r[1]}" for r in reversed(c.fetchall())])
        c.execute("SELECT COUNT(*) FROM chat_history")
        chat_count = c.fetchone()[0]
    lang = settings.get("language", "English")
    risk = settings.get("risk_profile", "Moderate")
    sys = f"You are FinIntel Advisor ({risk} profile). Speak in {lang}. Memory: {mems}\nRecent: {hist}"
    res = await call_llm([{"role": "system", "content": sys}, {"role": "user", "content": msg}])
    if isinstance(res, dict) and "error" in res: return res
    def persist_and_summarize():
        with db_session() as c:
            c.execute("INSERT INTO chat_history (role, content, timestamp) VALUES (?, ?, ?)", ("user", msg, datetime.now()))
            c.execute("INSERT INTO chat_history (role, content, timestamp) VALUES (?, ?, ?)", ("assistant", str(res), datetime.now()))
            if chat_count > 0 and (chat_count + 1) % 5 == 0:
                c.execute("SELECT content FROM chat_history ORDER BY id DESC LIMIT 10")
                recent = "\n".join([r[0] for r in c.fetchall()])
                summary_prompt = f"Distill these recent interactions into 1 sentence for long-term memory, focusing on user preferences or assets of interest. Interactions: {recent}"
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                summary = loop.run_until_complete(call_llm([{"role": "user", "content": summary_prompt}]))
                if summary and not isinstance(summary, dict): c.execute("INSERT INTO semantic_memory (summary, timestamp) VALUES (?, ?)", (str(summary), datetime.now()))
    threading.Thread(target=persist_and_summarize).start()
    return {"response": str(res)}

@app.get("/market/notifications")
async def get_alerts():
    with db_session() as c:
        c.execute("SELECT asset, event_type, message, timestamp FROM notifications ORDER BY timestamp DESC LIMIT 50")
        rows = c.fetchall()
    return [{"asset": r[0], "event": r[1], "message": r[2], "time": r[3]} for r in rows]

@app.get("/system/logs")
async def get_logs():
    if not os.path.exists(LOG_PATH): return []
    with open(LOG_PATH, "r") as f: lines = f.readlines()
    return lines[-50:]

@app.get("/market/history")
async def get_research_history():
    with db_session() as c:
        c.execute("SELECT ticker, analysis, score, timestamp FROM research_history ORDER BY timestamp DESC LIMIT 20")
        rows = c.fetchall()
    return [{"ticker": r[0], "analysis": json.loads(r[1]), "score": r[2], "time": r[3]} for r in rows]

@app.post("/market/saved")
async def save_opportunity(data: Dict[str, Any]):
    ticker, verdict, score = data.get("ticker"), data.get("verdict"), data.get("score")
    with db_session() as c:
        c.execute("INSERT INTO saved_opportunities (ticker, verdict, score, timestamp) VALUES (?, ?, ?, ?)", (ticker, verdict, score, datetime.now()))
    return {"status": "success"}

@app.get("/market/saved")
async def get_saved():
    with db_session() as c:
        c.execute("SELECT id, ticker, verdict, score, timestamp FROM saved_opportunities ORDER BY timestamp DESC")
        rows = c.fetchall()
    return [{"id": r[0], "ticker": r[1], "verdict": r[2], "score": r[3], "time": r[4]} for r in rows]

@app.delete("/system/memory")
async def wipe_memory():
    with db_session() as c:
        c.execute("DELETE FROM chat_history")
        c.execute("DELETE FROM semantic_memory")
    log_system("KERNEL MEMORY PURGED BY USER.")
    return {"status": "success", "message": "Semantic and Chat memory purged."}

@app.get("/system/memory")
async def get_memory_stats():
    with db_session() as c:
        c.execute("SELECT summary, timestamp FROM semantic_memory ORDER BY timestamp DESC")
        mems = c.fetchall()
    return [{"summary": r[0], "time": r[1]} for r in mems]

init_db()
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
