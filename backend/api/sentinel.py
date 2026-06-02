from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/sentinel", tags=["sentinel"])


def _get_sentinel(request: Request):
    sentinel = getattr(request.app.state, "sentinel", None)
    return sentinel


@router.get("/status")
def get_status(request: Request) -> dict:
    s = _get_sentinel(request)
    if s is None:
        return {"running": False, "error": "Sentinel not initialized"}
    return s.get_status()


@router.post("/scan")
async def trigger_scan(request: Request) -> list[dict]:
    s = _get_sentinel(request)
    if s is None:
        return []
    return await s.run_scan()


@router.get("/findings")
def get_findings(request: Request) -> list[dict]:
    s = _get_sentinel(request)
    if s is None:
        return []
    return s.findings[-20:]


@router.post("/start")
async def start_sentinel(request: Request) -> dict:
    s = _get_sentinel(request)
    if s is None:
        return {"error": "Sentinel not initialized"}
    await s.start()
    return {"status": "started"}


@router.post("/stop")
async def stop_sentinel(request: Request) -> dict:
    s = _get_sentinel(request)
    if s is None:
        return {"error": "Sentinel not initialized"}
    await s.stop()
    return {"status": "stopped"}
