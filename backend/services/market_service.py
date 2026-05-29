from datetime import datetime, time as dtime

import pytz
import yfinance as yf
from ddgs import DDGS

from backend.database.db import db_cursor
from backend.schemas.market import (
    BulkDeal,
    CurrencyQuote,
    FiiDiiFlow,
    InvestorNews,
    MarketAlert,
    MarketChartPoint,
    MarketChartSeries,
    MarketEvent,
    MarketOverview,
    MarketQuote,
    SectorPerformance,
    StockData,
)


IST = pytz.timezone("Asia/Kolkata")


def get_market_overview() -> MarketOverview:
    tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "^CNXIT", "^CNXIT", "USDINR=X"]
    stocks: list[StockData] = []

    for ticker in tickers:
        try:
            history = yf.Ticker(ticker).history(period="2d")
            if history.empty:
                continue
            close_price = float(history["Close"].iloc[-1])
            open_price = float(history["Open"].iloc[-1])
            change = round(((close_price - open_price) / open_price) * 100, 2) if open_price else 0.0
            stocks.append(StockData(symbol=ticker, price=round(close_price, 2), change=change))
        except Exception:
            continue

    now = datetime.now(IST)
    market_status = "OPEN" if dtime(9, 15) <= now.time() <= dtime(15, 30) else "CLOSED"
    return MarketOverview(stocks=stocks, market_status=market_status, as_of=now.isoformat())


def get_market_quotes() -> list[MarketQuote]:
    watchlist = {
        "^NSEI": "Nifty 50",
        "^BSESN": "S&P BSE SENSEX",
        "^INDIAVIX": "India VIX",
        "RELIANCE.NS": "Reliance Industries",
        "TCS.NS": "Tata Consultancy Services",
        "INFY.NS": "Infosys",
        "HDFCBANK.NS": "HDFC Bank",
        "USDINR=X": "USD/INR",
        "EURINR=X": "EUR/INR",
        "BTC-USD": "Bitcoin",
        "ETH-USD": "Ethereum",
        "SHIB-USD": "Shiba Inu",
        "DOGE-USD": "Dogecoin",
        "SOL-USD": "Solana",
    }
    quotes: list[MarketQuote] = []
    for ticker, label in watchlist.items():
        try:
            history = yf.Ticker(ticker).history(period="2d")
            if history.empty:
                continue
            close_price = float(history["Close"].iloc[-1])
            open_price = float(history["Open"].iloc[-1])
            volume = float(history["Volume"].iloc[-1]) if "Volume" in history else 0.0
            change = round(close_price - open_price, 2)
            change_percent = round((change / open_price) * 100, 2) if open_price else 0.0
            if "=X" in ticker:
                category = "currency"
            elif "-USD" in ticker:
                category = "crypto"
            elif "^" in ticker:
                category = "index"
            else:
                category = "stock"
            quotes.append(
                MarketQuote(
                    symbol=ticker,
                    name=label,
                    price=round(close_price, 2),
                    change=change,
                    change_percent=change_percent,
                    volume=volume,
                    category=category,
                )
            )
        except Exception:
            continue
    return quotes


def get_currency_quotes() -> list[CurrencyQuote]:
    pairs = ["USDINR=X", "EURINR=X", "GBPINR=X", "JPYINR=X", "AUDINR=X", "CADINR=X", "SGDINR=X", "CHFINR=X"]
    results: list[CurrencyQuote] = []
    for pair in pairs:
        try:
            history = yf.Ticker(pair).history(period="2d")
            if history.empty:
                continue
            close_price = float(history["Close"].iloc[-1])
            open_price = float(history["Open"].iloc[-1])
            change = round(close_price - open_price, 2)
            change_percent = round((change / open_price) * 100, 2) if open_price else 0.0
            results.append(
                CurrencyQuote(
                    symbol=pair.replace("=X", ""),
                    price=round(close_price, 4),
                    change=change,
                    change_percent=change_percent,
                )
            )
        except Exception:
            continue
    return results


def get_market_chart(symbol: str, period: str = "1mo", interval: str = "1d") -> MarketChartSeries:
    normalized = symbol.strip().upper()
    history = yf.Ticker(normalized).history(period=period, interval=interval)
    points: list[MarketChartPoint] = []
    if not history.empty:
        for timestamp, row in history.iterrows():
            points.append(
                MarketChartPoint(
                    timestamp=timestamp.isoformat(),
                    open=round(float(row["Open"]), 2),
                    high=round(float(row["High"]), 2),
                    low=round(float(row["Low"]), 2),
                    close=round(float(row["Close"]), 2),
                    volume=round(float(row["Volume"]) if "Volume" in row else 0.0, 2),
                )
            )
    return MarketChartSeries(symbol=normalized, period=period, interval=interval, points=points)


