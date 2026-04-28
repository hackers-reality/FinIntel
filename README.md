# 🛡️ Sovereign Intelligence Nexus (v2.2)
### *The Ultimate Strategic Command Center for Indian Retail Traders*

> **Status:** Gold Master | **Build:** v2.2 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine designed to provide retail traders with institutional-grade edge. It synthesizes real-time market data, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 🗺️ System Architecture (Nexus Map)

```mermaid
graph TD
    subgraph "External Intelligence Mesh"
        A[Zerodha KiteConnect] -->|Live Holdings/Positions| E[Intelligence Kernel]
        B[yfinance] -->|Market Indices/VIX/Forex| E
        C[DuckDuckGo Search] -->|Whale Tracking/News| E
        D[OpenAI GPT-4o] -->|Forensic Analysis/Research| E
    end

    subgraph "Intelligence Kernel (Python/FastAPI)"
        E -->|WebSocket Pulse| F[Tactical Interface]
        E -->|SQLite Sync| G[(Nexus DB)]
        E -->|Sentinel Loop| H[Windows Toast Alerts]
    end

    subgraph "Tactical Interface (React/Vite)"
        F -->|Filing Forensics| I[Risk Analysis]
        F -->|Swords Arena| J[Parallel Duel]
        F -->|Utilitarian Grid| K[Portfolio Alpha]
    end
```

---

## 📜 Table of Contents
1. [Core Features](#-core-features)
2. [Strategic Components](#-strategic-components)
3. [Tactical Installation](#-tactical-installation)
4. [Docker Orchestration](#-docker-orchestration)
5. [API Deep-Dive](#-api-deep-dive)
6. [Tactical Operations](#-tactical-operations)
7. [System Hardening](#-system-hardening)

---

## 🛡️ Core Features
- **Zerodha Kite Integration:** Native tracking of live holdings and positions.
- **Forensic Filing Engine:** LLM-powered scanning of regulatory documents for "fine print" risks.
- **Whale Trade Sentinel:** Automated tracking of high-profile institutional trades (Vijay Kedia, Ashish Kacholia, etc.).
- **Strategic Duel Arena:** Parallel research arbitration for head-to-head asset comparison.
- **System-Level Alerts:** Native Windows notifications for India VIX spikes and Whale detections.
- **Multi-Turn Chat Context:** Tactical AI Advisor with persistent strategic memory.

---

## 🛠️ Tactical Installation

### Windows (Native/PowerShell)
1. **Prerequisites:** Install Python 3.10+ and Node.js 20+.
2. **Environment Tuning:**
   ```powershell
   # Run the Nexus Installer
   .\install.ps1
   ```
3. **Configuration:** Populate `.env` in the root directory:
   ```env
   ZERODHA_API_KEY=your_key
   ZERODHA_ACCESS_TOKEN=your_token
   OPENAI_API_KEY=your_key
   ```
4. **Ignition:** Execute `finintel` in your terminal.

---

## 🐳 Docker Orchestration

The Nexus is fully containerized for secure, isolated deployment.

```bash
# Build and Launch the Nexus Stack
docker-compose up --build -d
```

### Volume Mapping
- `./backend:/app`: Persists the Intelligence Kernel.
- `./finintel.db:/app/finintel.db`: Persists your portfolio and chat history.

---

## 📡 API Deep-Dive

| Provider | Purpose | Data Depth |
| :--- | :--- | :--- |
| **KiteConnect** | Primary Brokerage | Live Holdings, PnL, Order Book |
| **OpenAI** | Reasoning Mesh | Forensic Analysis, Strategic Verdicts |
| **DDGS** | Strategic Mesh | Real-time News, Institutional Activity |
| **yfinance** | Market Pulse | Indices, VIX, Forex, Sentiment |

---

## ⌨️ Tactical Operations

### Global Hotkeys
- **`1-5`**: Switch between Intelligence Tabs.
- **`T`**: Toggle **Terminal Mode** (High-Contrast Monospace).
- **`Cmd+K`**: Instant Ticker Search (Future Expansion).

### Forensic Filing Scan
Paste the text of any regulatory filing into the **Research > Filing Analyzer**. The Nexus will extract:
- Hidden Risk Clauses
- Regulatory Red Flags
- Legal Sentiment Verdicts

---

## 🔒 System Hardening
- **AES-256 Encryption:** All API keys are encrypted at rest using Fernet (secret.key).
- **Structured Logging:** All intelligence decisions are logged in `system.log` as JSON.
- **Local-First Privacy:** No data ever leaves your machine except for direct API calls to your configured providers.

---
**Status: Sovereign & Invincible.**
*Engineered for High-Conviction Retail Traders.*
