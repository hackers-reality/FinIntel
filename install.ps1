$InstallPath = $PSScriptRoot
$RunFile = "$InstallPath\run.py"
$CmdPath = "$InstallPath\finintel.cmd"

# 1. Create the CMD Wrapper
"@echo off`npython `"$RunFile`" %*" | Out-File -FilePath $CmdPath -Encoding ASCII -Force

# 2. Add to User Path if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallPath*") {
    $NewPath = "$UserPath;$InstallPath"
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    $env:Path = $NewPath
    Write-Host "--- FinIntel added to system PATH. Restart terminal to use 'finintel' command. ---" -ForegroundColor Cyan
} else {
    Write-Host "--- FinIntel already in system PATH. ---" -ForegroundColor Gray
}

Write-Host "--- FinIntel Terminal v4.0 Installation Complete. ---" -ForegroundColor Green
Write-Host "--- Type 'finintel' from any directory to ignite. ---" -ForegroundColor White
