# ADR-001: Architecture Baseline and Approved Dependencies

## Status
Accepted

## Context
Project ORION is built to address BPUT Hackathon PS09: CYBERGUARD. The system requires an end-to-end multi-source threat detection pipeline covering both the Human Layer (phishing, impersonation, deepfake media) and the Technology Layer (ATO, API abuse, network anomalies, data exfiltration).

With 70+ competing teams, maintaining stability, speed, and clean separation between detection, risk scoring, and presentation is paramount.

## Decision
1. **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2 for data contracts and validation.
2. **Database**: SQLite with `PRAGMA foreign_keys = ON;` and Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) through an explicit repository layer.
3. **Frontend**: React 18+, Vite, TailwindCSS (for responsive SOC dark-mode UI), Recharts (for timeline & metrics), native SVG for the entity attack-constellation graph.
4. **Data Contract**: Canonical Incident Model v1.2 (additive on v1.1).
5. **Approved Dependencies (No extra ADR needed per AGENTS.md)**:
   - Python: `fastapi`, `uvicorn`, `pydantic`, `pytest`, `hypothesis`, `numpy`, `pandas`, `scikit-learn`, `joblib`, `pyyaml`, `pillow`, `python-multipart`, `rapidfuzz`.
   - Frontend: `react`, `vite`, `tailwindcss`, `recharts`, `lucide-react`, `openapi-typescript`.
6. **Restricted Dependencies**: Any audio library, opencv headless, or pretrained deep learning model requires an explicit ADR.

## Consequences
- Guaranteed fast, local, reproducible development.
- Zero network reliance during live judging.
- Type-safe communication between frontend and backend.
