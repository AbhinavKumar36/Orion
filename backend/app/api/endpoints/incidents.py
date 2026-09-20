import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.app.models.domain import Incident
from backend.app.services.orchestrator import Orchestrator
from backend.app.repositories.incident_repo import IncidentRepository

router = APIRouter()

class MockAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    module: str
    layer: str
    input_type: str
    fired_evidence_types: List[str]
    context: Dict[str, Any] = {}
    p_model: float | None = None
    missing_ratio: float = 0.0

@router.post("/analyze", response_model=Incident, status_code=201)
def analyze_incident(req: MockAnalyzeRequest):
    """
    Triggers a mocked analysis through the orchestrator.
    Used for Phase 1 verification.
    """
    incident_id = req.incident_id or f"ORN-DEMO-{uuid.uuid4().hex[:6].upper()}"
    
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module=req.module,
            layer=req.layer,
            input_type=req.input_type,
            fired_evidence_types=req.fired_evidence_types,
            context=req.context,
            p_model=req.p_model,
            missing_ratio=req.missing_ratio
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    """
    Retrieves a canonical incident by ID.
    """
    repo = IncidentRepository()
    incident = repo.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
