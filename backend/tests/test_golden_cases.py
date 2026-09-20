"""
Tests verifying all 12 normative golden cases (Set v2: A0, A1, A2, B0, B1, B2, B3, B4, C1, C2, D1, E1).
Mandated by Section 8.6 of ORION Master Project Documentation v3.3.
"""
import json
from pathlib import Path
import pytest
from backend.app.core.config import get_risk_config
from backend.app.risk.engine import (
    RiskInputs,
    compute_risk,
    resolve_impact,
    resolve_policy,
    resolve_threat_type,
)


@pytest.fixture(scope="module")
def cfg():
    return get_risk_config()


@pytest.fixture(scope="module")
def golden_cases():
    fixture_path = Path(__file__).parent / "fixtures" / "golden_cases.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_golden_cases_count(golden_cases):
    assert len(golden_cases) == 12, f"Expected exactly 12 golden cases, found {len(golden_cases)}"


@pytest.mark.parametrize("case_idx", range(12))
def test_individual_golden_case(case_idx, golden_cases, cfg):
    case = golden_cases[case_idx]
    case_id = case["id"]
    module = case["module"]
    fired = set(case["fired_evidence"])
    ctx = case["context"]

    # Extract weights from configuration
    weights = tuple(cfg["evidence_weights"][module][k] for k in case["fired_evidence"])

    (floor_val, floor_name), (cap_val, cap_name) = resolve_policy(module, fired, ctx, cfg)
    imp_level, imp_mult = resolve_impact(module, fired, ctx, cfg)
    tt = resolve_threat_type(module, fired, ctx, cfg)

    result = compute_risk(
        RiskInputs(
            weights=weights,
            p_model=case["p_model"],
            missing_ratio=case["missing_ratio"],
            impact=imp_mult,
            floor=floor_val,
            cap=cap_val,
        ),
        cfg,
    )

    # 1. Raw score matches within ±0.2
    assert abs(result["raw"] - case["expected_raw"]) < 0.2, (
        f"Case {case_id} raw mismatch: got {result['raw']:.2f}, expected {case['expected_raw']}"
    )

    # 2. Final score matches exactly
    assert result["final"] == case["expected_final"], (
        f"Case {case_id} final score mismatch: got {result['final']}, expected {case['expected_final']}"
    )

    # 3. Severity matches exactly
    assert result["severity"] == case["expected_severity"], (
        f"Case {case_id} severity mismatch: got {result['severity']}, expected {case['expected_severity']}"
    )

    # 4. Assessment matches exactly
    assert result["assessment"] == case["expected_assessment"], (
        f"Case {case_id} assessment mismatch: got {result['assessment']}, expected {case['expected_assessment']}"
    )

    # 5. Threat type matches exactly
    assert tt == case["expected_threat_type"], (
        f"Case {case_id} threat_type mismatch: got {tt}, expected {case['expected_threat_type']}"
    )
