"""AI Research service with real LLM integration."""
import json
import logging
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database.db import ChatHistory, ResearchHistory
from backend.security.crypto import decrypt

logger = logging.getLogger("finintel.research")

SYSTEM_PROMPT = (
    "You are FinIntel, a sovereign financial intelligence assistant. "
    "You have expertise in Indian markets (NSE/BSE), global equities, and investment analysis. "
    "Be concise, data-driven, and cite reasoning."
)

_DEFAULT_MODELS = {
    "nvidia_nim": "meta/llama-3.1-70b-instruct",
    "openai": "gpt-4o",
    "anthropic": "claude-sonnet-4-20250514",
    "groq": "llama-3.3-70b-versatile",
}


def _get_active_provider(db: Session) -> dict[str, str | None]:
    """Get the first configured provider with a decrypted key from provider_settings."""
    row = db.execute(
        text(
            "SELECT provider, encrypted_key, base_url, model "
            "FROM provider_settings WHERE encrypted_key IS NOT NULL ORDER BY provider ASC LIMIT 1"
        )
    ).first()
    if row is None:
        return {}
    decrypted_key = decrypt(row.encrypted_key)
    return {
        "provider": row.provider,
        "api_key": decrypted_key,
        "base_url": row.base_url,
        "model": row.model or _DEFAULT_MODELS.get(row.provider, "gpt-4o"),
    }


def _get_recent_history(db: Session, session_id: str, limit: int = 10) -> list[dict[str, str]]:
    """Retrieve recent chat history for context."""
    results = (
        db.query(ChatHistory)
        .filter(ChatHistory.session_id == session_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    messages = []
    for row in reversed(results):
        messages.append({"role": row.role, "content": row.content})
    return messages


def _save_chat(db: Session, session_id: str, role: str, content: str, provider: str) -> None:
    """Save a chat message to the chat_history table."""
    entry = ChatHistory(session_id=session_id, role=role, content=content, provider=provider)
    db.add(entry)


async def ask_llm(question: str, session_id: str, db: Session) -> str:
    """Send a question to the configured LLM and return the response.

    1. Reads the active provider + decrypted key from the provider_settings table.
    2. Builds message list from the last 10 chat_history entries for context.
    3. Calls the real LLM API (NVIDIA NIM, OpenAI, Anthropic, or Groq).
    4. Saves both the user message and assistant response to chat_history.
    5. Returns the response string.
    """
    provider_info = _get_active_provider(db)
    if not provider_info:
        return "No LLM provider configured. Please add an API key in Settings."

    provider = provider_info["provider"]
    api_key = provider_info["api_key"]
    base_url = provider_info["base_url"]
    model = provider_info["model"]

    messages = _get_recent_history(db, session_id)
    messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    messages.append({"role": "user", "content": question})

    try:
        if provider == "anthropic":
            response_text = await _call_anthropic(api_key, model, messages)
        else:
            response_text = await _call_openai_compatible(api_key, base_url, model, messages)
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        return f"LLM request failed: {exc}"

    _save_chat(db, session_id, "user", question, provider)
    _save_chat(db, session_id, "assistant", response_text, provider)

    return response_text


async def _call_openai_compatible(api_key: str, base_url: str | None, model: str, messages: list[dict]) -> str:
    """Call an OpenAI-compatible API (NVIDIA NIM, OpenAI, Groq)."""
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    response = await client.chat.completions.create(model=model, messages=messages, max_tokens=4096)
    return response.choices[0].message.content or "No response."


async def _call_anthropic(api_key: str, model: str, messages: list[dict]) -> str:
    """Call the Anthropic API."""
    import anthropic

    system_msg = ""
    chat_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_msg = msg["content"]
        else:
            chat_messages.append({"role": msg["role"], "content": msg["content"]})

    client = anthropic.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        system=system_msg,
        messages=chat_messages,
    )
    return response.content[0].text if response.content else "No response."


async def call_active_llm(system: str, user: str, db: Session) -> str:
    provider_info = _get_active_provider(db)
    if not provider_info:
        return "No LLM provider configured. Please add an API key in Settings."

    provider = provider_info["provider"]
    api_key = provider_info["api_key"]
    base_url = provider_info["base_url"]
    model = provider_info["model"]

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user}
    ]

    try:
        if provider == "anthropic":
            return await _call_anthropic(api_key, model, messages)
        else:
            return await _call_openai_compatible(api_key, base_url, model, messages)
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        return f"LLM request failed: {exc}"


