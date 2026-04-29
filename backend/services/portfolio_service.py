import yfinance as yf

from backend.database.db import db_cursor
from backend.schemas.portfolio import PortfolioHolding, PortfolioHoldingCreate, PortfolioSummary


def add_holding(payload: PortfolioHoldingCreate) -> None:
    with db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO portfolio (ticker, qty, price) VALUES (?, ?, ?)",
            (payload.ticker, payload.qty, payload.price),
        )


def get_portfolio_summary() -> PortfolioSummary:
    with db_cursor() as cursor:
        cursor.execute("SELECT ticker, qty, price FROM portfolio ORDER BY ticker ASC")
        rows = cursor.fetchall()

    total_value = 0.0
    holdings: list[PortfolioHolding] = []
    for row in rows:
        ticker = row["ticker"]
        qty = float(row["qty"])
        avg_price = float(row["price"])

        current_price = avg_price
        try:
            yfinance_ticker = ticker if ticker.endswith(".NS") else f"{ticker}.NS"
            history = yf.Ticker(yfinance_ticker).history(period="1d")
            if not history.empty:
                current_price = float(history["Close"].iloc[-1])
        except Exception:
            current_price = avg_price

        pnl = round((current_price - avg_price) * qty, 2)
        total_value += current_price * qty
        holdings.append(
            PortfolioHolding(
                symbol=ticker,
                qty=qty,
                avg_price=round(avg_price, 2),
                curr_price=round(current_price, 2),
                pnl=pnl,
            )
        )

    return PortfolioSummary(total_value=round(total_value, 2), holdings=holdings)
