# FinIntel Session Log

This file records the key decisions and outcomes from the Codex sessions on FinIntel. It is a durable summary of the conversation and implementation history, not a verbatim transcript.

## Core Product Direction

- FinIntel is positioned as an Indian financial intelligence and research platform, not a brokerage automation tool.
- Risky trading flows are intentionally blocked.
- Broker integration, when enabled, must remain read-only and limited to portfolio/account intelligence.
- The product should prioritize trust, compliance, security, maintainability, and investor utility.

## Architecture Changes Delivered

- Replaced the monolithic backend with modular FastAPI routers, schemas, services, security, middleware, and tests.
- Moved the frontend onto typed hooks and services.
- Enabled strict TypeScript settings and removed most `any` usage.
- Added request tracing and readiness endpoints on the backend.
- Added CI via GitHub Actions.
- Updated Docker and docker-compose for better deployment discipline.

## Security and Compliance Decisions

- Removed unsafe local secret vault behavior from the UI.
- Disabled interactive broker credential flows.
- Explicitly blocked broker secrets that imply order-trading or token-exchange workflows.
- Added compliance surfaces for risk, privacy, and terms messaging.
- Added a read-only broker account summary path only.

## Research and Data Sources

- `yfinance` is used for market data and portfolio valuation context.
- DuckDuckGo search is used for company due diligence, news, blogs, and public commentary signals.
- Local SQLite stores portfolio, settings, and application data.
- The product should not drift into a Zerodha-centric design.

## Portfolio-Aware Research

- Research outputs now include company due diligence and portfolio context.
- Analysis considers local holdings, optional read-only broker holdings, available cash, and exposure.
- Guidance is framed as research and context, not direct trade instructions.

## Dependency and Deployment Hardening

- Frontend advisories were cleaned up by upgrading the Vite toolchain.
- Backend dependencies were reduced to the ones actually used.
- Production health and readiness checks were added.
- Deployment docs were updated to describe the safer operating model.

## Verification Performed

- Frontend build succeeded.
- Frontend TypeScript checks passed.
- Backend compile checks passed.
- Backend tests passed.
- `npm audit` was clean after the frontend toolchain refresh.

## Remaining Gaps Identified

- Full user authentication maturity is still missing.
- Premium market data sources are still needed for higher-fidelity intelligence.
- Advanced analytics depth still needs expansion.
- Live deployment verification and monitoring can be strengthened further.

## Important Constraints

- Do not reintroduce order placement, sell/buy automation, or broker-execution flows.
- Keep the product framed as research and intelligence tooling.
- Avoid hype-heavy or brokerage-centric messaging.
- Preserve repo cleanliness and avoid unnecessary tracked artifacts.

## Commit History

- `a105a49` Harden platform architecture and add read-only research intelligence
- `40cfd2c` Add portfolio-aware research context and CI safeguards
- `fee0f16` Fix frontend advisories and tighten deployment guardrails

