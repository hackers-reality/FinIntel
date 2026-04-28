# FinIntel Pro — Technical Specification

## 1. System Architecture
FinIntel Pro is built as a high-performance, real-time market intelligence platform. It uses a **Standalone Frontend + FastAPI Backend** architecture to ensure maximum stability and speed.

### Components
- **Frontend:** Single Page Application (SPA) using Tailwind CSS, Lucide icons, and Lightweight Charts (TradingView).
- **Backend:** FastAPI (Python) serving as the orchestration layer for market data, news, and LLM analysis.
- **Data Engine:** 
    - `yfinance` for real-time and historical price data.
    - `duckduckgo-search` for autonomous web crawling (News, Twitter, Reddit).
- **LLM Layer:** Multi-provider integration supporting OpenAI, Anthropic, Groq, and NVIDIA NIM.
- **Persistence:** Local JSON-based storage for settings, favorites, and chat history.

## 2. Data Flow
1. **Request:** User selects an asset or asks a question.
2. **Aggregation:** Backend pulls live price data from NSE/Global markets and crawls news/social media.
3. **Synthesis:** Data is fed into the selected LLM (e.g., GPT-4o-mini) with a specific strategy prompt.
4. **Scoring:** LLM calculates a weighted opportunity score based on sentiment, volatility, and expert consensus.
5. **Visualization:** Frontend renders real-time charts and detailed research panels.

## 3. Weighted Scoring System
The application evaluates every investment opportunity across five key dimensions:
- **Sentiment (25%):** Aggregated mood from Twitter, Reddit, and Financial News.
- **Volatility (20%):** Recent price swings relative to historical averages.
- **Volume Trends (15%):** Accumulation or distribution patterns.
- **Expert Consensus (20%):** Analysis of "Trader Talk" from experts like Buffett, Jhunjhunwala, etc.
- **Fundamentals (20%):** Revenue model and market potential in India.

## 4. API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/market/overview` | GET | Real-time prices for NSE, US Stocks, Forex, Crypto. |
| `/market/research/{ticker}` | GET | Triggers deep LLM research with Reddit/Twitter crawling. |
| `/market/traders/news` | GET | Greps news from famous traders. |
| `/chat` | POST | Market-aware AI Agent with conversation memory. |
| `/auth/verify` | POST | Validates and saves user LLM API keys. |

## 5. Security & Compliance
- **Local Keys:** API keys are stored in a local `.env` file, never sent to our servers.
- **CORS:** Restricted to localhost to prevent cross-site attacks.
- **Validation:** All inputs are sanitized before being passed to LLM prompts.

## 6. Implementation Roadmap
- **Phase 1 (MVP):** Real-time NSE data + OpenAI integration. (COMPLETED)
- **Phase 2 (Pro):** Multi-LLM support + TradingView Charts + Notifications. (COMPLETED)
- **Phase 3 (Enterprise):** Reddit/Twitter crawling + Weighted Scoring + Comparison tools. (IN PROGRESS)
- **Phase 4 (Scale):** Dockerization + Multi-user support + Advanced Heatmaps. (PLANNED)
