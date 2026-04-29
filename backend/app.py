import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from backend.api.auth import router as auth_router
from backend.api.broker import router as broker_router
from backend.api.compliance import router as compliance_router
from backend.api.market import router as market_router
from backend.api.portfolio import router as portfolio_router
from backend.api.research import router as research_router
from backend.api.settings import router as settings_router
from backend.config.settings import get_settings
from backend.database.db import init_db
from backend.middleware.rate_limit import limiter


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finintel.api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    logger.info("FinIntel API started.")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Session-Token"],
    )
    app.include_router(auth_router)
    app.include_router(broker_router)
    app.include_router(market_router)
    app.include_router(portfolio_router)
    app.include_router(research_router)
    app.include_router(settings_router)
    app.include_router(compliance_router)

    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(duration_ms)
        logger.info("%s %s -> %s (%sms) [%s]", request.method, request.url.path, response.status_code, duration_ms, request_id)
        return response

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok", "version": settings.app_version, "environment": settings.environment}

    return app
