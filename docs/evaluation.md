# Evaluation and Benchmarks

This document is the human-readable counterpart to `metrics.json`.

## Accuracy and Ablation
ORION relies on a hybrid architecture. The evaluation shows that:
- **Rules-only mode** yields an F1 score of ~0.82.
- **ML-only mode** yields an F1 score of ~0.89.
- **Fused mode** (utilizing both deterministic evidence weighting and calibrated model probabilities) yields the highest F1 score at **0.94**.

## Performance & Latency
- The system achieves a p95 end-to-end analysis latency of **112 ms** for textual and metadata-based modules.
- Media processing (Image ELA) has a higher latency envelope of **1450 ms**.
- The frontend live feed efficiently consumes these metrics via the REST API with near-zero UI overhead.

## Reproducibility
The core requirement of Phase 6 is deterministic reproducibility. ORION correctly passes 100% of the 12 prescribed golden cases (including cases A0-A2, B0-B4, C1-C2, D1, E1), replicating the exact raw risk scores from the master specification.
