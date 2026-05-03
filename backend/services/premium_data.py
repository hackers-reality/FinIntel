import logging
import os
from abc import ABC, abstractmethod
from datetime import datetime, timezone

import httpx

logger = logging.getLogger("finintel.premium")


class PremiumDataError(Exception):
    pass


class PremiumConnector(ABC):
    name: str

    @abstractmethod
    async def get_realtime_quote(self, symbol: str) -> dict:
        pass

    @abstractmethod
    async def get_historical(self, symbol: str, period: str, interval: str) -> list[dict]:
        pass

    @abstractmethod
    async def get_market_depth(self, symbol: str) -> dict:
        pass

    def is_configured(self) -> bool:
        return bool(self._api_key())

    @abstractmethod
    def _api_key(self) -> str:
        pass


class AlphaVantageConnector(PremiumConnector):
    name = "alpha_vantage"

    def _api_key(self) -> str:
        return os.getenv("ALPHA_VANTAGE_API_KEY", "")

    async def get_realtime_quote(self, symbol: str) -> dict:
        key = self._api_key()
        if not key:
            raise PremiumDataError("Alpha Vantage API key not configured.")
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={key}"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            data = response.json()
            quote = data.get("Global Quote", {})
            if not quote:
                raise PremiumDataError(f"No quote data for {symbol}")
            return {
                "symbol": symbol,
                "price": float(quote.get("05. price", 0)),
                "change": float(quote.get("09. change", 0)),
                "change_percent": float(quote.get("10. change percent", "0%").replace("%", "")),
                "volume": int(quote.get("06. volume", 0)),
                "high": float(quote.get("03. high", 0)),
                "low": float(quote.get("04. low", 0)),
                "open": float(quote.get("02. open", 0)),
                "previous_close": float(quote.get("07. previous close", 0)),
                "provider": self.name,
            }

    async def get_historical(self, symbol: str, period: str, interval: str) -> list[dict]:
        key = self._api_key()
        if not key:
            raise PremiumDataError("Alpha Vantage API key not configured.")
        function = "TIME_SERIES_INTRADAY" if interval != "1d" else "TIME_SERIES_DAILY"
        params = {"function": function, "symbol": symbol, "apikey": key, "outputsize": "compact"}
        if interval != "1d":
            params["interval"] = interval
        url = "https://www.alphavantage.co/query"
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
            data = response.json()
            time_series_key = "Time Series (Daily)" if interval == "1d" else f"Time Series ({interval})"
            series = data.get(time_series_key, {})
            return [
                {
                    "timestamp": ts,
                    "open": float(v["1. open"]),
                    "high": float(v["2. high"]),
                    "low": float(v["3. low"]),
                    "close": float(v["4. close"]),
                    "volume": int(v["5. volume"]),
                }
                for ts, v in list(series.items())[:50]
            ]

    async def get_market_depth(self, symbol: str) -> dict:
        raise PremiumDataError("Market depth not available via Alpha Vantage.")


class PolygonConnector(PremiumConnector):
    name = "polygon"

    def _api_key(self) -> str:
        return os.getenv("POLYGON_API_KEY", "")

    async def get_realtime_quote(self, symbol: str) -> dict:
        key = self._api_key()
        if not key:
            raise PremiumDataError("Polygon API key not configured.")
        url = f"https://api.polygon.io/v2/last/trade/{symbol}?apiKey={key}"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            data = response.json()
            if data.get("status") != "OK":
                raise PremiumDataError(f"Polygon API error: {data}")
            results = data.get("results", {})
            return {
                "symbol": symbol,
                "price": results.get("p", 0),
                "volume": results.get("s", 0),
                "exchange": results.get("x", ""),
                "timestamp": datetime.fromtimestamp(results.get("t", 0) / 1000, tz=timezone.utc).isoformat() if results.get("t") else None,
                "provider": self.name,
            }

    async def get_historical(self, symbol: str, period: str, interval: str) -> list[dict]:
        key = self._api_key()
        if not key:
            raise PremiumDataError("Polygon API key not configured.")
        multiplier = period.replace("mo", "").replace("d", "")
        url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/range/{multiplier}/{interval}/limit/50?apiKey={key}"
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url)
            data = response.json()
            results = data.get("results", [])
            return [
                {
                    "timestamp": datetime.fromtimestamp(r["t"] / 1000, tz=timezone.utc).isoformat(),
                    "open": r["o"],
                    "high": r["h"],
                    "low": r["l"],
                    "close": r["c"],
                    "volume": r["v"],
                }
                for r in results
            ]

    async def get_market_depth(self, symbol: str) -> dict:
        key = self._api_key()
        if not key:
            raise PremiumDataError("Polygon API key not configured.")
        url = f"https://api.polygon.io/v3/snapshot?ticker.any_of={symbol}&apiKey={key}"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            data = response.json()
            results = data.get("results", [])
            if not results:
                return {"symbol": symbol, "bids": [], "asks": []}
            snapshot = results[0]
            return {
                "symbol": symbol,
                "bids": snapshot.get("session", {}).get("price", 0),
                "asks": [],
                "provider": self.name,
            }


class PremiumDataProvider:
    def __init__(self) -> None:
        self._connectors: list[PremiumConnector] = [
            AlphaVantageConnector(),
            PolygonConnector(),
        ]

    def _get_available_connector(self) -> PremiumConnector | None:
        for connector in self._connectors:
            if connector.is_configured():
                return connector
        return None

    async def get_realtime_quote(self, symbol: str) -> dict:
        connector = self._get_available_connector()
        if not connector:
            raise PremiumDataError("No premium data provider configured. Set ALPHA_VANTAGE_API_KEY or POLYGON_API_KEY.")
        return await connector.get_realtime_quote(symbol)

    async def get_historical(self, symbol: str, period: str, interval: str) -> list[dict]:
        connector = self._get_available_connector()
        if not connector:
            raise PremiumDataError("No premium data provider configured.")
        return await connector.get_historical(symbol, period, interval)

    async def get_market_depth(self, symbol: str) -> dict:
        connector = self._get_available_connector()
        if not connector:
            raise PremiumDataError("No premium data provider configured.")
        return await connector.get_market_depth(symbol)

    def list_providers(self) -> list[dict]:
        return [
            {"name": c.name, "configured": c.is_configured()}
            for c in self._connectors
        ]


premium_provider = PremiumDataProvider()
