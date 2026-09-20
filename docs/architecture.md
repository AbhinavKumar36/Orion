# System Architecture

## Overview
ORION is an AI-Powered Cyber Threat Intelligence & Digital Trust Platform that converts scattered digital security signals into explainable, prioritized, actionable incidents. The architecture is composed of a FastAPI backend, a React frontend, and a deterministic risk engine.

## Flow
1. **Input:** The REST API receives payloads representing various digital signals (e.g., URLs, emails, authentication logs, media assets).
2. **Detect:** The Analysis Orchestrator routes the input to the appropriate module (Phishing, Impersonation, Media, Authentication, System Activity). The detector module extracts evidence and an optional model probability (`P`).
3. **Classify:** A rules engine determines the specific `threat_type`.
4. **Score:** The Risk Engine (a pure deterministic function) calculates the Risk Score based on Evidence (`E`), Probability (`P`), Confidence (`C`), and Impact modifiers derived from `risk_config.yaml`.
5. **Explain:** The Explainability engine generates human-readable templates detailing exactly why a score was assigned.
6. **Alert & Respond:** If the risk is high or inconclusive, alerts are generated and mitigation playbooks are recommended.
7. **Correlate:** Incidents sharing entities (like IP or User) are correlated into attack constellations.

## Persistence
All data is stored in a local SQLite database (`orion.db`) using strict foreign keys and WAL journal mode. The frontend dashboard polls the API to display real-time metrics.
