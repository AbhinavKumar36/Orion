# ADR-002: Pure Deterministic Risk Engine & Policy Override Architecture

## Status
Accepted

## Context
Many hackathon projects rely on arbitrary LLM prompts or heuristic guesses for risk scores (e.g. "Risk: 85%"), making their scoring opaque, non-deterministic, and ungrounded under technical scrutiny. PS09 specifically requires:
- Clear threat classification
- Risk/severity score (Safe → Low → Medium → High → Critical)
- Transparent explanation of major factors behind the score

## Decision
1. The risk engine is a **pure deterministic function**:
   - Zero database, clock, network, filesystem, or random calls inside the function.
   - All inputs (weights, detector probability $P$, missing check ratio $M$, impact multiplier, policy floors/caps) are passed explicitly.
2. Mathematical Formula:
   - Evidence Strength: $E = 1 - \prod_{i} (1 - w_i)$ (Noisy-OR over `supports_threat` evidence).
   - Confidence: $C = \text{clamp}(1 - D - 0.5 \times M, 0.2, 1.0)$, where $D = |P - E|$ (dual) or $0.15$ (rules-only).
   - Fusion: $F = 0.5 \times E + 0.5 \times C$.
   - Raw Score: $\text{Raw} = 100 \times P \times F \times \text{Impact}$.
3. **Floor Wins Rule (Bug fix B4)**:
   - If any policy floor fires (e.g. F1 privileged account + failed burst + success), the floor strictly overrides the inconclusive clamp. The assessment becomes `threat` and score $\ge \text{floor}$.
4. **Attribution / Explainability**:
   - Leave-one-out score contribution: $\text{contribution}_i = \text{Raw}(\text{all}) - \text{Raw}(\text{all} \setminus \{i\})$.

## Consequences
- 100% reproducible audit trail for every incident.
- Auditable mathematical attribution for XAI.
- Verifiable against all 12 normative golden cases.