async def generate_mega_report(query: str, ticker: str = None, db: Session = None) -> dict:
    # STEP 1: Gather data
    context_parts = []

    if ticker:
        from backend.services.market_service import get_quote, get_history
        quote = await get_quote(ticker)
        history = await get_history(ticker, period="3mo")
        context_parts.append(f"STOCK DATA for {ticker}:\n{json.dumps(quote, indent=2)}")
        context_parts.append(f"3-MONTH PRICE HISTORY (last 10 points):\n{json.dumps(history[-10:], indent=2)}")

    # STEP 2: Fetch news (10 articles)
    from ddgs import DDGS
    search_query = f"{ticker} {query}" if ticker else query
    try:
        with DDGS() as ddgs:
            try:
                results = list(ddgs.news(search_query + " investment analysis", max_results=10, timelimit='w'))
                news_list = []
                for n in results:
                    title = n.get('title') or ''
                    source = n.get('source') or 'News'
                    body = n.get('body') or ''
                    news_list.append(f"- {title} ({source}): {body[:150]}")
            except Exception as e:
                logger.warning("DDGS news query failed, falling back to text query: %s", e)
                results = list(ddgs.text(search_query + " investment analysis", max_results=10))
                news_list = []
                for n in results:
                    title = n.get('title') or ''
                    source = 'Web Search'
                    body = n.get('body') or ''
                    news_list.append(f"- {title} ({source}): {body[:150]}")
            
            context_parts.append("RECENT NEWS:\n" + "\n".join(news_list))
    except Exception as e:
        logger.error("DDGS query completely failed: %s", e)
        context_parts.append("RECENT NEWS:\nNo recent news found due to search failure.")

    # STEP 3: Build LLM prompt
    system = """You are a senior equity research analyst. Generate a comprehensive investment research report.
Structure your report with these exact sections:
## Executive Summary
## Company Overview & Moat
## Financial Health
## Recent Catalysts & News
## Risk Factors
## Titan/Institutional Sentiment
## Technical Picture
## Price Target & Investment Thesis
## Conclusion

Be specific, data-driven, and include numbers where available."""

    user_msg = f"Research query: {query}\n\nContext:\n" + "\n---\n".join(context_parts) + "\n\nGenerate full report."

    # STEP 4: Call LLM (reuse ask_llm logic)
    report_content = await call_active_llm(system=system, user=user_msg, db=db)

    # STEP 5: Save to file
    import os
    from datetime import datetime
    os.makedirs("reports", exist_ok=True)
    
    # Sanitize ticker/query for filename
    safe_ticker = "".join([c for c in (ticker or "report") if c.isalnum() or c in ("-", "_")])
    filename = f"reports/{safe_ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# FinIntel Report: {query}\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
        f.write(report_content)

    # Save PDF
    pdf_filename = filename.replace(".md", ".pdf")
    try:
        from backend.services.pdf_service import generate_report_pdf
        generate_report_pdf(pdf_filename, query, ticker, report_content, history if ticker else None)
    except Exception as e:
        logger.error("Failed to generate PDF: %s", e)

    # STEP 6: Save to DB
    provider_info = _get_active_provider(db)
    provider_name = provider_info.get("provider", "unknown")
    entry = ResearchHistory(query=query, ticker=ticker, report=report_content, provider=provider_name)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"id": entry.id, "content": report_content, "saved_path": filename, "pdf_path": pdf_filename}


class ResearchEngine:
    """Research engine that provides AI-powered insights via real LLM calls."""

    async def ask_question(self, question: str, session_id: str, db: Session) -> str:
        """Answer a question using a real LLM, with chat history persistence."""
        return await ask_llm(question, session_id, db)

    async def analyze_ticker(self, ticker: str, db: Session) -> dict[str, Any]:
        """Deep research analysis for a ticker."""
        prompt = (
            f"Provide a detailed investment analysis for {ticker}. "
            "Include verdict (Buy/Hold/Sell), summary, confidence level, and key factors."
        )
        try:
            analysis = await ask_llm(prompt, f"research_{ticker}", db)
            return {
                "verdict": "Hold",
                "summary": analysis,
                "confidence": 0.75,
                "factors": ["Analysis generated by LLM"],
            }
        except Exception as exc:
            logger.error("Ticker analysis failed: %s", exc)
            return {
                "verdict": "Hold",
                "summary": f"Analysis failed: {exc}",
                "confidence": 0.5,
                "factors": ["Error during analysis"],
            }

    async def generate_mega_report(self, query: str, ticker: str = None, db: Session = None) -> dict:
        """Generate a comprehensive investment research report."""
        return await generate_mega_report(query, ticker, db)


