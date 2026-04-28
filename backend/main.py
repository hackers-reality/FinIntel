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
try:
    from plyer import notification
except ImportError:
    notification = None

# ── Paths ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
SETTINGS_PATH = os.path.join(BASE_DIR, "settings.json")
DB_PATH = os.path.join(BASE_DIR, "finintel.db")
LOG_PATH = os.path.join(BASE_DIR, "system.log")

load_dotenv(ENV_PATH)

# ── Session & Cache Init ──────────────────────────────────────────────
YF_SESSION = requests.Session()
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
]

class SimpleCache:
    def __init__(self, expiry=300):
        self.cache = {}
        self.expiry = expiry
    def get(self, key):
        if key in self.cache:
            val, ts = self.cache[key]
            if time.time() - ts < self.expiry: return val
        return None
    def set(self, key, val):
        self.cache[key] = (val, time.time())

MARKET_CACHE = SimpleCache(expiry=600) # 10 min cache for overview

def get_session():
    YF_SESSION.headers.update({'User-Agent': random.choice(USER_AGENTS)})
    return YF_SESSION

# ── Database Init (Semantic Memory & Chat) ──────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS chat_history 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, content TEXT, timestamp DATETIME)''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_profile 
                 (key TEXT PRIMARY KEY, value TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS research_history 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, ticker TEXT, analysis TEXT, score INTEGER, timestamp DATETIME)''')
    conn.commit()
    conn.close()

def log_system(msg):
    with open(LOG_PATH, "a") as f:
        f.write(f"[{datetime.now().isoformat()}] {msg}\n")

def save_chat(role, content):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO chat_history (role, content, timestamp) VALUES (?, ?, ?)", (role, content, datetime.now()))
        
        # Pruning logic: Enforce 10MB limit by limiting row count (approx 500 detailed messages)
        c.execute("SELECT COUNT(*) FROM chat_history")
        if c.fetchone()[0] > 500:
            c.execute("DELETE FROM chat_history WHERE id IN (SELECT id FROM chat_history ORDER BY id ASC LIMIT 50)")
        conn.commit()
        conn.close()
    except Exception as e: print(f"DB Error: {e}")

def get_chat_history(limit=50):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [{"role": r[0], "content": r[1]} for r in reversed(rows)]

init_db()

# ── Initial State ──────────────────────────────────────────────────────
DEFAULT_SETTINGS = {
    "theme": "dark",
    "notifications": True,
    "favorites": ["RELIANCE.NS", "TCS.NS"],
    "llm_provider": "nvidia_nim",
    "llm_model": "meta/llama-3.1-405b-instruct",
    "risk_profile": "growth",
    "tier_weights": {"tier1": 50, "tier2": 30, "tier3": 20}
}

def load_json(path, default):
    if not os.path.exists(path):
        with open(path, "w") as f: json.dump(default, f)
        return default
    with open(path, "r") as f: return json.load(f)

settings = load_json(SETTINGS_PATH, DEFAULT_SETTINGS)

# ── App Init ──────────────────────────────────────────────────────────
app = FastAPI(title="FinIntel Pro Production API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
print("APP INIT COMPLETE")

latest_alerts = []

# ── LLM Wrapper ────────────────────────────────────────────────────────
async def call_llm(messages: List[Dict[str, str]], json_mode: bool = False):
    provider = settings.get("llm_provider", "openai")
    model = settings.get("llm_model")
    api_key = os.getenv(f"{provider.upper()}_API_KEY")
    
    if not api_key: return {"error": f"API Key for {provider} not found."}

    try:
        if provider in ["openai", "groq", "nvidia_nim"]:
            base_url = None
            if provider == "groq": base_url = "https://api.groq.com/openai/v1"
            elif provider == "nvidia_nim": base_url = "https://integrate.api.nvidia.com/v1"
            
            client = openai.OpenAI(api_key=api_key, base_url=base_url)
            args = {"model": model, "messages": messages}
            if json_mode: 
                args["response_format"] = {"type": "json_object"}
            response = client.chat.completions.create(**args)
            return response.choices[0].message.content

        elif provider == "anthropic":
            client = anthropic.Anthropic(api_key=api_key)
            system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
            user_msgs = [m for m in messages if m["role"] != "system"]
            response = client.messages.create(model=model, system=system_msg, messages=user_msgs, max_tokens=1024)
            return response.content[0].text
        return {"error": "Unsupported provider"}
    except Exception as e:
        return {"error": str(e)}

# ── Background Monitor (5 Min Polling) ─────────────────────────────────
async def market_monitor():
    global latest_alerts
    notified_symbols = set() # Prevent alert spamming in the same hour
    
    while True:
        try:
            symbols = settings.get("favorites", ["^NSEI"])
            if not symbols: symbols = ["RELIANCE.NS"]
            
            for sym in symbols:
                try:
                    # Resolve symbol
                    if sym == "NIFTY 50": sym = "^NSEI"
                    elif sym == "SENSEX": sym = "^BSESN"
                    
                    t = yf.Ticker(sym)
                    hist = await asyncio.to_thread(t.history, period="1d", interval="1m")
                    if not hist.empty and len(hist) > 5:
                        price = hist['Close'].iloc[-1]
                        prev_5 = hist['Close'].iloc[-5]
                        change = ((price - prev_5) / prev_5) * 100
                        
                        if abs(change) > 0.8: # Threshold for major move
                            alert_id = f"{sym}_{datetime.now().strftime('%H_%M')}"
                            if alert_id not in notified_symbols:
                                alert = {
                                    "id": alert_id,
                                    "symbol": sym.replace(".NS", ""),
                                    "price": round(price, 2),
                                    "change": round(change, 2),
                                    "type": "surge" if change > 0 else "drop",
                                    "time": datetime.now().isoformat(),
                                    "source": f"https://finance.yahoo.com/quote/{sym}"
                                }
                                latest_alerts.append(alert)
                                latest_alerts = latest_alerts[-30:]
                                notified_symbols.add(alert_id)
                                
                                if settings.get("notifications") and notification:
                                    try:
                                        notification.notify(
                                            title=f"FinIntel ALERT: {alert['symbol']}",
                                            message=f"Significant {alert['type']} ({alert['change']}%) detected.",
                                            app_name="FinIntel Pro",
                                            timeout=15
                                        )
                                    except Exception as ne:
                                        log_system(f"Notification error: {ne}")
                except: continue
            
            # Clear old symbols every hour
            if datetime.now().minute == 0: notified_symbols.clear()
            await asyncio.sleep(300) 
        except Exception as e:
            log_system(f"Monitor Error: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(market_monitor())

# ── Endpoints ──────────────────────────────────────────────────────────
@app.get("/")
async def root(): return {"status": "online"}

@app.get("/dashboard")
async def get_dashboard():
    return FileResponse(os.path.join(BASE_DIR, "dashboard.html"))

ASSETS = {
    "NSE Stocks": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBI.NS", "BHARTIARTL.NS", "ADANIENT.NS", "TATASTEEL.NS", "WIPRO.NS"],
    "Forex (INR)": ["USDINR=X", "EURINR=X", "GBPINR=X", "JPYINR=X"],
    "Crypto (INR)": ["BTC-INR", "ETH-INR", "SOL-INR"],
    "Commodities": ["GC=F", "SI=F", "CL=F"]
}

@app.get("/market/overview")
async def get_overview():
    cached = MARKET_CACHE.get("overview")
    if cached: return cached
    
    try:
        favs = settings.get("favorites", [])
        results = {}
        for category, symbols in ASSETS.items():
            category_data = []
            for sym in symbols:
                try:
                    t = yf.Ticker(sym)
                    hist = await asyncio.to_thread(t.history, period="2d")
                    if not hist.empty:
                        price = float(hist['Close'].iloc[-1])
                        prev = float(hist['Close'].iloc[-2]) if len(hist) > 1 else price
                        change = ((price - prev) / prev) * 100
                        category_data.append({
                            "ticker": sym,
                            "display_name": sym.replace(".NS", "").replace("=X", "").replace("=F", ""),
                            "price": round(price, 2) if price > 1 else round(price, 4),
                            "change": round(change, 2),
                            "is_favorite": sym in favs
                        })
                except: continue
            results[category] = category_data

        indices = []
        for name, sym in {"NIFTY 50": "^NSEI", "SENSEX": "^BSESN", "S&P 500": "^GSPC", "NASDAQ": "^IXIC"}.items():
            try:
                t = yf.Ticker(sym)
                hist = await asyncio.to_thread(t.history, period="2d")
                if not hist.empty:
                    price = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2]) if len(hist) > 1 else price
                    indices.append({"name": name, "price": round(price, 2), "change": round(((price - prev) / prev) * 100, 2)})
            except: continue
        
        final_res = {"categories": results, "indices": indices}
        MARKET_CACHE.set("overview", final_res)
        return final_res
    except Exception as e: return {"error": str(e)}

@app.get("/market/chart/{ticker}")
async def get_chart(ticker: str, interval: str = "1m"):
    period_map = {"1m": "1d", "5m": "1d", "15m": "5d", "1h": "1mo", "1d": "1y", "1wk": "2y", "1mo": "max"}
    period = period_map.get(interval, "1d")
    
    # Improved ticker resolution
    sym = ticker
    if not ticker.startswith("^") and "=" not in ticker and ".NS" not in ticker and ".BS" not in ticker:
        sym = f"{ticker}.NS"
        
    t = yf.Ticker(sym)
    hist = await asyncio.to_thread(t.history, period=period, interval=interval)
    
    # Fallback if specific interval fails
    if hist.empty and interval in ["1m", "5m"]:
        hist = await asyncio.to_thread(t.history, period="5d", interval="1h")
        
    if hist.empty:
        # Last resort fallback to daily
        hist = await asyncio.to_thread(t.history, period="1mo", interval="1d")

    data = [{"time": int(idx.timestamp()), "open": round(float(row['Open']), 2), "high": round(float(row['High']), 2), "low": round(float(row['Low']), 2), "close": round(float(row['Close']), 2), "volume": int(row['Volume'])} for idx, row in hist.iterrows()]
    return data

@app.get("/settings")
async def get_settings(): return settings

@app.post("/settings")
async def save_settings(new_settings: Dict[str, Any]):
    global settings
    settings.update(new_settings)
    with open(SETTINGS_PATH, "w") as f: json.dump(settings, f)
    return {"status": "success"}

@app.post("/auth/verify")
async def verify_key(data: Dict[str, str]):
    provider, model, key = data.get("provider"), data.get("model"), data.get("key")
    env_key = f"{provider.upper()}_API_KEY"
    old_key = os.getenv(env_key)
    os.environ[env_key] = key
    res = await call_llm([{"role": "user", "content": "Ping"}])
    if isinstance(res, dict) and "error" in res:
        if old_key: os.environ[env_key] = old_key
        return {"status": "error", "message": res["error"]}
    set_key(ENV_PATH, env_key, key)
    return {"status": "success", "message": f"Successfully connected to {model} via {provider}"}

@app.get("/notifications")
async def get_notifications(): return latest_alerts

@app.get("/market/traders/news")
async def get_traders_news():
    traders = ["Rakesh Jhunjhunwala", "Vijay Kedia", "Radhakishan Damani", "Warren Buffett", "Ray Dalio"]
    results = []
    try:
        def fetch_news():
            all_news = []
            with DDGS() as ddgs:
                for trader in traders:
                    try:
                        news_items = list(ddgs.news(f"{trader} latest portfolio moves", max_results=2))
                        for item in news_items:
                            all_news.append({
                                "trader": trader,
                                "title": item.get('title'),
                                "snippet": item.get('body'),
                                "url": item.get('url'),
                                "date": item.get('date')
                            })
                        time.sleep(2) # Small delay to avoid rate limiting
                    except Exception as e:
                        log_system(f"DDGS News Error for {trader}: {e}")
                        continue
            return all_news
        results = await asyncio.to_thread(fetch_news)
        return results
    except Exception as e:
        log_system(f"Traders News Error: {e}")
        return []

@app.get("/market/refresh")
async def manual_refresh():
    asyncio.create_task(market_monitor())
    return {"status": "refresh_triggered"}

@app.post("/chat")
async def chat(data: Dict[str, Any]):
    message = data.get("message")
    if not message: return {"error": "No message"}
    
    # Inject real-time market context into the agent
    overview = await get_overview()
    market_summary = "Current Market Overview:\n"
    if isinstance(overview, dict) and "categories" in overview:
        for cat, assets in overview["categories"].items():
            market_summary += f"- {cat}: " + ", ".join([f"{a['display_name']} (₹{a['price']}, {a['change']}%)" for a in assets[:3]]) + "\n"
    
    history = get_chat_history(limit=15)
    context = "\n".join([f"{m['role']}: {m['content']}" for m in history])
    favs = settings.get("favorites", [])
    
    system_prompt = f"""You are the FinIntel Pro Strategic Advisor.
    User Profile: Risk={settings.get('risk_profile')}, Favorites={favs}.
    Live Market Context:
    {market_summary}
    
    Chat Context: {context}
    
    Guidelines:
    - Provide precise, data-driven analysis for Indian markets.
    - Reference NSE/BSE symbols specifically.
    - If user asks about a stock, use the Research Tier logic mentally.
    - Keep tone professional, elite, and concise."""

    res = await call_llm([{"role": "system", "content": system_prompt}, {"role": "user", "content": message}])
    if isinstance(res, dict) and "error" in res: return {"response": res["error"]}
    
    save_chat("user", message)
    save_chat("assistant", str(res))
    return {"response": str(res), "history": get_chat_history(limit=50)}

@app.get("/market/research/history")
async def get_research_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT ticker, score, timestamp FROM research_history ORDER BY id DESC LIMIT 20")
    rows = c.fetchall()
    conn.close()
    return [{"ticker": r[0], "score": r[1], "time": r[2]} for r in rows]

@app.get("/market/research/{ticker}")
async def deep_research(ticker: str):
    provider = settings.get("llm_provider", "openai")
    api_key = os.getenv(f"{provider.upper()}_API_KEY")
    if not api_key: return {"error": "API Key missing"}

    try:
        log_system(f"Starting deep research for {ticker}")
        sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") and "=" not in ticker else ticker
        t = yf.Ticker(sym)
        info = await asyncio.to_thread(lambda: t.info)
        
        try:
            def crawl():
                with DDGS() as ddgs:
                    t1 = [n.get('body', '') for n in ddgs.news(f"{ticker} official disclosures NSE", max_results=2)]
                    t3 = [r.get('body', '') for r in ddgs.text(f"{ticker} stock reddit twitter", max_results=3)]
                    return t1, t3
            t1, t3 = await asyncio.to_thread(crawl)
        except Exception as e:
            log_system(f"DDGS Failed for {ticker}: {e}")
            t1, t3 = [], []

        prompt = f"Analyze {ticker} for India Market. Data: {info.get('longName')}, {info.get('trailingPE')}. Tiers: T1={t1}, T3={t3}. Return JSON with Score (0-100), Executive Summary, and Recommendation."
        res = await call_llm([{"role": "system", "content": "Senior Financial Analyst India."}, {"role": "user", "content": prompt}], json_mode=True)
        
        if isinstance(res, dict) and "error" in res:
            return res

        try:
            parsed = json.loads(res)
        except json.JSONDecodeError:
            # Fallback if LLM doesn't return valid JSON
            parsed = {
                "Score": 75,
                "Executive Summary": res,
                "Recommendation": "Consult full report for details."
            }
            
        score = parsed.get("Score") or parsed.get("Detailed Numerical Scores", {}).get("Opportunity Score", 85)
        
        # Save to history
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO research_history (ticker, analysis, score, timestamp) VALUES (?, ?, ?, ?)", 
                  (ticker, res, score, datetime.now()))
        conn.commit()
        conn.close()
        
        return {"ticker": ticker, "analysis": parsed}
    except Exception as e:
        log_system(f"Research Failed for {ticker}: {e}")
        return {"error": str(e)}

@app.post("/market/favorites/toggle")
async def toggle_favorite(data: Dict[str, str]):
    ticker = data.get("ticker")
    favs = settings.get("favorites", [])
    if ticker in favs: favs.remove(ticker)
    else: favs.append(ticker)
    settings["favorites"] = favs
    with open(SETTINGS_PATH, "w") as f: json.dump(settings, f)
    return {"status": "success", "favorites": favs}

@app.get("/market/compare")
async def compare_stocks(t1: str, t2: str):
    try:
        def get_data(ticker):
            sym = f"{ticker}.NS" if "." not in ticker and not ticker.startswith("^") else ticker
            tk = yf.Ticker(sym)
            hist = tk.history(period="1mo")
            if hist.empty: return None
            # Return relative returns
            start = hist['Close'].iloc[0]
            returns = ((hist['Close'] - start) / start) * 100
            return returns.tolist()

        d1 = await asyncio.to_thread(get_data, t1)
        d2 = await asyncio.to_thread(get_data, t2)
        
        if not d1 or not d2: return {"error": "One or both tickers not found"}
        
        prompt = f"Compare {t1} vs {t2} in Indian market. Which one is a better strategic moat right now? Be concise."
        insight = await call_llm([{"role": "user", "content": prompt}])
        
        return {"t1_data": d1, "t2_data": d2, "insight": insight}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
