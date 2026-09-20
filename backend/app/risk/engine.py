"""
Pure deterministic Risk Engine for ORION.
Section 8 of ORION Master Project Documentation v3.3.
Pure function: No database, clock, network, filesystem loading or randomness.
All rules, thresholds, floors, caps, and bands are resolved from validated risk_config.yaml.
"""
from dataclasses import dataclass
from math import prod
from typing import Any, Dict, List, Set, Tuple


@dataclass(frozen=True)
class RiskInputs:
    weights: tuple[float, ...]
    p_model: float | None
    missing_ratio: float
    impact: float
    floor: int | None = None
    cap: int | None = None


def severity(score: int, cfg: Dict[str, Any]) -> str:
    for name, (lo, hi) in cfg["severity_bands"].items():
        if lo <= score <= hi:
            return name
    raise ValueError(f"Score {score} outside defined severity bands")


def _match(cond: Dict[str, Any], fired: Set[str], ctx: Dict[str, Any]) -> bool:
    return (
        all(k in fired for k in cond.get("all_of", []))
        and (not cond.get("any_of") or any(k in fired for k in cond["any_of"]))
        and not any(k in fired for k in cond.get("none_of", []))
        and all(ctx.get(k, False) for k in cond.get("context", []))
    )


def resolve_policy(module: str, fired: Set[str], ctx: Dict[str, Any], cfg: Dict[str, Any]) -> Tuple[Tuple[int | None, str | None], Tuple[int | None, str | None]]:
    floors = [
        (r["floor"], n)
        for n, r in cfg["policy"]["floors"].items()
        if r["module"] in (module, "any") and _match(r, fired, ctx)
    ]
    caps = [
        (r["cap"], n)
        for n, r in cfg["policy"]["caps"].items()
        if r["module"] in (module, "any") and _match(r, fired, ctx)
    ]
    floor_res = max(floors) if floors else (None, None)
    cap_res = min(caps) if caps else (None, None)
    return floor_res, cap_res


def resolve_impact(module: str, fired: Set[str], ctx: Dict[str, Any], cfg: Dict[str, Any]) -> Tuple[str, float]:
    for r in cfg["impact_rules"][module]:
        if _match(r, fired, ctx):
            return r["level"], cfg["impact_multipliers"][r["level"]]
    raise ValueError(f"impact_rules for '{module}' must end with a default rule")


def resolve_threat_type(module: str, fired: Set[str], ctx: Dict[str, Any], cfg: Dict[str, Any]) -> str:
    rules = cfg.get("classification", {}).get("threat_type_rules", {}).get(module, [])
    for r in rules:
        if _match(r, fired, ctx):
            return r["threat_type"]
    return "unknown"


def compute_risk(x: RiskInputs, cfg: Dict[str, Any]) -> Dict[str, Any]:
    f_cfg, conf = cfg["formula"], cfg["formula"]["confidence"]
    a = cfg["classification"]["assessment"]

    # Noisy-OR evidence strength
    e = 1.0 - prod(1.0 - w for w in x.weights)

    # Probability & Disagreement
    if x.p_model is None:
        p = f_cfg["probability"]["rules_only_multiplier"] * e
        d = conf["disagreement"]["rules_only"]
    else:
        p = x.p_model
        d = abs(x.p_model - e)

    # Confidence calculation
    c = min(conf["max"], max(conf["min"], 1.0 - d - conf["missing_check_penalty"] * x.missing_ratio))

    # Fusion
    f = f_cfg["fusion"]["evidence_weight"] * e + f_cfg["fusion"]["confidence_weight"] * c

    # Raw score calculation
    raw = 100.0 * p * f * x.impact
    score = min(f_cfg["score"]["clamp_max"], max(f_cfg["score"]["clamp_min"], raw))

    # Floor wins over inconclusive clamp (B4)
    inconclusive = False
    inconclusive_overridden = False

    if x.floor is not None:
        if c < a["inconclusive_c_below"]:
            inconclusive_overridden = True
        score = max(score, x.floor)
    else:
        if x.cap is not None:
            score = min(score, x.cap)
        if c < a["inconclusive_c_below"]:
            inconclusive = True
            score = min(max(score, a["inconclusive_min_score"]), a["inconclusive_max_score"])

    # Rounding: half-up
    final = int(score + 0.5)

    # Final Assessment
    if inconclusive:
        assessment = "inconclusive"
    else:
        assessment = "threat" if final >= a["threat_min_score"] else "benign"

    return {
        "p": p,
        "e": e,
        "c": c,
        "f": f,
        "raw": raw,
        "final": final,
        "severity": severity(final, cfg),
        "assessment": assessment,
        "inconclusive": inconclusive,
        "inconclusive_overridden_by_floor": inconclusive_overridden,
    }


def compute_evidence_contributions(
    module: str,
    fired_evidence: List[Tuple[str, float]],  # list of (evidence_type, weight)
    p_model: float | None,
    missing_ratio: float,
    impact: float,
    cfg: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Leave-one-out score attribution.
    For each evidence item: contribution = Raw(all) - Raw(all except item).
    """
    all_weights = tuple(w for _, w in fired_evidence)
    base_res = compute_risk(
        RiskInputs(weights=all_weights, p_model=p_model, missing_ratio=missing_ratio, impact=impact),
        cfg,
    )
    raw_all = base_res["raw"]

    contributions = []
    for i, (ev_type, _) in enumerate(fired_evidence):
        sub_weights = tuple(w for j, (_, w) in enumerate(fired_evidence) if j != i)
        sub_res = compute_risk(
            RiskInputs(weights=sub_weights, p_model=p_model, missing_ratio=missing_ratio, impact=impact),
            cfg,
        )
        diff = max(0.0, raw_all - sub_res["raw"])
        contributions.append({"type": ev_type, "contribution": round(diff, 2)})

    total_diff = sum(c["contribution"] for c in contributions)
    for c in contributions:
        c["contribution_pct"] = round((c["contribution"] / total_diff) * 100.0, 1) if total_diff > 0 else 0.0

    return contributions
