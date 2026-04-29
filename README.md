# FinIntel

FinIntel is an Indian market intelligence platform for portfolio monitoring, sector analysis, ticker research, and document risk review. The current build focuses on safer defaults, stronger type safety, modular backend services, and clearer compliance language.

## What it does

- Market overview for Nifty, Sensex, India VIX, and USD/INR
- Sector performance heatmap for major Indian indices
- Portfolio valuation and holding-level PnL tracking
- Heuristic research summaries and momentum/behavior signals
- Document clause scanning for common legal and risk keywords
- Compliance, privacy, and risk-disclosure surfaces in the product

## Architecture

- Frontend: React, TypeScript, Vite
- Backend: FastAPI with modular routers, schemas, services, and SQLite persistence
- Data: Yahoo Finance market data and local application records
- Session model: short-lived signed application sessions for protected write operations

## Security and compliance posture

- Broker credentials are not collected or persisted in the application UI
- Provider keys should be supplied through environment variables or an external secret manager
- Zerodha integration, when enabled, is read-only portfolio intelligence only; FinIntel does not place, modify, or cancel orders
- Protected write routes require a signed session token issued by the backend
- The product includes investment-risk, privacy, and terms disclosures
- The app is an informational research tool, not a brokerage or personalized advisory service

## Local development

```bash
# Backend
pip install -r backend/requirements.txt
python -m backend.main

# Frontend
npm install
npm run dev
```

Or run both with:

```powershell
python run.py
```

## Environment

Use `.env.example` as the baseline. Important variables:

- `VITE_API_BASE_URL`
- `FININTEL_APP_SECRET`
- `FININTEL_ALLOWED_ORIGINS`
- `FININTEL_DB_PATH`
- `FININTEL_ENABLE_BROKER_READONLY`
- `ZERODHA_API_KEY`
- `ZERODHA_ACCESS_TOKEN`

## Project layout

```text
backend/
  api/
  config/
  database/
  middleware/
  schemas/
  security/
  services/
  tests/
src/
  components/
  constants/
  hooks/
  services/
  types/
```

## Validation

- Frontend type check: `npx tsc -p tsconfig.app.json --noEmit`
- Backend compile check: `python -m compileall backend`
- Backend tests: `python -m unittest backend.tests.test_app`

## Known limits

- Market data quality depends on third-party sources and may be delayed
- Research outputs are heuristic summaries, not analyst-grade recommendations
- Company due diligence uses external search results for legal, news, blog, and public-commentary context and should be manually reviewed
- Broker sync is read-only and intended to enrich analytics with holdings, investment value, cash, and PnL context
