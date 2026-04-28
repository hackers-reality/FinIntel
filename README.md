# 🛡️ Sovereign Intelligence Nexus (v2.5)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master | **Build:** v2.5 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine engineered to provide retail traders with institutional-grade edge. It synthesizes real-time market pulse, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 🔑 The Sovereign Key Vault

To ignite the Nexus, populate your `.env` file or the **Strategic Vault** UI with these tactical keys:

| Category | Tactical Key | Priority | Purpose |
| :--- | :--- | :--- | :--- |
| **Broker** | `ZERODHA_API_KEY` | **Mandatory** | Live Holdings & Position Data |
| **Broker** | `ZERODHA_API_SECRET`| **Mandatory** | Secure Session Generation |
| **Broker** | `ZERODHA_USER_ID` | **Recommended**| For Zero-Touch Autonomous Sync |
| **Intelligence**| `NVIDIA_API_KEY` | **Recommended**| Free Institutional Reasoning (Llama 405B) |
| **Intelligence**| `GROQ_API_KEY` | **Recommended**| High-Speed Llama 3 Reasoning |
| **Intelligence**| `ANTHROPIC_API_KEY`| **Optional** | Advanced Forensic Document Analysis |
| **Intelligence**| `GEMINI_API_KEY` | **Optional** | Large Context Window Processing |
| **Intelligence**| `OPENAI_API_KEY` | **Optional** | Reliable Fallback for Reasoning |

---

## ⚡ Zerodha Tactical Integration

### Phase 1: Portal Deployment
1. **Navigate to the Portal:** Open the [Kite Connect App Dashboard](https://kite.trade/apps).
2. **Authentication:** Log in using your Zerodha credentials.
3. **App Creation:** Click **"Create New App"** (Top Right).
4. **The Client ID:** You will be asked for your **Zerodha Client ID**. 
   - **Where to find it?** Open [Kite Web](https://kite.zerodha.com/), click on your Profile (Bottom Left), and your Client ID (e.g., `AB1234`) will be displayed under your name. It is also in your Welcome Email.
5. **Redirect URL:** Set to `http://127.0.0.1` (Crucial).
6. **Key Extraction:** Once created, click on your app to extract your **API Key** and **API Secret**.

---

### Phase 2: Authentication flows

#### Option A: Zero-Touch Auth (Recommended)
1. **Vault Your Credentials:** Navigate to the **Settings** tab in the Nexus Interface (`http://localhost:5173/settings`).
2. **Inject Strategic Data:** Enter your Zerodha ID, Password, TOTP Secret, API Key, and API Secret.
3. **Ignite Sync:** Click **"Ignite Nexus Sync"**. The Nexus handles the rest autonomously.

#### Option B: Manual Handshake (Fallback)
1. **Login URL:** Open `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`.
2. **Authorize:** Log in and approve.
3. **Extract Token:** Copy the `request_token` from the URL bar of the redirected page.
   - > [!IMPORTANT]
   - > **Don't Worry:** The browser WILL show a "Site can't be reached" error. This is **NORMAL**. Just grab the token from the URL bar at the top and paste it into your logic.

---

## 🧠 AI Reasoning Multi-Mesh

The Nexus v2.5 utilizes a decentralized intelligence strategy. It automatically detects your keys and prioritizes power and cost-efficiency:

1. **NVIDIA NIM (Priority 1):** Uses Llama 3.1 405B for institutional-grade verdicts.
2. **Groq NIM (Priority 2):** Uses Llama 3 70B for ultra-fast strategic scans.
3. **Anthropic/Gemini/OpenAI:** Seamless fallbacks for multi-turn context or forensic depth.

---

## 🛠️ Tactical Installation

### Windows (Native/PowerShell)
1. **Ignite Installer:**
   ```powershell
   .\install.ps1
   ```
2. **Launch Nexus:** Execute `.\finintel.ps1` or `python run.py`.

---
**Status: Sovereign & Invincible.**
*Powered by the Multi-Mesh Kernel.*
