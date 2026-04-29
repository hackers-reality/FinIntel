# Sovereign Intelligence Nexus Installer (v2.8)
Write-Host "🛡️ Initiating Nexus Global Installation (v2.8)..." -ForegroundColor Cyan

# 1. Python Dependencies
Write-Host "📦 Installing Kernel Dependencies..." -ForegroundColor Gray
pip install kiteconnect pytz requests yfinance fastapi uvicorn duckduckgo_search openai cryptography winotify slowapi python-dotenv fpdf pyotp websockets

# 2. Node Dependencies
Write-Host "📦 Installing Interface Dependencies..." -ForegroundColor Gray
npm install

# 3. Global Command Registration
Write-Host "📜 Registering 'finintel' Global Command..." -ForegroundColor Gray
$nexusPath = Get-Location
$command = "python `"$nexusPath\run.py`""
# Overwrite the legacy hardcoded command with the dynamic dynamic path
Set-Content -Path "finintel.cmd" -Value "@echo off`n$command"

# 4. Inject into User PATH
Write-Host "💉 Injecting Nexus into User PATH..." -ForegroundColor Gray
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$nexusPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$nexusPath", "User")
    Write-Host "✅ Path Injected. Please RESTART your terminal." -ForegroundColor Green
} else {
    Write-Host "ℹ️ Nexus already in Path." -ForegroundColor Yellow
}

Write-Host "✅ Nexus Installation Complete. Type 'finintel' from any directory to ignite." -ForegroundColor Green
