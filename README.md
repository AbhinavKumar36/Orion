# ORION — AI-Powered Cyber Threat Intelligence & Digital Trust Platform

[![BPUT Hackathon](https://img.shields.io/badge/BPUT%20Hackathon-PS09%3A%20CYBERGUARD-cyan)](Problem_Statement_9.pdf)
[![Specification](https://img.shields.io/badge/Specification-Master%20v3.3-blue)](ORION_Master_v3.3.md)
[![Risk Config](https://img.shields.io/badge/Risk%20Config-risk--cfg--1.1-emerald)](risk_config.yaml)
[![Contract](https://img.shields.io/badge/API%20Contract-v1.2-purple)](docs/adr/ADR-001-architecture-and-dependencies.md)
[![Golden Cases](https://img.shields.io/badge/Golden%20Cases-12%2F12%20PASS-brightgreen)](backend/tests/fixtures/golden_cases.json)

> **"From Digital Signals to Actionable Threats."**
> A defense-grade, explainable cyber threat intelligence platform unifying human-targeted threats and technical cyber attacks into a single correlated incident pipeline.

---

## 1. Executive Summary

ORION bridges the gap between scattered digital signals and real-world SOC actionability. Built for **academic, government, and enterprise institutions**, it protects both:
1. **The Human Layer**: Phishing emails, SMS lures, lookalike domains, executive/authority impersonation, and synthetic deepfake media.
2. **The Technology Layer**: Account takeover (ATO), password spraying, API enumeration, suspicious network activity, and bulk data exfiltration.

Every security event flows through a unified, 7-stage deterministic intelligence chain:
```
INPUT ➔ DETECT ➔ CLASSIFY ➔ SCORE ➔ EXPLAIN ➔ ALERT ➔ RESPOND
```

---

## 2. Key Differentiators

* **Pure Deterministic Risk Scoring**: Unlike opaque LLM hallucinations, ORION calculates risk using a transparent mathematical formula combining Noisy-OR evidence fusion ($E$), calibrated detector probability ($P$), missing check penalty ($M$), and context impact multipliers with deterministic policy floors ($F1 \ge 80$).
* **Explainable AI with Leave-One-Out Score Attribution**: Interactive waterfall bars detail exactly how many score points each evidence indicator contributed to the total risk score.
* **Correlated Attack Constellation (Entity Graph)**: Connects disparate events (e.g. Spearphishing $\to$ ATO $\to$ Exfiltration) through shared entities (`user_1042`, IP `198.51.100.23`) into a single multi-stage APT narrative.
* **Forensic Media Truth**: Tier 0 Error Level Analysis (ELA) compression heatmap and metadata provenance, transparently designated as a *heuristic estimate, not proof*.
* **100% Offline & Defense Safe**: No runtime web crawling, no arbitrary code execution, defanged indicators (`hxxps://`, `[.]`), and strictly simulated response playbooks.

---

## 3. Normative Golden Cases (12 / 12 Verified)

ORION's risk engine is verified against 12 normative golden test cases defined in Master Spec v3.3:

| Case | Module | Target Scenario | Score & Severity | Threat Type | Status |
|---|---|---|---|---|---|
| **A1** | Phishing | IP Host + Credential Path + Brand Lookalike | **100 CRITICAL** | `credential_harvesting` | **PASS** |
| **A2** | Phishing | Credential Path + Subdomains + Urgency | **69 HIGH** | `credential_harvesting` | **PASS** |
| **A0** | Phishing | Active Allowlist Match | **1 SAFE** | `phishing_url` | **PASS** |
| **B1** | Authentication | Failed burst + ATO from novel IP/device | **78 HIGH** | `account_takeover` | **PASS** |
| **B2** | Authentication | ATO against Privileged Admin Account | **97 CRITICAL** | `account_takeover` | **PASS** |
| **B3** | Authentication | Rules-only Privileged ATO (Floor F1) | **80 CRITICAL** | `account_takeover` | **PASS** |
| **B4** | Authentication | Low confidence Privileged ATO (Floor wins over clamp) | **80 CRITICAL** | `account_takeover` | **PASS** |
| **B0** | Authentication | Standard baseline login | **3 SAFE** | `anomalous_login` | **PASS** |
| **C1** | Media | ELA inconsistency + Executive Context | **66 HIGH** | `executive_impersonation` | **PASS** |
| **C2** | Media | Inconclusive media degradation ($C < 0.5$) | **20 LOW** *(Inconclusive)* | `synthetic_media` | **PASS** |
| **D1** | System Activity | Outbound volume spike + External Dest | **66 HIGH** | `data_exfiltration` | **PASS** |
| **E1** | Impersonation | Spoofed CEO display name + Urgent Payment | **92 CRITICAL** | `executive_impersonation` | **PASS** |

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Automated One-Click Start (Windows PowerShell)
```powershell
.\scripts\run_demo.ps1
```

### Manual Step-by-Step Start

#### 1. Backend Service
```powershell
# Install dependencies
pip install -r backend/requirements.txt

# Run automated tests
python -m pytest backend/tests/ -v

# Start FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive API Documentation: `http://127.0.0.1:8000/docs`
* Health Endpoint: `http://127.0.0.1:8000/api/health`

#### 2. Frontend SOC Command Center
```powershell
cd frontend
npm install
npm run dev
```
* SOC Dashboard UI: `http://127.0.0.1:5173`

---

## 5. Architectural Decision Records (ADRs)

* [ADR-001: Architecture Baseline and Approved Dependencies](docs/adr/ADR-001-architecture-and-dependencies.md)
* [ADR-002: Pure Deterministic Risk Engine & Policy Override Architecture](docs/adr/ADR-002-deterministic-risk-engine.md)
* [ADR-003: Safety, Privacy, and Offline Execution Boundaries](docs/adr/ADR-003-safety-and-offline-execution.md)

---

## 6. Project Roadmap

Track real-time progress and gate criteria across the 7-day build plan in [docs/PHASE_STATUS.md](docs/PHASE_STATUS.md).
