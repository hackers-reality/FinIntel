from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/sentinel", tags=["sentinel"])

@router.get("/status")
def get_status(request: Request) -> dict:
    try:
        sentinel = getattr(request.app.state, "sentinel", None)
        if not sentinel:
            return {"error": "Sentinel service not initialized"}
        return sentinel.get_status()
    except Exception as e:
        return {"error": str(e)}

@router.post("/scan")
async def run_scan(request: Request):
    try:
        sentinel = getattr(request.app.state, "sentinel", None)
        if not sentinel:
            return {"error": "Sentinel service not initialized"}
        return await sentinel.run_scan()
    except Exception as e:
        return {"error": str(e)}

@router.get("/findings")
def get_findings(request: Request):
    try:
        sentinel = getattr(request.app.state, "sentinel", None)
        if not sentinel:
            return {"error": "Sentinel service not initialized"}
        return sentinel.findings[-20:]
    except Exception as e:
        return {"error": str(e)}

@router.post("/stop")
async def stop_sentinel(request: Request):
    try:
        sentinel = getattr(request.app.state, "sentinel", None)
        if not sentinel:
            return {"error": "Sentinel service not initialized"}
        await sentinel.stop()
        return {"status": "stopped"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/start")
async def start_sentinel(request: Request):
    try:
        sentinel = getattr(request.app.state, "sentinel", None)
        if not sentinel:
            return {"error": "Sentinel service not initialized"}
        await sentinel.start()
        return {"status": "started"}
    except Exception as e:
        return {"error": str(e)}
