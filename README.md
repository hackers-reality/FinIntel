# 🚀 FinIntel Pro: Sovereign Market Intelligence Engine

**FinIntel Pro** is a production-grade, **Native Windows** self-hosted financial intelligence command center. Designed for experienced traders in the Indian market (NSE/BSE) and global crypto ecosystems, it synthesizes real-time market data, institutional "Big Bull" sentiment, and global world events into actionable, high-conviction research.

> [!IMPORTANT]
> **NATIVE WINDOWS ARCHITECTURE:** This software is optimized for Windows 10/11 environments. Background sentinels and desktop notifications are integrated directly into the Windows Notification Center.

![Sovereign Build 100%](https://img.shields.io/badge/Build-100%25_Compliant-cyan?style=for-the-badge)
![Market-NSE-BSE](https://img.shields.io/badge/Market-India_NSE%2FBSE-emerald?style=for-the-badge)

---

## 📑 Table of Contents (Index)
1.  [Core Product Vision](#-core-product-vision)
2.  [System Architecture](#-system-architecture)
3.  [Key Features & Capabilities](#-key-features--capabilities)
    *   [Autonomous Titan Sentinel](#1-autonomous-titan-sentinel)
    *   [Strategic Research Engine](#2-strategic-research-engine)
    *   [Semantic Kernel Memory](#3-semantic-kernel-memory)
4.  [Directory Structure](#-directory-structure)
5.  [Technical Specification](#-technical-specification)
    *   [Database Schema](#database-schema)
    *   [Security & Encryption](#security--encryption)
6.  [Installation & Setup](#-installation--setup)
7.  [Usage Guide](#-usage-guide)
8.  [Data Sources & Rationale](#-data-sources--rationale)
9.  [Regulatory & Disclaimer](#-regulatory--disclaimer)

---

## 🎯 Core Product Vision
A production-ready application enabling traders to input their own LLM API keys (OpenAI, Anthropic, etc.) and conduct autonomous headless web searches to gather, synthesize, and visualize investment insights. Every analysis returns fresh data in real-time, focusing exclusively on the Indian stock market (NSE/BSE), crypto (INR), and commodities.

---

## 🏗️ System Architecture
The system follows a **Local-First Sovereign Architecture**:
- **The Orchestrator (`run.py`):** Synchronizes the FastAPI backend and Vite frontend.
- **The Kernel (`backend/main.py`):** Handles multi-provider LLM routing, DuckDuckGo search orchestration, and the autonomous background sentinel.
- **The Interface (`src/components/Dashboard.tsx`):** A high-fidelity, glassmorphism dashboard built for real-time visualization and conversational intelligence.

---

## 🛡️ Key Features & Capabilities

### 1. Autonomous "Titan Sentinel" (Global & Domestic)
A background kernel that scans the world 24/7 every 15 minutes. It tracks:
- **Indian Market Titans:** Vijay Kedia, Ashish Kacholia, Mukul Agrawal, and the Rare Enterprises (Jhunjhunwala) legacy.
- **Global Crypto Bulls:** Michael Saylor (MicroStrategy), Cathie Wood (Ark), and Mark Cuban.
- **CEO Intelligence:** Statements and social posts from Elon Musk, Jensen Huang, and Vitalik Buterin for "upcoming launch" detection.
- **Regulatory Shifts:** Live monitoring of SEBI circulars and RBI policy changes.
- **Predictive Alerts:** Aims to notify the user of potential announcements (e.g., Elon's May 1st statements) before they hit mainstream headlines.

### 2. Strategic Research Engine
Synthesis across three credibility tiers:
- **Tier 1:** Regulatory (NSE/BSE/SEBI)
- **Tier 2:** Professional (Moneycontrol, Economic Times)
- **Tier 3:** Sentiment (Twitter, Reddit, Blogs)

### 3. Semantic Kernel Memory
Learns user interests and prunes data automatically to maintain a **10MB footprint** while preserving semantic summaries of pruned conversations.

---

## 📂 Directory Structure
```text
finintel-pro/
├── backend/                # FastAPI Sovereign Kernel
│   ├── main.py             # Core logic, Sentinel, and LLM routes
│   └── database.db         # SQLite persistent storage (Local)
├── src/                    # Frontend UI (React + Vite)
│   ├── components/
│   │   └── Dashboard.tsx   # The "Command Center" interface
│   └── main.tsx            # Entry point
├── install.ps1             # Automated Installation Script
├── run.py                  # Service Orchestrator (The "Launch" button)
├── secret.key              # AES-256 Encryption Key (Auto-generated)
├── DATA_SOURCES.md         # Real-time data strategy documentation
└── README.md               # Technical Bible (This file)
```

---

## 📊 Technical Specification

### Database Schema (SQLite)
- `chat_history`: Persistent logs for the Conversational Advisor.
- `semantic_memory`: Distilled user preferences (Interests/Dislikes).
- `research_history`: Archives of all "Mega Strategic Reports."
- `notifications`: Full history of Sentinel alerts and world events.
- `saved_opportunities`: The "Sovereign Vault" for pinned opportunities.
- `price_alerts`: User-defined thresholds for volatility monitoring.

### Security & Encryption
- **Vault:** Uses the `cryptography` Fernet module (AES-256).
- **Isolation:** Your API keys are NEVER sent to our servers; they only communicate directly with the LLM providers (OpenAI/Anthropic) from your local machine.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- One LLM API Key (OpenAI, Anthropic, or Groq)

### 2. Automated Install
1. **Open a Terminal** (PowerShell or Command Prompt).
2. **CD into the Root Directory:** You MUST be in the `finintel-pro` root folder for the installation only.
   ```bash
   cd E:\finintel-pro
   ```
3. **Execute the Installer** (Administrator Mode recommended for PATH setup):
   ```powershell
   .\install.ps1
   ```

### 3. Global Command (Run from Anywhere)
Once the installation is complete, the `finintel` command is added to your System PATH. You can now launch the engine from **any directory or any terminal** just by typing:
```bash
finintel
```

---

## 📑 Usage Guide
1. **Initialize:** Input your API key in the **Settings** tab.
2. **Scan:** Add assets to your **Favorites** for active monitoring.
3. **Research:** Click any ticker to run a "Mega Strategic Analysis."
4. **Vault:** Use the "Save to Vault" button to preserve high-conviction picks.
5. **Sentinel:** Check the **Alerts** tab for autonomous world events detected by the AI.

---

## ⚖️ Regulatory & Disclaimer
**FinIntel Pro** is explicitly a **research and insight tool**. It does not provide SEBI-registered investment advice. All trades are at the user's own risk. The system positions all AI recommendations as research-only hypotheses.

---
**Build 1.0.0 | Final Sovereign Deployment**
