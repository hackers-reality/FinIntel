# 🛡️ Sovereign Intelligence Nexus (v2.7)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master | **Build:** v2.7 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine engineered to provide retail traders with institutional-grade edge. It synthesizes real-time market pulse, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 🗺️ System Architecture (The Nexus Map)

```mermaid
graph TD
    subgraph "Universal Intelligence Multiverse"
        A[Zerodha KiteConnect] -->|Live Holdings/Positions| E[Intelligence Kernel]
        B[yfinance] -->|Indices/VIX/Forex| E
        C[Elite Domain Mesh] -->|High-Authority Research| E
        D1[NVIDIA NIM Mesh] -->|Alpha Synthesis| E
        D2[Groq Cloud Mesh] -->|Ultra-Fast Reasoning| E
        D3[OpenRouter Mesh] -->|Future-Class Models| E
    end

    subgraph "Intelligence Kernel (Python/FastAPI)"
        E -->|WebSocket Pulse| F[Tactical Interface]
        E -->|SQLite Sync| G[(Nexus DB)]
        E -->|Sentinel Loop| H[Native Toast Alerts]
        E -->|Autonomous Auth| I[Zero-Touch Kernel]
        E -->|Live Price Stream| M[WebSocket Pulse]
    end

    subgraph "Tactical Interface (React/Vite)"
        F -->|Filing Forensics| J[Risk Analysis]
        F -->|Strategic Vault| K[Multiverse Settings]
        F -->|Cmd+K Palette| L[Action Nerve Center]
        F -->|Status Sentinel| N[Market OPEN/CLOSED]
    end
```

---

