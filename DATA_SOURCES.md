# Sovereign Intelligence Nexus: Real-Time Data Architecture

This document defines the high-fidelity data engines that power the Sovereign Intelligence Nexus, ensuring institutional-grade accuracy and zero-latency market awareness for the Indian retail trader.

---

## 1. Primary Tactical Source: Zerodha KiteConnect
**Selection:** `kiteconnect` Python Integration
**Strategic Rationale:**
- **Institutional Fidelity:** Direct API access to the Zerodha exchange stream for live holdings, positions, and order-book depth.
- **Precision:** Zero-latency data synchronization for NSE/BSE asset classes.
- **Portfolio Nexus:** Provides the definitive source of truth for your live capital exposure.

## 2. Institutional Fallback: Yahoo Finance (yfinance)
**Selection:** `yfinance` Strategic Mesh
**Strategic Rationale:**
- **Redundancy:** Serves as the high-availability fallback if the primary broker stream is interrupted.
- **Global Context:** Delivers data for India VIX (^INDIAVIX), Global Indices (Nifty, Sensex), and USD/INR Forex pairs.
- **Zero Token Constraints:** Facilitates rapid, un-throttled research cycles across the global asset universe.

## 3. Web Intelligence Mesh: DuckDuckGo Search (DDGS)
**Selection:** `duckduckgo-search` (DDGS)
**Strategic Rationale:**
- **The Elite Mesh:** Implements a specialized domain-mesh query targeting only high-authority finance sites (Moneycontrol, ET, SEBI).
- **Forensic Recency:** Filters results for the last 24-48 hours to ensure all "Whale Activity" and "Fine Print" detections are tactical.
- **Privacy First:** Headless, anonymous search logic ensuring your strategic queries are never tracked.

## 4. Reasoning Mesh: OpenAI GPT-4o
- **Selection:** GPT-4o "Intelligence" Model
- **Strategic Rationale:** Performs the final strategic synthesis, converting raw data, filings, and news into high-conviction "Alpha Verdicts."

---
**Status: Sovereign & Invincible.**
*Data Integrity is Absolute.*
