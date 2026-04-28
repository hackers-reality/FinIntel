# Deployment Guide: FinIntel Pro

Follow these steps to deploy and run FinIntel Pro in your environment.

## 1. Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **LLM API Keys:** At least one from OpenAI, Anthropic, NVIDIA, or Groq.

## 2. Local Setup

1.  **Backend Dependencies:**
    ```bash
    pip install fastapi uvicorn yfinance duckduckgo-search python-dotenv openai anthropic cryptography apscheduler plyer
    ```
2.  **Frontend Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment:**
    The system will automatically create `.env`, `secret.key`, and `finintel.db` upon the first boot.

## 3. Running the Application

Use the provided `finintel` command or manual start:

**Terminal 1 (Backend):**
```bash
python backend/main.py
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 4. Configuration

1.  Navigate to the **Settings** tab.
2.  Enter your LLM provider and API Key.
3.  Click **Verify & Save**. The key will be encrypted via AES-256 and stored in your local `.env`.

## 5. Security Best Practices

- **VPS Deployment:** If deploying to a VPS, use an Nginx reverse proxy with SSL (Certbot) to secure the traffic.
- **Firewall:** Only expose port `5173` (Frontend) and `8008` (API) if necessary.
- **Database Backups:** Regularly backup `finintel.db` and `secret.key`.

## 6. Android/Mobile Access

Ensure your machine is on the same Wi-Fi network. Access the dashboard via `http://<your-local-ip>:5173`. The UI will automatically adjust to the mobile-first bottom navigation.
