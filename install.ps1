$InstallPath = $PSScriptRoot
$RunFile = "$InstallPath\run.py"
$CmdPath = "$InstallPath\finintel.cmd"
$EnvExample = "$InstallPath\.env.example"
$EnvFile = "$InstallPath\.env"

Write-Host "--- Starting FinIntel Platform Dependency Provisioning ---" -ForegroundColor Cyan

# 1. Install Python Dependencies
Write-Host "- Provisioning backend dependencies..." -ForegroundColor Gray
python -m pip install -r "$InstallPath\backend\requirements.txt"

# 2. Install Node Dependencies
Write-Host "- Provisioning frontend dependencies..." -ForegroundColor Gray
npm install

# 3. Create .env if missing
if (-not (Test-Path $EnvFile) -and (Test-Path $EnvExample)) {
    Copy-Item -LiteralPath $EnvExample -Destination $EnvFile
    Write-Host "--- Created .env from .env.example. Review secrets before using broker or provider integrations. ---" -ForegroundColor Yellow
}

# 4. Create the CMD Wrapper
"@echo off`npython `"$RunFile`" %*" | Out-File -FilePath $CmdPath -Encoding ASCII -Force

# 5. Add to User Path if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallPath*") {
    $NewPath = "$UserPath;$InstallPath"
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    $env:Path = $NewPath
    Write-Host "--- FinIntel added to system PATH. Restart terminal to use 'finintel' command. ---" -ForegroundColor Cyan
}

Write-Host "--- FinIntel installation complete. ---" -ForegroundColor Green
Write-Host "--- Type 'finintel' from any directory to start the platform. ---" -ForegroundColor White
