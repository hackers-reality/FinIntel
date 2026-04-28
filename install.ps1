# FinIntel Pro Installer
Write-Host "Installing FinIntel Pro Dependencies..." -ForegroundColor Cyan

# 1. Install Python deps
Write-Host "Setting up Python backend..." -ForegroundColor Yellow
pip install fastapi uvicorn yfinance duckduckgo-search python-dotenv openai anthropic requests plyer

# 2. Install Node deps
Write-Host "Setting up React frontend..." -ForegroundColor Yellow
npm install

# 3. Create 'finintel' command alias
$ScriptPath = Join-Path (Get-Location) "run.py"
$Command = "function finintel { python `"$ScriptPath`" }"

# Add to PowerShell Profile
if (!(Test-Path $PROFILE)) { New-Item -Type File -Path $PROFILE -Force }
$ProfileContent = "`n" + $Command
Add-Content -Path $PROFILE -Value $ProfileContent

Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "RESTART your terminal and type: " -NoNewline
Write-Host "finintel" -ForegroundColor Cyan
