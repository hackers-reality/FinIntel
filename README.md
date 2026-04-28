# 🛡️ Sovereign Intelligence Nexus (v2.4)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master Candidate | **Build:** v2.3 | **System:** Sovereign Intelligence Nexus

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

---

## ⚡ Zerodha Tactical Integration

### Phase 1: Portal Deployment
1. **Navigate to the Portal:** Open the [Kite Connect App Dashboard](https://kite.trade/apps).
2. **Authentication:** Log in (or create a developer account).
3. **App Creation:** 
   - Click the **"Create New App"** button (Top Right).
   - **App Name:** `Sovereign Nexus`
   - **Redirect URL:** `http://127.0.0.1` (Crucial: Must match exactly).
   - **Postback URL:** Leave blank.
   - **Description:** `Institutional Research Nexus`.
4. **Key Extraction:** Once created, click on your app to find your **API Key** and **API Secret**.

---

### Phase 2: Authentication Flows

#### Option A: Zero-Touch Auth (Recommended)
1. **Vault Your Credentials:** Navigate to the **Settings** tab in the Nexus Interface (`http://localhost:5173/settings`).
2. **Inject Strategic Data:** Enter your Zerodha **User ID**, **Password**, **TOTP Secret Key**, **API Key**, and **API Secret**.
3. **Ignite Sync:** Click **"Ignite Nexus Sync"**. The Nexus will handle the 2FA and session autonomously.

#### Option B: Manual Handshake (Fallback)
1. **Login URL:** Open `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`.
2. **Authorize:** Log in and approve the request.
3. **Extract Token:** Copy the `request_token` from the URL bar of the redirected "broken" page.
4. **Generate Session:**
   ```python
   from kiteconnect import KiteConnect
   kite = KiteConnect(api_key="YOUR_API_KEY")
   data = kite.generate_session("YOUR_TOKEN", api_secret="YOUR_SECRET")
   print(data["access_token"])
   ```

---

## 🧠 AI Reasoning Mesh

The Nexus v2.4 utilizes a multi-mesh reasoning strategy, prioritizing free institutional-grade power:

1. **NVIDIA NIM (Priority 1):** Utilizes `meta/llama-3.1-405b-instruct` for free Alpha generation.
2. **OpenAI (Priority 2):** Fallback for structural redundancy.

---

## 🛠️ Tactical Installation

### Windows (Native/PowerShell)
1. **Environment Tuning:**
   ```powershell
   .\install.ps1
   ```
2. **Ignition:** Execute `.\finintel.ps1` or `python run.py`.

---
**Status: Sovereign & Invincible.**
*The Nexus is Active.*
