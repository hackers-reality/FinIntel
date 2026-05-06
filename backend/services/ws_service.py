import asyncio
import json
import logging
from datetime import datetime, timezone

import yfinance as yf
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from backend.security.jwt import decode_access_token
from backend.api.auth import _revoked_tokens_set, _is_token_revoked

logger = logging.getLogger("finintel.ws")

_clients: set[WebSocket] = set()
_market_cache: dict[str, object] = {}


async def _verify_ws_token(websocket: WebSocket) -> bool:
    token = websocket.query_params.get("token") or websocket.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return False
    if token in _revoked_tokens_set:
        return False
    if _is_token_revoked(token):
        return False
    try:
        decode_access_token(token)
        return True
    except Exception:
        return False


async def broadcast(event_type: str, payload: dict) -> None:
    message = json.dumps({
        "type": event_type,
        "payload": payload,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    disconnected = set()
    for client in _clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)
    _clients.difference_update(disconnected)


async def ws_endpoint(websocket: WebSocket) -> None:
    if not await _verify_ws_token(websocket):
        await websocket.close(code=4003, reason="Unauthorized")
        return
    await websocket.accept()
    _clients.add(websocket)
    logger.info("WebSocket client connected. Total: %d", len(_clients))
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await _handle_message(websocket, message)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "payload": {"detail": "Invalid JSON."}}))
    except WebSocketDisconnect:
        pass
    finally:
        _clients.discard(websocket)
        logger.info("WebSocket client disconnected. Total: %d", len(_clients))


async def _handle_message(websocket: WebSocket, message: dict) -> None:
    action = message.get("action")
    if action == "subscribe":
        channels = message.get("channels", [])
        await websocket.send_text(json.dumps({
            "type": "subscribed",
            "payload": {"channels": channels},
        }))
    elif action == "request_snapshot":
        symbol = message.get("symbol", "RELIANCE.NS")
        data = get_market_snapshot(symbol)
        await websocket.send_text(json.dumps({
            "type": "snapshot",
            "payload": data,
        }))
    else:
        await websocket.send_text(json.dumps({
            "type": "error",
            "payload": {"detail": f"Unknown action: {action}"},
        }))


def get_market_snapshot(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="5d")
        if history.empty:
            return {"symbol": symbol, "error": "No data available"}
        last = history.iloc[-1]
        prev = history.iloc[-2] if len(history) > 1 else last
        close = float(last["Close"])
        prev_close = float(prev["Close"])
        change = round(close - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2) if prev_close else 0.0
        return {
            "symbol": symbol,
            "price": round(close, 2),
            "change": change,
            "change_percent": change_pct,
            "volume": float(last.get("Volume", 0)),
            "high": round(float(last.get("High", 0)), 2),
            "low": round(float(last.get("Low", 0)), 2),
            "open": round(float(last.get("Open", 0)), 2),
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}


async def market_data_stream_task() -> None:
    symbols = ["^NSEI", "^BSESN", "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"]
    while True:
        for symbol in symbols:
            try:
                data = get_market_snapshot(symbol)
                _market_cache[symbol] = data
                await broadcast("market_update", {"symbol": symbol, "data": data})
            except Exception:
                pass
        await asyncio.sleep(30)


def get_cached_market(symbol: str) -> dict | None:
    return _market_cache.get(symbol)
