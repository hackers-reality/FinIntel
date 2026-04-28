# 🛡️ Sovereign Intelligence Nexus (v2.4)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master Candidate | **Build:** v2.4 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine engineered to provide retail traders with institutional-grade edge. It synthesizes real-time market pulse, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 📜 Table of Contents
1. [Core Features](#-core-features)
2. [The Sovereign Key Vault](#-the-sovereign-key-vault)
3. [Zerodha Tactical Integration](#-zerodha-tactical-integration)
4. [AI Reasoning Mesh](#-ai-reasoning-mesh)
5. [Tactical Installation](#-tactical-installation)
6. [API Forensic Guide](#-api-forensic-guide)

---

## 🛡️ Core Features
- **NVIDIA Powered:** Prioritizes **Llama 3.1 405B** via NVIDIA NIM for free, institutional-grade reasoning.
- **Zero-Touch Auth:** Autonomous daily session synchronization using headless TOTP 2FA.
- **Elite Domain Mesh:** Research queries weighted against high-authority finance domains.
- **Forensic Filing Engine:** LLM-powered scanning of regulatory documents for "fine print" risks.
- **Native OS Alerts:** High-priority Windows toast notifications for VIX spikes.
- **Nexus Command Palette:** `Cmd+K` tactical interface for instant navigation.

---

## 🔑 The Sovereign Key Vault

To fully ignite the Nexus, populate your `.env` file or the **Strategic Vault** UI with the following keys:

| Category | Tactical Key | Priority | Purpose |
| :--- | :--- | :--- | :--- |
| **Broker** | `ZERODHA_API_KEY` | **Mandatory** | Live Holdings & Position Data |
| **Broker** | `ZERODHA_API_SECRET`| **Mandatory** | Secure Session Generation |
| **Intelligence**| `NVIDIA_API_KEY` | **Recommended**| Free Institutional Reasoning (Llama 405B) |
| **Intelligence**| `OPENAI_API_KEY` | **Optional** | Primary Fallback for Reasoning |
| **Intelligence**| `ANTHROPIC_API_KEY`| **Optional** | Forensic Document Analysis |
| **Intelligence**| `GEMINI_API_KEY` | **Optional** | Multimodal Context Handling |

---

## ⚡ Zerodha Tactical Integration

The Nexus supports two distinct authentication flows for your daily session:

### Option A: Zero-Touch Auth (Recommended)
1. **Vault Your Credentials:** Navigate to the **Settings** tab in the Nexus Interface.
2. **Inject Strategic Data:** Enter your Zerodha Client ID, Password, and TOTP Secret Key.
3. **Ignite Sync:** Click **"Ignite Nexus Sync"**. The Nexus will handle the 2FA and session autonomously.

### Option B: Manual Handshake (Fallback)
1. **Developer Portal:** Set **Redirect URL** to `http://127.0.0.1` at [kite.trade](https://kite.trade/).
2. **Login URL:** Open `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`.
3. **Extract Token:** Copy the `request_token` from the URL bar of the redirected page (ignore the "site can't be reached" error).
4. **Generate Session:**
   ```python
   from kiteconnect import KiteConnect
   kite = KiteConnect(api_key="YOUR_API_KEY")
   data = kite.generate_session("YOUR_TOKEN", api_secret="YOUR_SECRET")
   print(data["access_token"])
   ```
5. **Inject:** Update `ZERODHA_ACCESS_TOKEN` in your `.env`.

---

## 🧠 AI Reasoning Mesh

The Nexus v2.4 utilizes a multi-mesh reasoning strategy, prioritizing free institutional-grade power:

1. **NVIDIA NIM (Priority 1):** Utilizes `meta/llama-3.1-405b-instruct`. 
2. **OpenAI (Priority 2):** Fallback to `gpt-4o` for structural redundancy.
3. **Anthropic/Gemini:** Integrated for specialized forensic arbitration.

---

## 🛠️ Tactical Installation

### Windows (Native/PowerShell)
1. **Environment Tuning:**
   ```powershell
   .\install.ps1
   ```
2. **Ignition:** Execute `.\finintel.ps1` or `python run.py`.

---

## 📡 API Forensic Guide

| Provider | Purpose | Data Depth |
| :--- | :--- | :--- |
| **KiteConnect** | Primary Brokerage | Live Holdings, PnL, Order Book |
| **NVIDIA Mesh** | Alpha Reasoning | Strategic Synthesis & Verdicts |
| **Elite Mesh** | Authority Data | Moneycontrol, Livemint, SEBI Filings |
| **yfinance** | Market Pulse | Indices, VIX, Forex, Sentiment |

---
**Status: Sovereign & Invincible.**
*The Nexus is Active.*