def get_market_news() -> list[InvestorNews]:
    queries = [
        "India market news NSE BSE stocks finance",
        "Indian stock market company results news",
        "global currency market INR news",
    ]
    results: list[InvestorNews] = []
    for query in queries:
        try:
            for item in DDGS().text(query, max_results=4):
                title = str(item.get("title") or "").strip()
                url = str(item.get("href") or "").strip()
                snippet = str(item.get("body") or "").strip()
                if not title or not url:
                    continue
                results.append(
                    InvestorNews(
                        investor_name="Market News",
                        title=f"{title} - {snippet}" if snippet else title,
                        url=url,
                        date=datetime.now(IST).isoformat(),
                    )
                )
        except Exception:
            continue
    return results[:12]


def get_market_alerts() -> list[MarketAlert]:
    alerts: list[MarketAlert] = []
    for quote in get_market_quotes():
        if abs(quote.change_percent) >= 1.5:
            severity = "high" if abs(quote.change_percent) >= 3 else "medium"
            direction = "up" if quote.change_percent > 0 else "down"
            alerts.append(
                MarketAlert(
                    symbol=quote.symbol,
                    title=f"{quote.symbol} moved {direction} {abs(quote.change_percent):.2f}%",
                    severity=severity,
                    description=f"{quote.name} is moving {direction} with {quote.change_percent:.2f}% intraday change.",
                    source="yfinance",
                )
            )
    for news_item in get_market_news()[:3]:
        alerts.append(
            MarketAlert(
                symbol="NEWS",
                title=news_item.title[:90],
                severity="info",
                description="Market news surfaced from public search sources.",
                source="ddgs",
            )
        )
    return alerts[:12]


def get_sector_performance() -> list[SectorPerformance]:
    indices = {
        "Banking": "^CNXIT",
        "Auto": "^CNXAUTO",
        "Information Technology": "^CNXIT",
        "Pharma": "^CNXPHARMA",
        "FMCG": "^CNXFMCG",
        "Metals": "^CNXMETAL",
    }
    results: list[SectorPerformance] = []

    for sector_name, ticker in indices.items():
        try:
            history = yf.Ticker(ticker).history(period="2d")
            if history.empty:
                continue
            close_price = float(history["Close"].iloc[-1])
            open_price = float(history["Open"].iloc[-1])
            change = round(((close_price - open_price) / open_price) * 100, 2) if open_price else 0.0
            results.append(SectorPerformance(sector=sector_name, change=change))
        except Exception:
            continue

    return sorted(results, key=lambda item: item.change, reverse=True)


def get_investor_news() -> list[InvestorNews]:
    # Check if we have news in the DB
    with db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM investor_news")
        cnt = cursor.fetchone()["cnt"]

    if cnt == 0:
        try:
            from ddgs import DDGS
            titans = ["Vijay Kedia", "Ashish Kacholia", "Mukul Agrawal", "Rakesh Jhunjhunwala"]
            all_news = []
            with DDGS() as ddgs:
                for titan in titans:
                    query = f"{titan} stock pick investment"
                    results = list(ddgs.news(query, max_results=3, timelimit='d'))
                    for r in results:
                        title = r.get('title') or ''
                        snippet = r.get('body') or ''
                        full_title = f"{title} - {snippet}" if snippet else title
                        all_news.append({
                            "investor_name": titan,
                            "title": full_title,
                            "url": r.get('url') or '',
                            "ts": datetime.now(IST).isoformat()
                        })
            
            if not all_news:
                print("DDGS news empty or blocked, falling back to yfinance feeds...")
                for ticker in ["^NSEI", "RELIANCE.NS", "BTC-USD"]:
                    try:
                        ticker_news = yf.Ticker(ticker).news
                        for n in ticker_news[:4]:
                            title = n.get('title') or ''
                            publisher = n.get('publisher') or 'Market Feed'
                            all_news.append({
                                "investor_name": "Market News Feed",
                                "title": f"{title} - {publisher}",
                                "url": n.get('link') or '',
                                "ts": datetime.now(IST).isoformat()
                            })
                    except Exception as yf_err:
                        print(f"Error fetching yfinance fallback news for {ticker}: {yf_err}")
            
            if all_news:
                with db_cursor() as cursor:
                    for item in all_news:
                        cursor.execute("SELECT id FROM investor_news WHERE url = ?", (item["url"],))
                        if not cursor.fetchone():
                            cursor.execute(
                                "INSERT INTO investor_news (investor_name, title, url, ts) VALUES (?, ?, ?, ?)",
                                (item["investor_name"], item["title"], item["url"], item["ts"])
                            )
        except Exception as e:
            print(f"Error fetching initial investor news: {e}")

    with db_cursor() as cursor:
        cursor.execute("SELECT investor_name, title, url, ts FROM investor_news ORDER BY ts DESC LIMIT 15")
        rows = cursor.fetchall()
    return [InvestorNews(investor_name=row["investor_name"], title=row["title"], url=row["url"], date=row["ts"]) for row in rows]


