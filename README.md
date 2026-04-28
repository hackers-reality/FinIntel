# FinIntel Pro: Strategic Financial Intelligence

FinIntel Pro is a production-grade, self-hosted financial intelligence platform designed for experienced traders in the Indian market. It synthesizes multi-tier data using state-of-the-art LLMs to provide real-time investment insights.

## 🚀 Core Features

- **Autonomous Research Engine:** Weighted 4-tier data synthesis (Official, Pro News, Social, Blogs).
- **Deep Moat Analysis:** AI-driven competitive advantage scoring and 12-month target pricing.
- **Strategic Peer Comparison:** Side-by-side normalized performance analysis for any two assets.
- **Semantic Memory Advisor:** A conversational assistant that remembers your trading profile and risk appetite.
- **AES-256 Security:** Encryption at rest for all LLM API keys (OpenAI, Anthropic, NVIDIA, Groq).
- **Market Monitoring:** 5-minute background volatility checks with desktop and in-app notifications.
- **Mobile-First Design:** Optimized for Android and Desktop with glassmorphism aesthetics.

## 🛠 Tech Stack

- **Backend:** FastAPI, yfinance, DuckDuckGo Search, APScheduler, Fernet (AES-256).
- **Frontend:** React, Vite, Framer Motion, Recharts, Lucide, Tailwind CSS.
- **Database:** SQLite (Chat history, Research logs, Semantic memory).

## 🔒 Security

All API keys are encrypted using a locally generated `secret.key`. Never share this file or the `.env` file. The application is designed to run in a trusted local environment or a private VPS.

## ⚖️ Compliance

FinIntel Pro includes mandatory SEBI-compliant disclaimers. This is a research tool and does NOT provide registered financial advice. All investment decisions are the sole responsibility of the user.
