# FinIntel Pro Installer
Write-Host "Installing FinIntel Pro Dependencies..." -ForegroundColor Cyan

# 1. Install Python deps
Write-Host "Setting up Python backend..." -ForegroundColor Yellow
pip install fastapi uvicorn yfinance duckduckgo-search python-dotenv openai anthropic requests plyer cryptography apscheduler

# 2. Install Node deps
Write-Host "Setting up React frontend..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Cleaning up old node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
npm install
npm install lucide-react@latest

# 3. Add to User PATH for global access
$CurrentDir = Get-Location
Write-Host "Adding $CurrentDir to User PATH..." -ForegroundColor Yellow

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$CurrentDir*") {
    $NewPath = "$UserPath;$CurrentDir"
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    Write-Host "PATH updated successfully." -ForegroundColor Green
} else {
    Write-Host "Directory already in PATH." -ForegroundColor Gray
}

# 4. Create 'finintel.cmd' for global execution
$BatchContent = "@echo off`npython `"$CurrentDir\run.py`" %*"
Set-Content -Path "$CurrentDir\finintel.cmd" -Value $BatchContent

Write-Host "`nInstallation Complete!" -ForegroundColor Green
Write-Host "RESTART your terminal (close and reopen) to use 'finintel' anywhere." -ForegroundColor Cyan
