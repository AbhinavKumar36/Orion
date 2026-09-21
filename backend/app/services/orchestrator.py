import uuid
from typing import Any, Dict, List, Tuple
from datetime import datetime
from backend.app.core.config import get_risk_config
from backend.app.risk.engine import (
    resolve_policy,
    resolve_impact,
    resolve_threat_type,
    compute_evidence_contributions,
)
from backend.app.risk.explanation import generate_explanation
from backend.app.services.response_engine import generate_responses
from backend.app.models.domain import (
    Module, 
    Evidence, 
    Incident, 
    RiskBreakdown, 
    Entity,
    MitreAttack
)

class Orchestrator:
    def __init__(self, config: Dict[str, Any] | None = None):
        self.config = config or get_risk_config()

    def process_analysis(
        self,
        incident_id: str,
        module: str,
        layer: str,
        input_type: str,
        fired_evidence_types: List[str],
        context: Dict[str, Any],
        p_model: float | None = None,
        missing_ratio: float = 0.0,
        entities: List[Entity] | None = None,
        mitre_attack: List[MitreAttack] | None = None,
        authenticity: Dict[str, Any] | None = None,
        model_metadata: Dict[str, Any] | None = None
    ) -> Incident:
        """
        Process a detector analysis by running the risk engine on fired evidence.
        """
        module_enum = Module(module)
        fired_set = set(fired_evidence_types)
        
        # 1. Resolve Policy, Impact, Threat Type
        floor_res, cap_res = resolve_policy(module, fired_set, context, self.config)
        floor = floor_res[0]
        cap = cap_res[0]
        
        impact_level, impact_val = resolve_impact(module, fired_set, context, self.config)
        threat_type = resolve_threat_type(module, fired_set, context, self.config)
        
        # 2. Get weights for fired evidence
        weights_map = self.config["evidence_weights"].get(module, {})
        fired_evidence_weights = []
        for et in fired_evidence_types:
            w = weights_map.get(et)
            if w is not None:
                fired_evidence_weights.append((et, w))
        
        # 3. Compute risk and evidence contributions
        contributions = compute_evidence_contributions(
            module=module,
            fired_evidence=fired_evidence_weights,
            p_model=p_model,
            missing_ratio=missing_ratio,
            impact=impact_val,
            cfg=self.config
        )
        
        # We need to compute the overall risk one more time for the final RiskBreakdown
        # Wait, compute_evidence_contributions doesn't return the full risk output, we should run compute_risk directly?
        # Let's extract the base risk by passing all weights to risk_engine.
        from backend.app.risk.engine import compute_risk, RiskInputs
        all_weights = tuple(w for _, w in fired_evidence_weights)
        risk_res = compute_risk(
            RiskInputs(
                weights=all_weights, 
                p_model=p_model, 
                missing_ratio=missing_ratio, 
                impact=impact_val,
                floor=floor,
                cap=cap
            ),
            self.config
        )
        
        # 4. Construct Evidence models
        evidence_list = []
        for i, (et, w) in enumerate(fired_evidence_weights):
            # Find contribution for this evidence
            contrib = 0.0
            contrib_pct = 0.0
            for c in contributions:
                if c["type"] == et:
                    contrib = c["contribution"]
                    contrib_pct = c["contribution_pct"]
                    break
            
            evidence_list.append(
                Evidence(
                    evidence_id=f"EV-{incident_id}-{i}",
                    type=et,
                    category="detector",
                    value="true",
                    weight=w,
                    direction="supports_threat",
                    source_engine=module,
                    description=f"Evidence detected by {module} engine",
                    contribution=contrib,
                    contribution_pct=contrib_pct
                )
            )
            
        # 5. Generate Explanation
        ml_insight = context.get("ml_insights", None)
        explanation = generate_explanation(evidence_list, ml_insight=ml_insight)
        
        # 6. Generate Recommended Actions
        actions = generate_responses(
            threat_type=threat_type,
            severity=risk_res["severity"],
            assessment=risk_res["assessment"],
            module=module,
            evidence=evidence_list
        )
        
        # 7. Construct RiskBreakdown
        risk_breakdown = RiskBreakdown(
            p=risk_res["p"],
            e=risk_res["e"],
            c=risk_res["c"],
            f=risk_res["f"],
            raw=risk_res["raw"],
            assessment_reason=f"Impact: {impact_level}. Floors: {floor_res[1]}. Caps: {cap_res[1]}.",
            inconclusive_overridden_by_floor=risk_res["inconclusive_overridden_by_floor"]
        )
        
        # 8. Construct Incident
        incident = Incident(
            incident_id=incident_id,
            module=module_enum,
            layer=layer,
            input_type=input_type,
            threat_type=threat_type,
            assessment=risk_res["assessment"],
            severity=risk_res["severity"],
            risk_score=risk_res["final"],
            confidence=risk_res["c"],
            status="new",
            entities=entities or [],
            evidence=evidence_list,
            risk_breakdown=risk_breakdown,
            explanation=explanation,
            recommended_actions=actions,
            mitre_attack=mitre_attack,
            authenticity=authenticity,
            model_metadata=model_metadata or {"risk_config_version": self.config["version"]}
        )
        
        return incident