## 📜 Table of Contents
1. [Core Strategic Features](#-core-strategic-features)
2. [The Sovereign Key Vault](#-the-sovereign-key-vault)
3. [Zerodha Tactical Deployment](#-zerodha-tactical-deployment)
4. [AI Intelligence Multiverse](#-ai-intelligence-multiverse)
5. [Tactical Installation Guide](#-tactical-installation-guide)
6. [Operational Commands](#-operational-commands)
7. [API Forensic Reference](#-api-forensic-guide)
8. [Security & Sovereignty](#-security--sovereignty)

---

## 🛡️ Core Strategic Features

- **Live WebSocket Pulse (v2.7):** Real-time tactical price streaming for watchlists and portfolio holdings. Zero-latency awareness for high-stakes arbitration.
- **Market Status Sentinel (v2.7):** Dynamic detection and display of IST market hours (OPEN/CLOSED) in the tactical interface with high-fidelity visual indicators.
- **Intelligence Multiverse:** Decentralized support for NVIDIA NIM, Groq, OpenRouter, and OpenAI. Switch intelligence tiers in real-time based on cost, speed, or power requirements.
- **Zero-Touch Zerodha Auth:** Autonomous daily session synchronization. The system performs headless logins, generates TOTP tokens, and establishes the KiteConnect stream without user intervention.
- **Elite Domain Mesh:** A specialized forensic search engine that weights intelligence from high-authority finance domains (Moneycontrol, SEBI, NSE) while filtering out retail "noise."
- **Forensic Filing Engine:** Specialized LLM-powered scanning of regulatory filings, court cases, and corporate announcements to identify hidden risks and "fine print" liabilities.
- **Institutional Whale Sentinel:** Automated tracking of high-conviction buying/selling activity from institutional "Whales" like Vijay Kedia, Ashish Kacholia, and others.
- **Sentinel Sync Loop:** Background monitoring of India VIX (>20 alert), FII/DII net flows, and global market direction (Gift Nifty) to provide a 360-degree tactical overview.
- **Native OS Integration:** High-priority Windows toast notifications (winotify) for critical volatility spikes and institutional flow updates.

---

## 🔑 The Sovereign Key Vault

To ignite the Nexus, populate your `.env` file or the **Strategic Vault** UI with these tactical keys:

| Category | Tactical Key | Priority | Purpose |
| :--- | :--- | :--- | :--- |
| **Broker** | `ZERODHA_API_KEY` | **Mandatory** | Primary Market Data & Trade Stream |
| **Broker** | `ZERODHA_API_SECRET`| **Mandatory** | Secure Session & Handshake Generation |
| **Broker** | `ZERODHA_USER_ID` | **Recommended**| Required for Zero-Touch Autonomous Sync |
| **Broker** | `ZERODHA_PASSWORD` | **Recommended**| Encrypted at rest for Autonomous Login |
| **Broker** | `ZERODHA_TOTP_SECRET`| **Recommended**| Used by the pyotp kernel for 2FA bypass |
| **Intelligence**| `NVIDIA_API_KEY` | **Priority 1** | Free Institutional Reasoning (Llama 405B) |
| **Intelligence**| `GROQ_API_KEY` | **Priority 2** | Ultra-High Speed Strategic Reasoning |
| **Intelligence**| `OPENROUTER_API_KEY`| **Priority 3** | Access to Future-Grade Models (GPT-5.5) |
| **Intelligence**| `OPENAI_API_KEY` | **Fallback** | Industry Standard Redundancy |

---

## ⚡ Zerodha Tactical Deployment

### Phase 1: Portal Configuration
1. **Developer Portal:** Navigate to [https://kite.trade/apps](https://kite.trade/apps).
2. **App Creation:** Click **"Create New App"** (Top Right).
3. **The Client ID:** You will be asked for your **Zerodha Client ID**. 
   - **Discovery:** Open [Kite Web](https://kite.zerodha.com/), click on your Profile (Bottom Left). Your ID (e.g., `AB1234`) is under your name.
4. **Redirect URL:** Set exactly to `http://127.0.0.1`.
5. **Key Extraction:** Once created, click the app to find your **API Key** and **API Secret**.

### Phase 2: Authentication Handshake

#### Option A: Zero-Touch Auth (Automated)
1. Navigate to the **Settings** tab in the Nexus UI.
2. Enter your Client ID, Password, and TOTP Secret.
3. Click **"Ignite Nexus Sync"**. The Nexus autonomously performs the login and session synchronization.

#### Option B: Manual Handshake (Fallback)
1. Open `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`.
2. **Don't Worry:** Upon login, the browser WILL show a "Site can't be reached" error. **This is expected behavior.**
3. Copy the `request_token=XXXXX` string from the URL bar of that "broken" page.

---

## 🧠 AI Intelligence Multiverse

The Nexus v2.7 utilizes a **Universal Reasoning Mesh**. You can switch providers in the **Strategic Vault** UI:

- **NVIDIA NIM Tier:** Utilizing `meta/llama-3.1-405b-instruct`. Recommended "Gold Standard"—institutional-grade reasoning for free.
- **Groq High-Speed Tier:** Powered by Llama 3 70B, providing ultra-low latency strategic scans.
- **OpenRouter Decentralized Tier:** A gateway to future-class models, including **GPT-5.5** and **Claude Opus 4.7**.

---

## 🛠️ Tactical Installation Guide

### Windows (Native Deployment)
1. **Provisioning:** Install Python 3.10+ and Node.js 20+.
2. **Nexus Installation:**
   ```powershell
   # Run the institutional installer to provision dependencies and register the global command
   .\install.ps1
   ```
   > [!IMPORTANT]
   > After running the installer, **RESTART your terminal** to initialize the global `finintel` path.

3. **Nexus Ignition:**
   ```powershell
   # Type this from ANY directory to ignite the Nexus
   finintel
   ```

---

## ⌨️ Operational Commands

- **`finintel`**: Global command to launch the Nexus from any terminal.
- **`Ctrl+K` / `Cmd+K`**: Launch the **Nexus Command Palette**.
- **`T`**: Toggle **Terminal Mode** (Pure Monospace Obsidian Aesthetic).
- **`S`**: Open the **Strategic Vault** (Settings) instantly.

---

## 📡 API Forensic Guide

| Layer | Provider | Fidelity |
| :--- | :--- | :--- |
| **Tactical** | KiteConnect | 100% Exchange Fidelity (Live) |
| **Reasoning** | NVIDIA/Groq | Multi-Provider Synthesis |
| **Intelligence**| Elite Mesh | High-Authority News Forensics |
| **Persistence** | SQLite | 100% Local Data Sovereignty |

---

## 🛡️ Security & Sovereignty
1. **Local-First:** No strategic data ever leaves your machine.
2. **Encrypted Vault:** Sensitive credentials are encrypted with **AES-256 (Fernet)**.
3. **Open Source Core:** Auditable, utilitarian, and strictly for retail alpha.

---
**Status: Sovereign & Invincible.**
*Gold Master (v2.7 Mega-Edition) Synchronized.*
