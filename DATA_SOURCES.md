# FinIntel Pro: Real-Time Data Architecture & Rationale

This document identifies and justifies the selection of the primary market data engines used in FinIntel Pro to meet the "Mega Project" requirement for free, real-time candlestick data without token limits.

## 1. Primary Market Data: Yahoo Finance (yfinance)
**Selection:** `yfinance` Python Library
**Rationale:**
- **Zero Token Constraints:** Unlike Alpha Vantage or Finnhub, yfinance scrapes publicly available Yahoo Finance data, avoiding API key rate limits and tier costs.
- **Comprehensive Asset Coverage:** Provides high-fidelity data for NSE/BSE stocks, INR Crypto pairs, and Commodities—all within a single integration.
- **Real-time Synchronization:** Delivers 1-minute interval data (candlesticks) which is sufficient for sovereign trade research.
- **Historical Depth:** Allows for multi-year historical analysis (daily/weekly) and 1-month intraday analysis (1m/5m/15m).

## 2. Supplementary Validation: Google Finance
**Strategy:**
- Google Finance is used as a "Sentinel Validation" layer. When the system detects a major volatility event (e.g., a >1.5% spike), it cross-references the Google Finance public ticker to confirm the data point before alerting the user.

## 3. Web Intelligence: DuckDuckGo Search (DDGS)
**Selection:** `duckduckgo-search` (DDGS)
**Rationale:**
- **Headless & Private:** DDGS allows the AI to perform autonomous headless searches across news, blogs, and social threads without requiring a Google Search API key (which has severe limits).
- **Recency:** Filters search results for "Last 24 Hours" to ensure all intelligence is "fresh" as per the system specification.

## 4. Social Sentiment: Multi-Source Aggregation
- **Twitter/X:** Scraped via DDGS "site:twitter.com" and "expert analysis" queries to bypass expensive API tiers while maintaining sentiment awareness.
- **Reddit:** Aggregated via DDGS "site:reddit.com" to capture community "Bulls/Bears" sentiment.

## 5. Compliance & Accuracy
All data is positioned as "Research Only." The use of multiple sources (YF + DDG + Sentiment) ensures that recommendations are backed by a **Source Consensus**, reducing the risk of a single-source data error.
