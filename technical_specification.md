# Sovereign Intelligence Nexus — Technical Specification (v2.3)

## 1. System Architecture
The Sovereign Intelligence Nexus is built as an institutional-grade, local-first tactical command center. It utilizes a **Unified Interface + Intelligence Kernel** architecture to ensure zero-latency Alpha generation and absolute data sovereignty.

### Core Components
- **Tactical Interface (Frontend):** React SPA using Tailwind CSS, Framer Motion (Nexus Animations), and Lucide Strategic Icons.
- **Intelligence Kernel (Backend):** FastAPI (Python 3.10+) serving as the orchestration layer for the Data Mesh and Reasoning Mesh.
- **The Nexus Database:** SQLite serving as the single source of truth for portfolio, history, and institutional trends.
- **The Encrypted Vault:** AES-256 (Fernet) encryption for all strategic API keys at rest (`secret.key`).

## 2. Intelligence Mesh Architecture
1. **The Tactical Layer:** Direct KiteConnect integration for live holdings and position tracking.
2. **The Elite Mesh:** Weighted domain filtering (site:moneycontrol.com, etc.) using DDGS for institutional news forensics.
3. **The Reasoning Mesh:** GPT-4o synthesis of raw data, search results, and regulatory filings into "Alpha Verdicts."
4. **The Sentinel Loop:** Background `threading.Thread` loop monitoring India VIX, FII/DII flows, and Whale Activity.

## 3. Weighted Strategic Scoring
Every asset is evaluated across institutional-grade dimensions:
- **Whale Activity (30%):** Institutional buying/selling patterns and "Whale Watch" news.
- **Regulatory Risk (25%):** Forensic analysis of court cases and SEBI filings.
- **Sentiment Mesh (20%):** High-authority domain consensus (Elite Domain Mesh).
- **Behavioral Analytics (25%):** Volume anomalies (20-day MA) and Price Action patterns.

## 4. Operational Endpoints
| Endpoint | Method | Strategic Purpose |
| :--- | :--- | :--- |
| `/market/zerodha/holdings` | GET | Real-time Portfolio Alpha tracking. |
| `/market/research/{ticker}` | GET | Triggers the Elite Domain Mesh research cycle. |
| `/analyze/document` | POST | LLM-powered forensic scan of regulatory filings. |
| `/market/events/{ticker}` | GET | Fetches pending regulatory/legal events for arbitration. |
| `/market/fiidii` | GET | Aggregated institutional trend data (FII/DII). |

## 5. Security & Sovereignty
- **Absolute Localism:** Zero data persistence on external servers. All intelligence is processed locally.
- **Vault Hardening:** Strategic keys are never stored in plain text; they reside encrypted in the Nexus Database.
- **CORS Lock:** Restricted to `localhost:5173` for cross-site attack prevention.

---
**Status: Sovereign & Invincible.**
*The Nexus Specification is Absolute.*
