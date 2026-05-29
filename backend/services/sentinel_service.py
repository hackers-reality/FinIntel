from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ddgs import DDGS
from datetime import datetime, timedelta
import json

TITANS = {
    "domestic": ["Vijay Kedia", "Ashish Kacholia", "Mukul Agrawal"],
    "global": ["Elon Musk", "Michael Saylor", "Cathie Wood", "Jensen Huang"]
}

SCAN_QUERIES = [
    "{name} stock pick",
    "{name} investment announcement",
    "{name} portfolio 2025",
    "{name} market statement"
]

class TitanSentinel:
    def __init__(self, db_session_factory):
        self.scheduler = AsyncIOScheduler()
        self.db_factory = db_session_factory
        self.last_seen_cache = {}  # titan -> set of seen URLs
        self.findings = []  # recent alerts list

    async def start(self):
        if self.scheduler.running:
            print("[Sentinel] Already running.")
            return
        
        # If the scheduler was previously shutdown, it can't be restarted directly.
        # We handle this by creating a new scheduler instance.
        try:
            self.scheduler.start()
        except Exception:
            self.scheduler = AsyncIOScheduler()
            self.scheduler.start()

        # Add the job if it is not already present
        if not self.scheduler.get_job('titan_scan'):
            self.scheduler.add_job(self.run_scan, 'interval', minutes=15, id='titan_scan')
        print("[Sentinel] Started. Scanning every 15 minutes.")

    async def stop(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            print("[Sentinel] Stopped.")
        else:
            print("[Sentinel] Already stopped.")

    async def run_scan(self) -> list[dict]:
        findings = []
        for category, titans in TITANS.items():
            for titan in titans:
                new_items = await self._scan_titan(titan)
                for item in new_items:
                    # Run LLM analysis step to extract sentiment and summary
                    analyzed = await self._analyze_finding_with_ai(titan, item)
                    findings.append(analyzed)
                    await self._notify(titan, analyzed)
        self.findings.extend(findings)
        self.findings = self.findings[-50:]  # keep last 50
        await self._save_findings(findings)
        return findings

    async def _analyze_finding_with_ai(self, titan: str, item: dict) -> dict:
        db = self.db_factory()
        try:
            from backend.services.research_service import call_active_llm
            system_prompt = (
                "You are an AI market intelligence sentinel. Analyze this financial news item "
                "about an announcement or stock pick by a prominent investor. "
                "Determine: 1) Sentiment (BULLISH, BEARISH, or NEUTRAL), "
                "2) A short, punchy 1-sentence impact summary. "
                "Format your response strictly as JSON: {\"sentiment\": \"...\", \"summary\": \"...\"}"
            )
            user_prompt = f"Titan: {titan}\nTitle: {item['title']}\nSnippet: {item['snippet']}"
            response = await call_active_llm(system_prompt, user_prompt, db)
            
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                parsed = json.loads(clean_response.strip())
                item["ai_sentiment"] = parsed.get("sentiment", "NEUTRAL").upper()
                item["ai_summary"] = parsed.get("summary", item["title"])
            except Exception:
                item["ai_sentiment"] = "NEUTRAL"
                item["ai_summary"] = item["title"]
        except Exception as e:
            print(f"[Sentinel] AI Analysis failed: {e}")
            item["ai_sentiment"] = "NEUTRAL"
            item["ai_summary"] = item["title"]
        finally:
            db.close()
        return item

    async def _scan_titan(self, name: str) -> list[dict]:
        new_items = []
        seen = self.last_seen_cache.get(name, set())
        try:
            with DDGS() as ddgs:
                for query_template in SCAN_QUERIES[:2]:
                    query = query_template.format(name=name)
                    results = list(ddgs.news(query, max_results=5, timelimit='d'))
                    for r in results:
                        if r.get('url') not in seen:
                            seen.add(r.get('url'))
                            new_items.append({
                                'titan': name,
                                'title': r.get('title'),
                                'url': r.get('url'),
                                'snippet': r.get('body', '')[:200],
                                'source': r.get('source'),
                                'found_at': datetime.utcnow().isoformat()
                            })
        except Exception as e:
            print(f"[Sentinel] Error scanning {name}: {e}")
        self.last_seen_cache[name] = seen
        return new_items

    async def _notify(self, titan: str, item: dict):
        sentiment = item.get("ai_sentiment", "NEUTRAL")
        summary = item.get("ai_summary", item["title"])
        msg = f"[{sentiment}] {summary}"
        try:
            from plyer import notification
            notification.notify(
                title=f"FinIntel: {titan}",
                message=msg[:100],
                app_name="FinIntel Pro",
                timeout=8
            )
        except Exception:
            print(f"[Sentinel] Alert: {titan} — {msg}")

    async def _save_findings(self, findings: list[dict]):
        if not findings:
            return
        db = self.db_factory()
        try:
            from backend.database.db import ResearchHistory
            for f in findings:
                entry = ResearchHistory(
                    query=f"Titan Sentinel: {f['titan']}",
                    report=json.dumps(f),
                    provider="sentinel"
                )
                db.add(entry)
            db.commit()

            # Also save to SQLite investor_news table for the live UI feed
            from backend.database.db import db_cursor
            with db_cursor() as cursor:
                for f in findings:
                    cursor.execute("SELECT id FROM investor_news WHERE url = ?", (f["url"],))
                    if not cursor.fetchone():
                        sentiment = f.get("ai_sentiment", "NEUTRAL")
                        summary = f.get("ai_summary", f["title"])
                        cursor.execute(
                            "INSERT INTO investor_news (investor_name, title, url, ts) VALUES (?, ?, ?, ?)",
                            (f["titan"], f"[{sentiment}] {summary}", f["url"], f["found_at"])
                        )
        finally:
            db.close()

    def get_status(self) -> dict:
        job = self.scheduler.get_job('titan_scan')
        return {
            "running": self.scheduler.running,
            "next_run": job.next_run_time.isoformat() if job and job.next_run_time else None,
            "findings_count": len(self.findings),
            "titans_tracked": sum(len(v) for v in TITANS.values())
        }

