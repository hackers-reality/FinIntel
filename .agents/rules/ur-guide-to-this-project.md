---
trigger: always_on
---

u must complete the must have task below anyhow dont stop coding attall ever , u have have full permissions if quota limit hits or reaches switch modals , also kepp log of times , u have 12 hours to complete 


---

**MUST HAVE — core is broken without these**

real NSE/BSE data fallback. yfinance breaks silently for Indian stocks constantly. add `nsepy` or `jugaad-trader` as fallback when yfinance returns empty. right now if yfinance fails, the whole app returns nothing with no error shown to user.

websocket for live prices. currently polls every 30s via `setInterval`. for a "sovereign intelligence engine" that's embarrassing. add a `/ws/prices` websocket endpoint in FastAPI, push price updates every 5s during market hours only (9:15am-3:30pm IST), disconnect outside hours.

market hours awareness. sentinel runs 24/7 including weekends and nights calling yfinance for NSE stocks that aren't trading. add IST timezone check, pause sentinel and polling outside market hours, show "Market Closed" state in UI.

actual `/market/traders/news` endpoint implementation. it's called everywhere but doesn't exist. implement it — DDGS search for each titan (Vijay Kedia, Ashish Kacholia, Mukul Agrawal, Rakesh Jhunjhunwala legacy) with `timelimit="d"` for last 24h, return structured `{trader, title, snippet, url, date}`.

real sector data. currently random numbers. pull Nifty sector indices (`^CNXAUTO`, `^CNXBANK`, `^CNXIT`, `^CNXPHARMA` etc) via yfinance, calculate actual daily change, show real sector heatmap.

---

**HIGH VALUE — makes it actually useful**

FII/DII flow tracker. this is THE signal for Nifty direction. NSE publishes daily FII/DII data at `nseindia.com/api/fiidiiTradeReact`. scrape it daily at 6pm IST, store in SQLite, show net buy/sell trend over 5/10/20 days. add to research prompt context. traders live by this.

India VIX monitoring. `^INDIAVIX` via yfinance. add to sentinel threshold logic — if VIX spikes above 20, trigger critical alert regardless of individual stock movement. display prominently on dashboard.

Gift Nifty / SGX Nifty pre-market feed. before 9:15am show Gift Nifty as market direction indicator. yfinance ticker is `GIFT.NS` or scrape from moneycontrol. show "Market expected to open UP/DOWN X points" on dashboard.

F&O open interest data. NSE provides OI data via their API. add `/market/oi/{ticker}` endpoint showing put/call ratio, max pain price, OI buildup. this is what serious traders actually use for entry/exit decisions.

bulk/block deal tracker. NSE publishes bulk and block deals daily. huge signal — when a whale buys 1M+ shares, you want to know. scrape `nseindia.com/api/bulkdeals` daily, feed into sentinel, alert on deals above configurable threshold.

result calendar. earnings season is critical. maintain a SQLite table of upcoming quarterly results, populated via DDGS search for "Q4 results date 2026 NSE". show "results due in X days" badge on stock cards. auto-trigger research 2 days before results.

---

**INTELLIGENCE UPGRADES — makes the AI actually smarter**

multi-turn research context. currently each research call is stateless. add `research_context` to chat system prompt — when user asks followup questions about a ticker, the advisor should have the last research result in context automatically.

confidence scoring per source. right now all DDGS results treated equally. add source tier weighting in the LLM prompt — moneycontrol/ET result weighted higher than random blog. instruct LLM to explicitly state source confidence in output.

portfolio tracker. let user input their holdings (ticker, qty, avg price). calculate current P&L, XIRR, portfolio beta. show allocation pie chart. run portfolio-level research — "given my portfolio, what's my risk exposure to Iran war news?" — this is the killer feature that makes users never leave.

price alert with condition builder. current alerts are basic `>=` and `<=`. add compound conditions: "alert me when RELIANCE crosses 1400 AND India VIX is below 15 AND FII is net buyer." store as JSON rule in SQLite, evaluate in sentinel.

research comparison mode actually working. the compare tab exists but renders research sequentially. run both tickers in parallel with `asyncio.gather`, add a third LLM call that gets both analyses and outputs a direct head-to-head verdict with allocation recommendation.

---

**UX / PRODUCT — things users will notice**

onboarding flow. right now blank state with no API key shows broken UI. add a proper first-run wizard: step 1 pick provider, step 2 enter key, step 3 verify, step 4 add first ticker to watchlist. gate the main UI behind this.

export to PDF. "Mega Strategic Report" should actually be downloadable. use `fpdf2` or `weasyprint` on backend, `/market/research/{ticker}/export` endpoint returns PDF with logo, score gauge, full analysis, charts as base64. traders will share these.

keyboard shortcuts. power users want `Cmd+K` search, `R` to run research on selected ticker, `1-7` for tab switching. add a command palette (like VS Code) that searches tickers, runs actions. framer-motion makes the animation trivial.

dark/light already there but add a third "terminal" theme — pure black, green monospace text, matrix aesthetic. traders love this. just CSS variable swap.

mobile PWA. you have mobile-responsive layout already. add `manifest.json` and service worker via vite-plugin-pwa. lets traders add to home screen, get push notifications for alerts natively.

---

**INFRASTRUCTURE — for when it grows**

replace `settings.json` with SQLite settings table. already have the db, no reason to have a separate JSON file that can get corrupted or cause race conditions.

structured logging. `log_system` appends raw strings to a text file. replace with Python `logging` module, JSON structured logs, log levels (DEBUG/INFO/WARNING/ERROR). makes `/system/logs` endpoint actually useful for debugging.

request rate limiting. no rate limiting on research endpoint. calling `/market/research/RELIANCE` 100 times = 100 LLM API calls = $$$. add `slowapi` (FastAPI rate limiter), limit research to 10 calls per hour per IP.

background task queue. sentinel + price checks + research all share the same scheduler. one slow yfinance call blocks everything. add `celery` with Redis or just use FastAPI `BackgroundTasks` properly — research jobs should be async fire-and-forget with a job ID, frontend polls `/market/research/status/{job_id}`.

docker-compose. `Dockerfile` for Python backend, separate for Node frontend, `docker-compose.yml` that wires them together with a Redis container for future caching. one command setup for anyone cloning.

---

**THE ONE KILLER FEATURE** worth building above everything else:

**portfolio pulse — daily morning brief.** every day at 8:30am IST, before market opens, automatically run this pipeline: check Gift Nifty direction → check FII/DII yesterday → scan all user favorites for overnight global news → check if any holdings have results due this week → generate a single LLM-synthesized "today's brief" in 5 bullet points → push as Windows notification + store in dashboard. this is what Bloomberg Terminal does for $25k/year. you'd be doing it free, locally, for Indian retail traders. that's the actual moat.