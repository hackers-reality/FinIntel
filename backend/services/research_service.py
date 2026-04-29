import re

import yfinance as yf
from duckduckgo_search import DDGS

from backend.schemas.research import CompanyDueDiligence, DocumentRisk, MarketBehavior, ResearchResult, ResearchSource


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
