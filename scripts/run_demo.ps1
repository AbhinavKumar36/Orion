# ORION Demo Startup Script (PowerShell)
# BPUT Hackathon PS09: CYBERGUARD

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   ORION — AI Cyber Threat Intelligence Platform   " -ForegroundColor Cyan
Write-Host "   Starting Offline Demo Environment...           " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Set Environment
$env:ORION_ENV = "development"
$env:ORION_DB_PATH = "backend/data/orion.db"
$env:ORION_DEMO_RESET_ENABLED = "true"

# Verify Risk Configuration
python -c "from backend.app.core.config import risk_config_loader; risk_config_loader.load(); print('Risk configuration validated: risk-cfg-1.1')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to validate risk_config.yaml" -ForegroundColor Red
    exit 1
}

# Run Golden Tests Verification
Write-Host "Verifying 12 Normative Golden Cases..." -ForegroundColor Yellow
python -m pytest backend/tests/test_golden_cases.py -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Golden cases test failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Golden cases: 100% PASS" -ForegroundColor Green

# Start Backend
Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend
Write-Host "Starting React Frontend on http://127.0.0.1:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nORION Demo Environment is Ready!" -ForegroundColor Green
Write-Host "Access Frontend at: http://127.0.0.1:5173" -ForegroundColor White
Write-Host "Access API Docs at: http://127.0.0.1:8000/docs" -ForegroundColor White
