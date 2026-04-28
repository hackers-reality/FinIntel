# Sovereign Intelligence Nexus Installer
Write-Host "🛡️ Initiating Nexus Installation..." -ForegroundColor Cyan

# 1. Python Dependencies
Write-Host "📦 Installing Kernel Dependencies..." -ForegroundColor Gray
pip install kiteconnect pytz requests yfinance fastapi uvicorn duckduckgo_search openai cryptography winotify slowapi python-dotenv fpdf

# 2. Node Dependencies
Write-Host "📦 Installing Interface Dependencies..." -ForegroundColor Gray
npm install

# 3. Global Command Registration
Write-Host "📜 Registering 'finintel' Tactical Command..." -ForegroundColor Gray
$command = "python $(Get-Location)\backend\main.py"
Set-Content -Path "finintel.ps1" -Value $command

Write-Host "✅ Nexus Installation Complete. Run '.\finintel.ps1' to ignite." -ForegroundColor Green
