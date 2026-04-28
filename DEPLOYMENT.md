# Sovereign 2.0: Deployment & API Guide

This document maps the production endpoints and setup flow for the Sovereign 2.0 build.

## Core Endpoints
- `GET /market/overview`: Real-time indices (Nifty, Sensex, VIX) + Favorites.
- `GET /market/zerodha/holdings`: Actual holdings from KiteConnect.
- `POST /analyze/document`: Forensic LLM analysis of legal/regulatory text.
- `GET /market/behavior/{ticker}`: Technical pattern and volume anomaly analysis.
- `GET /market/events/{ticker}`: Pending court cases/earnings/regulatory events.
- `GET /market/research/{ticker}`: Full strategic synthesis (Score, Risks, Rationale).

## Setup Flow
1. **Zerodha Credentials:**
   - Obtain API Key and Access Token from Zerodha Developer Console.
   - Encrypt and store in `.env` or use the Settings tab (encrypted at rest).
2. **Sentinel Thread:**
   - The system runs a background sync thread that monitors VIX spikes every 5 mins and scrapes FII/DII data daily at 6 PM IST.
3. **PWA Integration:**
   - Run the production build to enable Service Worker caching for mobile home-screen use.
