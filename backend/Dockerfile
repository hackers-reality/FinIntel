# Backend Dockerfile (Nexus Kernel)
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install winotify kiteconnect pytz requests

COPY . .

CMD ["python", "main.py"]
