import json
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from duckduckgo_search import DDGS

TITANS = {
    "domestic": ["Vijay Kedia", "Ashish Kacholia", "Mukul Agrawal"],
    "global": ["Elon Musk", "Michael Saylor", "Cathie Wood", "Jensen Huang"],
}

SCAN_QUERIES = [
    "{name} stock pick",
    "{name} investment announcement",
    "{name} portfolio 2025",
    "{name} market statement",
]


class TitanSentinel:
    def __init__(self, db_session_factory):
        self.scheduler = AsyncIOScheduler()
        self.db_factory = db_session_factory
        self.last_seen_cache: dict[str, set[str]] = {}
        self.findings: list[dict] = []

    async def start(self) -> None:
        self.scheduler.add_job(self.run_scan, "interval", minutes=15, id="titan_scan")
        self.scheduler.start()
        print("[Sentinel] Started. Scanning every 15 minutes.")

    async def stop(self) -> None:
        self.scheduler.shutdown()

    async def run_scan(self) -> list[dict]:
        findings: list[dict] = []
        for category, titans in TITANS.items():
            for titan in titans:
                new_items = await self._scan_titan(titan)
                if new_items:
                    findings.extend(new_items)
                    await self._notify(titan, new_items[0])
        self.findings = findings[-50:]
        await self._save_findings(findings)
        return findings

    async def _scan_titan(self, name: str) -> list[dict]:
        new_items: list[dict] = []
        seen = self.last_seen_cache.get(name, set())
        try:
            with DDGS() as ddgs:
                for query_template in SCAN_QUERIES[:2]:
                    query = query_template.format(name=name)
                    results = list(ddgs.news(query, max_results=5, timelimit="d"))
                    for r in results:
                        url = r.get("url")
                        if url not in seen:
                            seen.add(url)
                            new_items.append(
                                {
                                    "titan": name,
                                    "title": r.get("title"),
                                    "url": url,
                                    "snippet": (r.get("body") or "")[:200],
                                    "source": r.get("source"),
                                    "found_at": datetime.utcnow().isoformat(),
                                }
                            )
        except Exception as e:
            print(f"[Sentinel] Error scanning {name}: {e}")
        self.last_seen_cache[name] = seen
        return new_items

    async def _notify(self, titan: str, item: dict) -> None:
        try:
            from plyer import notification

            notification.notify(
                title=f"FinIntel: {titan}",
                message=item["title"][:100],
                app_name="FinIntel Pro",
                timeout=8,
            )
        except Exception:
            print(f"[Sentinel] Alert: {titan} \u2014 {item['title']}")

    async def _save_findings(self, findings: list[dict]) -> None:
        if not findings:
            return
        db = self.db_factory()
        try:
            from backend.database.db import ResearchHistory

            for f in findings:
                entry = ResearchHistory(
                    query=f"Titan Sentinel: {f['titan']}",
                    report=json.dumps(f),
                    provider="sentinel",
                )
                db.add(entry)
            db.commit()
        finally:
            db.close()

    def get_status(self) -> dict:
        job = self.scheduler.get_job("titan_scan")
        return {
            "running": self.scheduler.running,
            "next_run": job.next_run_time.isoformat() if job and job.next_run_time else None,
            "findings_count": len(self.findings),
            "titans_tracked": sum(len(v) for v in TITANS.values()),
        }