def get_institutional_flows() -> list[FiiDiiFlow]:
    with db_cursor() as cursor:
        cursor.execute("SELECT date, fii_net, dii_net FROM fii_dii_flow ORDER BY date DESC LIMIT 10")
        rows = cursor.fetchall()
    return [FiiDiiFlow(date=row["date"], fii=row["fii_net"], dii=row["dii_net"]) for row in rows]


def get_bulk_deals() -> list[BulkDeal]:
    with db_cursor() as cursor:
        cursor.execute("SELECT ticker, client, qty, price, type, ts FROM bulk_deals ORDER BY ts DESC LIMIT 10")
        rows = cursor.fetchall()
    return [
        BulkDeal(
            ticker=row["ticker"],
            client=row["client"],
            qty=row["qty"],
            price=row["price"],
            type=row["type"],
            date=row["ts"],
        )
        for row in rows
    ]


def get_market_events() -> list[MarketEvent]:
    with db_cursor() as cursor:
        cursor.execute("SELECT id, ticker, type, description, ts, status FROM pending_events WHERE status = 'pending'")
        rows = cursor.fetchall()
    return [
        MarketEvent(
            id=row["id"],
            ticker=row["ticker"],
            type=row["type"],
            description=row["description"],
            ts=row["ts"],
            status=row["status"],
        )
        for row in rows
    ]


async def get_quote(ticker: str) -> dict:
    import yfinance as yf
    import asyncio

    def _fetch():
        t = yf.Ticker(ticker)
        hist = t.history(period="1d")
        if hist.empty:
            return {}
        info = {}
        try:
            info = t.info
        except Exception:
            pass

        close_val = float(hist["Close"].iloc[-1])
        open_val = float(hist["Open"].iloc[-1])
        volume = float(hist["Volume"].iloc[-1]) if "Volume" in hist else 0.0

        return {
            "symbol": ticker,
            "price": round(close_val, 2),
            "open": round(open_val, 2),
            "volume": volume,
            "name": info.get("longName") or info.get("shortName") or ticker,
            "sector": info.get("sector") or "Unknown",
            "industry": info.get("industry") or "Unknown",
            "summary": info.get("longBusinessSummary") or "",
            "market_cap": info.get("marketCap") or 0.0,
        }

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch)


async def get_history(ticker: str, period: str = "3mo") -> list[dict]:
    import yfinance as yf
    import asyncio

    def _fetch():
        t = yf.Ticker(ticker)
        hist = t.history(period=period)
        if hist.empty:
            return []
        points = []
        for timestamp, row in hist.iterrows():
            points.append({
                "date": timestamp.strftime("%Y-%m-%d") if hasattr(timestamp, "strftime") else str(timestamp),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": float(row["Volume"]) if "Volume" in row else 0.0
            })
        return points

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch)


def get_ticker_indicators(symbol: str) -> dict:
    normalized = symbol.strip().upper()
    try:
        # Fetch 3 months of history for technical indicators calculation
        history = yf.Ticker(normalized).history(period="3mo")
        if history.empty:
            return {
                "signal": "HOLD",
                "score": 0,
                "rsi": 50.0,
                "stop_loss": 0.0,
                "take_profit": 0.0,
                "details": f"No history found for {symbol}."
            }
        highs = history["High"].tolist()
        lows = history["Low"].tolist()
        closes = history["Close"].tolist()
        
        from backend.services.indicator_service import get_gainzalgo_v3_signals
        return get_gainzalgo_v3_signals(highs, lows, closes)
    except Exception as e:
        return {
            "signal": "ERROR",
            "score": 0,
            "rsi": 50.0,
            "stop_loss": 0.0,
            "take_profit": 0.0,
            "details": f"Indicators calculation error: {str(e)}"
        }
