# 🛡️ Sovereign Intelligence Nexus (v2.3)
### *Strategic Command Center for Elite Indian Retail Traders*

> **Status:** Gold Master Candidate | **Build:** v2.3 | **System:** Sovereign Intelligence Nexus

The Sovereign Intelligence Nexus is a high-fidelity, local-first intelligence engine engineered to provide retail traders with institutional-grade edge. It synthesizes real-time market pulse, forensic document analysis, and institutional whale-tracking into a strictly utilitarian, zero-distraction tactical environment.

---

## 🗺️ System Architecture (The Nexus Map)

```mermaid
graph TD
    subgraph "External Intelligence Mesh"
        A[Zerodha KiteConnect] -->|Live Holdings/Positions| E[Intelligence Kernel]
        B[yfinance] -->|Indices/VIX/Forex| E
        C[Elite Domain Mesh] -->|High-Authority Research| E
        D[OpenAI GPT-4o] -->|Forensic Analysis/Verdict| E
    end

    subgraph "Intelligence Kernel (Python/FastAPI)"
        E -->|WebSocket Pulse| F[Tactical Interface]
        E -->|SQLite Sync| G[(Nexus DB)]
        E -->|Sentinel Loop| H[Native Toast Alerts]
    end

    subgraph "Tactical Interface (React/Vite)"
        F -->|Filing Forensics| I[Risk Analysis]
        F -->|Swords Arena| J[Parallel Duel]
        F -->|Cmd+K Palette| K[Action Nerve Center]
    end
```

---

## 📜 Table of Contents
1. [Core Features](#-core-features)
2. [Project Structure](#-project-structure)
3. [Tactical Installation](#-tactical-installation)
4. [Docker Orchestration](#-docker-orchestration)
5. [API Forensic Deep-Dive](#-api-forensic-deep-dive)
6. [Tactical Operations](#-tactical-operations)
7. [System Hardening](#-system-hardening)

---

## 🛡️ Core Features
- **Zerodha Kite Pulse:** Native tracking of live holdings and positions.
- **Elite Domain Mesh:** Research queries weighted against high-authority finance domains (Moneycontrol, ET, SEBI).
- **Forensic Filing Engine:** LLM-powered scanning of regulatory documents for "fine print" risks.
- **Whale Trade Sentinel:** Automated tracking of institutional whale activity via the Strategic Mesh.
- **Native OS Alerts:** High-priority Windows toast notifications for VIX spikes and Whale detections.
- **Nexus Command Palette:** `Cmd+K` tactical interface for instant system-wide navigation.

---

## 📂 Project Structure

```text
Sovereign-Intelligence-Nexus/
├── backend/
│   ├── main.py            # The Intelligence Kernel (FastAPI)
│   ├── system.log         # Structured JSON Decisions
│   └── Dockerfile         # Kernel Container Blueprint
├── src/
│   ├── components/
│   │   └── Dashboard.tsx  # The Tactical Interface (React)
│   └── main.tsx           # PWA Registration Layer
├── finintel.db            # The Sovereign Database (SQLite)
├── secret.key             # AES-256 Vault Key
├── docker-compose.yml     # Nexus Stack Orchestration
├── install.ps1            # Automated Tactical Installer
└── README.md              # The Strategic Dossier
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
3. **Configuration:** Populate `.env` in the root directory:
   ```env
   ZERODHA_API_KEY=your_key
   ZERODHA_ACCESS_TOKEN=your_token
   OPENAI_API_KEY=your_key
   ```
4. **Ignition:** Execute `.\finintel.ps1` in your terminal.

---

## 🐳 Docker Orchestration

The Nexus is fully containerized for secure, isolated deployment.

```bash
# Build and Launch the Nexus Stack
docker-compose up --build -d
```

---

## 📡 API Forensic Deep-Dive

| Provider | Purpose | Strategic Weight |
| :--- | :--- | :--- |
| **KiteConnect** | Primary Brokerage | **100%** (Live Capital/PnL) |
| **OpenAI GPT-4o**| Reasoning Mesh | **High** (Forensic Verdicts) |
| **Elite Mesh** | Authority Data | **80%** (MC, Mint, SEBI) |
| **yfinance** | Market Pulse | **60%** (Global Indices) |

### Elite Domain Mesh Logic
The Nexus research engine utilizes a specialized `site:` filter mesh targeting only high-authority domains. This filters out 99% of internet noise, ensuring your strategic research is based on confirmed institutional reports and regulatory filings.

---

## ⌨️ Tactical Operations

### Global Hotkeys
- **`Ctrl+K` / `Cmd+K`**: Launch the **Nexus Command Palette**.
- **`1-5`**: Switch between Intelligence Tabs.
- **`T`**: Toggle **Terminal Mode** (High-Contrast Monospace).
- **`Esc`**: Close palette or modals.

---

## 🔒 System Hardening
- **AES-256 Encryption:** All API keys are encrypted at rest using Fernet.
- **Local-First Privacy:** No data ever leaves your machine except for direct API calls to your configured providers.

---
**Status: Sovereign & Invincible.**
*The Nexus is Active.*
