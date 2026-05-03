FROM python:3.11-slim AS builder

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim AS runner

WORKDIR /app

COPY --from=builder /install /usr/local

RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --no-create-home appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appgroup /app

COPY backend ./backend

RUN python -c "from backend.database.db import init_db; init_db()"

USER appuser

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8008/ready')"

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8008", "--workers", "2", "--log-level", "info"]
