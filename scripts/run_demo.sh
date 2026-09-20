#!/usr/bin/env bash
# ORION Demo Startup Script (Bash)
# BPUT Hackathon PS09: CYBERGUARD

set -e

echo -e "\033[0;36m=================================================="
echo -e "   ORION — AI Cyber Threat Intelligence Platform   "
echo -e "   Starting Offline Demo Environment...           "
echo -e "==================================================\033[0m"

export ORION_ENV="development"
export ORION_DB_PATH="backend/data/orion.db"
export ORION_DEMO_RESET_ENABLED="true"

# Verify Risk Configuration
python -c "from backend.app.core.config import risk_config_loader; risk_config_loader.load(); print('Risk configuration validated: risk-cfg-1.1')"

# Verify Golden Cases
echo -e "\033[0;33mVerifying 12 Normative Golden Cases...\033[0m"
python -m pytest backend/tests/test_golden_cases.py -q
echo -e "\033[0;32mGolden cases: 100% PASS\033[0m"

# Trap exit to cleanup background jobs
cleanup() {
    echo "Stopping demo processes..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT

# Start Backend
echo -e "\033[0;36mStarting FastAPI Backend on http://127.0.0.1:8000...\033[0m"
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &

# Start Frontend
echo -e "\033[0;36mStarting React Frontend on http://127.0.0.1:5173...\033[0m"
(cd frontend && npm run dev) &

echo -e "\n\033[0;32mORION Demo Environment is Ready!\033[0m"
echo -e "Access Frontend at: http://127.0.0.1:5173"
echo -e "Access API Docs at: http://127.0.0.1:8000/docs\n"

wait
