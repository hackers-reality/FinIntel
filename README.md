# 🛡️ Sovereign Intelligence Nexus (v2.3)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master Candidate | **Build:** v2.3 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine engineered to provide retail traders with institutional-grade edge. It synthesizes real-time market pulse, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 📜 Table of Contents
1. [Core Features](#-core-features)
2. [Strategic Components](#-strategic-components)
3. [Zerodha Tactical Integration](#-zerodha-tactical-integration)
4. [Tactical Installation](#-tactical-installation)
5. [Docker Orchestration](#-docker-orchestration)
6. [API Forensic Guide](#-api-forensic-guide)
7. [Tactical Operations](#-tactical-operations)

---

## 🛡️ Core Features
- **Zerodha Kite Pulse:** Native tracking of live holdings and positions.
- **Elite Domain Mesh:** Research queries weighted against high-authority finance domains.
- **Forensic Filing Engine:** LLM-powered scanning of regulatory documents for "fine print" risks.
- **Whale Trade Sentinel:** Automated tracking of institutional whale activity.
- **Native OS Alerts:** High-priority Windows toast notifications for VIX spikes.
- **Nexus Command Palette:** `Cmd+K` tactical interface for instant navigation.

---

## 🔑 Zerodha Tactical Integration

To activate the live portfolio and institutional data stream, follow these steps:

### 1. Developer Account
- Go to [Kite Connect Developer Portal](https://kite.trade/).
- Create an account and log in.
- **Create a New App:** Provide a name and set the **Redirect URL** to `http://127.0.0.1`.
- Note your **API Key** and **API Secret**.

### 2. Manual Access Token Generation
Zerodha requires a fresh `access_token` daily. Follow this flow to generate it:
1.  **Login URL:** Open this in your browser:  
    `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`
2.  **Authorize:** Log in with your Zerodha credentials.
3.  **Extract Request Token:** You will be redirected to `http://127.0.0.1/?request_token=XXXXX`. Copy the `request_token`.
4.  **Generate Access Token:** Use the following Python command to get your token:
    ```python
    from kiteconnect import KiteConnect
    kite = KiteConnect(api_key="YOUR_API_KEY")
    data = kite.generate_session("YOUR_REQUEST_TOKEN", api_secret="YOUR_API_SECRET")
    print(data["access_token"])
    ```

### 3. Environment Injection
Add the generated keys to your `.env` file:
```env
ZERODHA_API_KEY=your_api_key_here
ZERODHA_ACCESS_TOKEN=your_access_token_here
```

---

## 🛠️ Tactical Installation

### Windows (Native/PowerShell)
1. **Prerequisites:** Install Python 3.10+ and Node.js 20+.
2. **Environment Tuning:**
   ```powershell
   # Run the Nexus Installer
   .\install.ps1
   ```
3. **Ignition:** Execute `.\finintel.ps1` in your terminal.

---

## 🐳 Docker Orchestration

```bash
# Build and Launch the Nexus Stack
docker-compose up --build -d
```

---

## 📡 API Forensic Guide

| Provider | Purpose | Data Depth |
| :--- | :--- | :--- |
| **KiteConnect** | Primary Brokerage | Live Holdings, PnL, Order Book |
| **OpenAI** | Reasoning Mesh | Forensic Analysis, Strategic Verdicts |
| **Elite Mesh** | Authority Data | Moneycontrol, Livemint, SEBI Filings |
| **yfinance** | Market Pulse | Indices, VIX, Forex, Sentiment |

---

## ⌨️ Tactical Operations

- **`Ctrl+K` / `Cmd+K`**: Launch the **Nexus Command Palette**.
- **`T`**: Toggle **Terminal Mode** (High-Contrast Monospace).

---
**Status: Sovereign & Invincible.**
*The Nexus is Active.*
