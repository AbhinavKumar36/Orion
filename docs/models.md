# Models and Algorithms

ORION relies on a hybrid architecture of deterministic rule-based evidence extraction (Tier 0) augmented by machine learning classifiers.

## Phishing Module (Module A)
- **Algorithm:** Calibrated Logistic Regression on extracted URL features, augmented with TF-IDF for message text.
- **Data:** Trained on a source-split corpus (e.g., PhishTank + Tranco).
- **Calibration:** Platt scaling is used because the risk engine treats the output as a strict probability (`P`).

## Authentication Module (Module C)
- **Algorithm:** Isolation Forest for anomaly detection on sliding windows.
- **Features:** Login frequency, IP novelty, location distance (impossible travel).
- **Fallback:** Defaults to a pure deterministic rules engine if the model is absent.

## Media Module (Module B2)
- **Algorithm:** Tier 0 heuristic checks (File signatures, metadata anomalies). Error Level Analysis (ELA) is utilized to generate a heatmap representing potential manipulation.
- **Constraints:** No pretrained deep learning models are used out-of-the-box due to strict runtime and offline requirements (governed by ADR).
