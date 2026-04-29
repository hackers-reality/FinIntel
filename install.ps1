$InstallPath = $PSScriptRoot
$RunFile = "$InstallPath\run.py"
$CmdPath = "$InstallPath\finintel.cmd"

Write-Host "--- Starting FinIntel Terminal Dependency Provisioning ---" -ForegroundColor Cyan

# 1. Install Python Dependencies
Write-Host "- Provisioning Intelligence Kernel (Python)..." -ForegroundColor Gray
pip install -r "$InstallPath\backend\requirements.txt"

# 2. Install Node Dependencies
Write-Host "- Provisioning Tactical Interface (Node)..." -ForegroundColor Gray
npm install --legacy-peer-deps

# 3. Create the CMD Wrapper
"@echo off`npython `"$RunFile`" %*" | Out-File -FilePath $CmdPath -Encoding ASCII -Force

# 4. Add to User Path if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallPath*") {
    $NewPath = "$UserPath;$InstallPath"
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    $env:Path = $NewPath
    Write-Host "--- FinIntel added to system PATH. Restart terminal to use 'finintel' command. ---" -ForegroundColor Cyan
}

Write-Host "--- FinIntel Terminal v5.1 Installation Complete. ---" -ForegroundColor Green
Write-Host "--- Type 'finintel' from any directory to ignite. ---" -ForegroundColor White