research_engine = ResearchEngine()


import re
import yfinance as yf
from duckduckgo_search import DDGS
from backend.schemas.research import (
    CompanyDueDiligence,
    DocumentRisk,
    MarketBehavior,
    PortfolioResearchContext,
    ResearchResult,
    ResearchSource,
)
from backend.services.broker_service import get_broker_account_summary
from backend.services.portfolio_service import get_portfolio_summary

RISK_PATTERNS = [
    (r"\bpenalt(?:y|ies)\b", "Potential penalty or enforcement language detected."),
    (r"\bterminate|termination\b", "Termination clause detected."),
    (r"\bindemnif(?:y|ication)\b", "Indemnity obligation detected."),
    (r"\bliability\b", "Liability allocation language detected."),
    (r"\barbitration\b", "Mandatory arbitration or dispute-resolution language detected."),
    (r"\bnon-compete|exclusiv(?:e|ity)\b", "Restrictive commercial clause detected."),
]

def _get_history(ticker: str):
    normalized = ticker.strip().upper()
    instrument = normalized if normalized.endswith(".NS") else f"{normalized}.NS"
    return normalized, yf.Ticker(instrument).history(period="3mo")

def get_research(ticker: str) -> ResearchResult:
    normalized, history = _get_history(ticker)
    if history.empty:
        return ResearchResult(
            ticker=normalized,
            verdict="Hold",
            summary="Insufficient market data is available for automated research output.",
            price_change_pct=0.0,
            volume_signal="Unavailable",
        )

    latest_close = float(history["Close"].iloc[-1])
    oldest_close = float(history["Close"].iloc[0])
    latest_volume = float(history["Volume"].iloc[-1])
    average_volume = float(history["Volume"].tail(20).mean()) if len(history) >= 20 else latest_volume
    price_change_pct = round(((latest_close - oldest_close) / oldest_close) * 100, 2) if oldest_close else 0.0

    verdict = "Buy" if price_change_pct > 8 else "Hold" if price_change_pct > -5 else "Reduce"
    volume_signal = "Above Average" if latest_volume > average_volume else "Normal"
    summary = (
        f"{normalized} is {verdict.lower()}-rated based on trailing price momentum of {price_change_pct:.2f}% "
        f"and a {volume_signal.lower()} trading volume signal."
    )

    return ResearchResult(
        ticker=normalized,
        verdict=verdict,
        summary=summary,
        price_change_pct=price_change_pct,
        volume_signal=volume_signal,
    )

def get_market_behavior(ticker: str) -> MarketBehavior:
    normalized, history = _get_history(ticker)
    if history.empty:
        return MarketBehavior(ticker=normalized, status="Data Unavailable", signal="No recent market history found.")

    latest_close = float(history["Close"].iloc[-1])
    moving_average = float(history["Close"].tail(20).mean()) if len(history) >= 20 else latest_close
    status = "Accumulation" if latest_close >= moving_average else "Distribution"
    signal = "Price is trading above the 20-session average." if status == "Accumulation" else "Price is trading below the 20-session average."
    return MarketBehavior(ticker=normalized, status=status, signal=signal)

def analyze_document(text: str) -> DocumentRisk:
    matches: list[str] = []
    for pattern, message in RISK_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            matches.append(message)
    if not matches:
        matches.append("No predefined high-risk clause keywords were detected. Manual legal review is still recommended.")
    return DocumentRisk(risk_clauses=matches)

def _search_sources(query: str, source_type: str, max_results: int = 3) -> list[ResearchSource]:
    try:
        results = DDGS().text(query, max_results=max_results)
    except Exception:
        return []

    sources: list[ResearchSource] = []
    for item in results:
        title = str(item.get("title") or "").strip()
        url = str(item.get("href") or "").strip()
        snippet = str(item.get("body") or "").strip()
        if not title or not url:
            continue
        sources.append(ResearchSource(title=title, url=url, snippet=snippet, source_type=source_type))
    return sources

def _extract_signals(sources: list[ResearchSource], pattern: str, default_message: str) -> list[str]:
    matches: list[str] = []
    for source in sources:
        haystack = f"{source.title} {source.snippet}"
        if re.search(pattern, haystack, flags=re.IGNORECASE):
            matches.append(source.title)
    return matches or [default_message]

