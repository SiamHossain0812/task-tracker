# Setup Script for Agenda Tracker
# Usage: ./setup.ps1

Write-Host "--- Setting up Virtual Environment ---" -ForegroundColor Cyan

# 1. Check if venv exists and is valid
$venvPath = "venv"
$pyvenvCfg = Join-Path $venvPath "pyvenv.cfg"

if (Test-Path $venvPath) {
    if (-not (Test-Path $pyvenvCfg)) {
        Write-Host "Broken venv detected (missing pyvenv.cfg). Recreating..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $venvPath
        python -m venv $venvPath
    } else {
        Write-Host "Existing venv found." -ForegroundColor Green
    }
} else {
    Write-Host "Creating new venv..." -ForegroundColor Green
    python -m venv $venvPath
}

# 2. Activate and install requirements
Write-Host "Installing/Updating requirements..." -ForegroundColor Cyan
$pipPath = Join-Path $venvPath "Scripts\pip.exe"

if (Test-Path "requirements.txt") {
    & $pipPath install -r requirements.txt
} else {
    Write-Host "Warning: requirements.txt not found!" -ForegroundColor Red
}

Write-Host "--- Setup Complete! ---" -ForegroundColor Cyan
Write-Host "To activate high-five your environment, run: .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
