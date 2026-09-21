from enum import Enum
from typing import Any, Dict, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

class Module(str, Enum):
    phishing = "phishing"
    impersonation = "impersonation"
    media = "media"
    authentication = "authentication"
    system_activity = "system_activity"

class RecommendedAction(BaseModel):
    action: str
    priority: int = Field(ge=1)
    rationale: str
    automated: Literal[False] = False
    status: Literal["suggested", "simulated", "dismissed"] = "suggested"
    simulated_at: datetime | None = None

class Evidence(BaseModel):
    evidence_id: str
    type: str
    category: str
    value: str
    weight: float
    direction: str
    source_engine: str
    description: str
    contribution: float | None = None
    contribution_pct: float | None = None

class Factor(BaseModel):
    evidence_ids: List[str]
    description: str

class Explanation(BaseModel):
    factors: List[Factor]
    top_factors: List[str] = Field(default_factory=list)
    ml_insight: Dict[str, Any] | List[Any] | None = None

class Entity(BaseModel):
    entity_type: str
    value_canonical: str
    role: str = "subject"
    criticality: str = "standard"

class RiskBreakdown(BaseModel):
    p: float
    e: float
    c: float
    f: float
    raw: float
    assessment_reason: str = ""
    inconclusive_overridden_by_floor: bool = False

class MitreAttack(BaseModel):
    tactic: str
    technique: str
    id: str

class Incident(BaseModel):
    incident_id: str
    schema_version: str = "1.2"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_time: datetime = Field(default_factory=datetime.utcnow)
    module: Module
    layer: str
    input_type: str
    threat_type: str
    assessment: str
    severity: str
    risk_score: int
    confidence: float
    status: str = "new"
    correlation_id: str | None = None
    
    entities: List[Entity] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
    risk_breakdown: RiskBreakdown
    explanation: Explanation
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    mitre_attack: List[MitreAttack] | None = None
    authenticity: Dict[str, Any] | None = None
    model_metadata: Dict[str, Any] | None = None
    
    model_config = {
        "protected_namespaces": ()
    }

    @model_validator(mode="after")
    def check_severity_and_inconclusive(self) -> "Incident":
        score = self.risk_score
        severity = self.severity
        # Validate severity vs score band
        valid = False
        bands = {
            "SAFE": (0, 19),
            "LOW": (20, 39),
            "MEDIUM": (40, 59),
            "HIGH": (60, 79),
            "CRITICAL": (80, 100),
        }
        for name, (lo, hi) in bands.items():
            if name == severity and lo <= score <= hi:
                valid = True
                break
        if not valid:
            raise ValueError(f"Severity {severity} does not match score {score}")

        if self.assessment == "inconclusive" and score > 59:
            raise ValueError("inconclusive results must have risk_score <= 59")
        
        # Verify all evidence IDs in explanation factors exist
        ev_ids = {e.evidence_id for e in self.evidence}
        for f in self.explanation.factors:
            for eid in f.evidence_ids:
                if eid not in ev_ids:
                    raise ValueError(f"Evidence ID {eid} found in explanation factors but not in evidence list")

        return self