def get_company_due_diligence(ticker: str) -> CompanyDueDiligence:
    normalized = ticker.strip().upper()
    legal_sources = _search_sources(f"{normalized} India legal issue court SEBI order lawsuit", "legal")
    news_sources = _search_sources(f"{normalized} India company latest news results management", "news")
    blog_sources = _search_sources(f"{normalized} India stock blog analysis long term view", "blog")
    social_sources = _search_sources(f"{normalized} site:x.com OR site:twitter.com India investing", "social")

    combined_sources = legal_sources + news_sources + blog_sources + social_sources
    legal_risks = _extract_signals(
        legal_sources,
        r"\b(sebi|court|lawsuit|legal|penalty|fraud|investigation|tribunal|appeal)\b",
        "No obvious legal or regulatory headlines were detected in the fetched search results.",
    )
    news_signals = _extract_signals(
        news_sources,
        r"\b(results|guidance|earnings|margin|debt|order|expansion|downgrade|upgrade)\b",
        "No material operating headlines were detected in the fetched search results.",
    )
    blog_signals = _extract_signals(
        blog_sources + social_sources,
        r"\b(valuation|growth|risk|bear|bull|allocation|thesis)\b",
        "No clear public-investor commentary signals were detected in the fetched search results.",
    )

    caution_level = "elevated" if legal_risks and "No obvious legal" not in legal_risks[0] else "standard"
    summary = (
        f"{normalized} due diligence combines market momentum with recent legal, news, and public-commentary checks. "
        "Use this output as research support, not as a trade instruction."
    )

    return CompanyDueDiligence(
        ticker=normalized,
        summary=summary,
        caution_level=caution_level,
        legal_risks=legal_risks,
        news_signals=news_signals,
        blog_signals=blog_signals,
        sources=combined_sources,
    )

def get_portfolio_research_context(ticker: str) -> PortfolioResearchContext:
    normalized = ticker.strip().upper()
    local_portfolio = get_portfolio_summary()
    broker_account = get_broker_account_summary()

    local_holding = next((holding for holding in local_portfolio.holdings if holding.symbol.upper() == normalized), None)
    broker_holding = next((holding for holding in broker_account.holdings if holding.symbol.upper() == normalized), None)

    local_quantity = float(local_holding.qty if local_holding else 0.0)
    broker_quantity = float(broker_holding.quantity if broker_holding else 0.0)
    current_exposure_value = float((local_holding.curr_price * local_holding.qty) if local_holding else 0.0)
    if broker_holding:
        current_exposure_value += broker_holding.last_price * broker_holding.quantity

    available_cash = float(broker_account.available_cash if broker_account.status == "connected" else 0.0)
    has_existing_exposure = (local_quantity + broker_quantity) > 0

    diversification_note = (
        "This ticker is already present in the tracked portfolio context. Review concentration and overlap before increasing exposure."
        if has_existing_exposure
        else "No tracked exposure was found for this ticker in the current local or broker-linked portfolio context."
    )

    if available_cash > 0 and not has_existing_exposure:
        deployment_guidance = "Treat this as a watchlist candidate first. If the thesis remains strong after review, consider phased capital deployment rather than a single-entry decision."
    elif has_existing_exposure:
        deployment_guidance = "Focus on whether the current position still fits portfolio risk limits, diversification goals, and conviction quality instead of treating the output as a fresh-entry signal."
    else:
        deployment_guidance = "Use the research output to compare this company against alternatives before deciding whether it deserves capital allocation at all."

    caution_notes = [
        "This context is informational and should not be used as an automatic trade decision.",
        "Broker-linked values, when enabled, are read-only and intended to improve portfolio awareness.",
    ]
    if current_exposure_value > 0:
        caution_notes.append("Existing exposure is present, so concentration and downside correlation matter more than raw upside alone.")
    if available_cash <= 0:
        caution_notes.append("No broker cash context is currently available, so sizing guidance is incomplete.")

    return PortfolioResearchContext(
        ticker=normalized,
        local_holding_quantity=round(local_quantity, 2),
        broker_holding_quantity=round(broker_quantity, 2),
        available_cash=round(available_cash, 2),
        current_exposure_value=round(current_exposure_value, 2),
        diversification_note=diversification_note,
        deployment_guidance=deployment_guidance,
        caution_notes=caution_notes,
    )
