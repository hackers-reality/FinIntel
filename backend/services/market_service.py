from datetime import datetime, time as dtime

import pytz
import yfinance as yf

from backend.database.db import db_cursor
from backend.schemas.market import BulkDeal, FiiDiiFlow, InvestorNews, MarketEvent, MarketOverview, SectorPerformance, StockData


IST = pytz.timezone("Asia/Kolkata")


def get_market_overview() -> MarketOverview:
    tickers = ["^NSEI", "^BSESN", "^INDIAVIX", "USDINR=X"]
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
