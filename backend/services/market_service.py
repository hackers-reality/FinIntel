from datetime import datetime, time as dtime

import pytz
import yfinance as yf
from duckduckgo_search import DDGS

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
    tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "^CNXBANK", "^CNXIT", "USDINR=X"]
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
        "RELIANCE.NS": "Reliance Industries",
        "TCS.NS": "Tata Consultancy Services",
        "INFY.NS": "Infosys",
        "HDFCBANK.NS": "HDFC Bank",
        "ICICIBANK.NS": "ICICI Bank",
        "SBIN.NS": "State Bank of India",
        "AXISBANK.NS": "Axis Bank",
        "ITC.NS": "ITC",
        "USDINR=X": "USD/INR",
        "EURINR=X": "EUR/INR",
        "GBPINR=X": "GBP/INR",
        "JPYINR=X": "JPY/INR",
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
            category = "currency" if "=X" in ticker else "stock"
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
                source="duckduckgo",
            )
        )
    return alerts[:12]


def get_sector_performance() -> list[SectorPerformance]:
    indices = {
        "Banking": "^CNXBANK",
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
