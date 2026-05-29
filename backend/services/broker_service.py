from __future__ import annotations

import os

from backend.schemas.broker import BrokerAccountSummary, BrokerHolding

try:
    from kiteconnect import KiteConnect
except ImportError:  # pragma: no cover
    KiteConnect = None  # type: ignore[assignment]


READ_ONLY_MODE = "read-only"


def get_broker_account_summary() -> BrokerAccountSummary:
    # Read from database
    db_api_key = ""
    db_access_token = ""
    db_enabled = "false"
    
    try:
        from backend.database.db import get_connection
        import json
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM user_settings WHERE key = 'zerodha_api_key'")
            row = cursor.fetchone()
            if row:
                db_api_key = json.loads(row["value"])
            cursor.execute("SELECT value FROM user_settings WHERE key = 'zerodha_access_token'")
            row = cursor.fetchone()
            if row:
                db_access_token = json.loads(row["value"])
            cursor.execute("SELECT value FROM user_settings WHERE key = 'zerodha_enabled'")
            row = cursor.fetchone()
            if row:
                db_enabled = str(json.loads(row["value"])).lower()
    except Exception:
        pass

    env_enabled = os.getenv("FININTEL_ENABLE_BROKER_READONLY", "false").lower() == "true"
    is_enabled = env_enabled or db_enabled == "true"

    if not is_enabled:
        return BrokerAccountSummary(
            provider="zerodha",
            status="disabled",
            mode=READ_ONLY_MODE,
            message="Broker sync is disabled. Enable Zerodha connection in Settings and provide read-only credentials to fetch account details.",
        )

    api_key = db_api_key if db_api_key else os.getenv("ZERODHA_API_KEY", "").strip()
    access_token = db_access_token if db_access_token else os.getenv("ZERODHA_ACCESS_TOKEN", "").strip()
    api_secret = os.getenv("ZERODHA_API_SECRET", "").strip()
    request_token = os.getenv("ZERODHA_REQUEST_TOKEN", "").strip()
    
    if api_secret or request_token:
        return BrokerAccountSummary(
            provider="zerodha",
            status="blocked",
            mode=READ_ONLY_MODE,
            message="Interactive broker credentials are blocked. Only read-only access-token based account intelligence is permitted.",
        )
    if not api_key or not access_token or KiteConnect is None:
        return BrokerAccountSummary(
            provider="zerodha",
            status="unavailable",
            mode=READ_ONLY_MODE,
            message="Broker sync requires ZERODHA_API_KEY and ZERODHA_ACCESS_TOKEN configured in Settings or in the environment.",
        )

    kite = KiteConnect(api_key=api_key)
    kite.set_access_token(access_token)

    profile = kite.profile()
    holdings_payload = kite.holdings()
    margins = kite.margins()

    holdings: list[BrokerHolding] = []
    total_investment = 0.0
    current_value = 0.0
    for item in holdings_payload:
        quantity = float(item.get("quantity") or 0.0)
        average_price = float(item.get("average_price") or 0.0)
        last_price = float(item.get("last_price") or 0.0)
        invested = quantity * average_price
        market_value = quantity * last_price
        total_investment += invested
        current_value += market_value
        holdings.append(
            BrokerHolding(
                symbol=str(item.get("tradingsymbol") or item.get("symbol") or "UNKNOWN"),
                quantity=quantity,
                average_price=round(average_price, 2),
                last_price=round(last_price, 2),
                pnl=round(market_value - invested, 2),
            )
        )

    equity = margins.get("equity", {}) if isinstance(margins, dict) else {}
    available_cash = float(equity.get("available", {}).get("cash") or 0.0)
    account_id = profile.get("user_id") if isinstance(profile, dict) else None
    account_name = profile.get("user_name") if isinstance(profile, dict) else None

    return BrokerAccountSummary(
        provider="zerodha",
        account_id=account_id,
        account_name=account_name,
        total_investment=round(total_investment, 2),
        current_value=round(current_value, 2),
        available_cash=round(available_cash, 2),
        pnl=round(current_value - total_investment, 2),
        holdings=holdings,
        status="connected",
        mode=READ_ONLY_MODE,
        message="Read-only broker intelligence is enabled. Trading and order placement are intentionally unsupported.",
    )
