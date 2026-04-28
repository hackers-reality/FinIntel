# FinIntel Pro — Indian Market Strategic Advisor 🇮🇳

FinIntel Pro is a high-performance, real-time market intelligence platform designed for Indian stock, forex, and crypto markets. It combines live NSE/BSE data with autonomous web crawling (Twitter, Reddit, News) and LLM-powered sentiment analysis to provide a streamlined strategic dashboard.

## 📌 Features
- **Real-time NSE Data**: Live price tracking for NIFTY 50, SENSEX, and top Indian stocks.
- **AI Sentiment Hub**: Aggregates heatmaps from social media and news signals.
- **Deep Research**: One-click autonomous deep-dive into any ticker using GPT-4o or Llama 3.
- **Trader News**: Real-time portfolio move tracking of legends like Rakesh Jhunjhunwala and Vijay Kedia.
- **Desktop Alerts**: Get notified of significant market surges or drops instantly.

---

## 🚀 Quick Start (One Command)

### 1. Installation
Open PowerShell in the project directory and run:
```powershell
./install.ps1
```
*This installs all Python and Node.js dependencies and sets up the global `finintel` command.*

### 2. Launching the App
**Restart your terminal**, then simply type:
```powershell
finintel
```
The dashboard will automatically open in your default browser.

---

## 🛠️ Configuration
API keys are stored locally for security. Rename `.env.example` to `.env` and add your keys:
- `OPENAI_API_KEY`: For GPT-4o analysis.
- `GROQ_API_KEY`: For ultra-fast Llama-3 results.
- `NVIDIA_NIM_API_KEY`: For high-performance enterprise models.

---

## 📂 Project Structure
- `/backend`: FastAPI server handling data orchestration and LLM logic.
- `/src`: React + Vite frontend with Tailwind CSS.
- `run.py`: Unified launcher script.
- `finintel.db`: Local SQLite database for chat history and research.

## ⚖️ Security
- **No Keys Pushed**: `.env` is ignored by git.
- **Local First**: Your data and keys never leave your machine.

---

## 📜 License
MIT License. Created for professional and educational use.
