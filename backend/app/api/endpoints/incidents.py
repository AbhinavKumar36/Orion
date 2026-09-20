import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.app.models.domain import Incident
from backend.app.services.orchestrator import Orchestrator
from backend.app.repositories.incident_repo import IncidentRepository
from backend.app.detectors.phishing.engine import analyze_phishing
from backend.app.detectors.authentication.engine import analyze_authentication
from backend.app.detectors.impersonation.engine import check_impersonation
from backend.app.detectors.media.engine import analyze_media
from backend.app.detectors.system_activity.engine import analyze_system_activity

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

class PhishingAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    url: str | None = None
    message: Dict[str, Any] | None = None
    html_snippet: str | None = None
    context: Dict[str, Any] = {}

class AuthAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    events: List[Dict[str, Any]]
    context: Dict[str, Any] = {}

class ImpersonationAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    message: Dict[str, Any]
    claimed_identity: str | None = None
    context: Dict[str, Any] = {}

class MediaAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    asset: Dict[str, Any]
    context: Dict[str, Any] = {}

class SystemAnalyzeRequest(BaseModel):
    incident_id: str | None = None
    events: List[Dict[str, Any]]
    context: Dict[str, Any] = {}

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

@router.post("/analyze/phishing", response_model=Incident, status_code=201)
def analyze_phishing_endpoint(req: PhishingAnalyzeRequest):
    """
    Triggers the Phase 2 Phishing (Module A) Engine.
    """
    incident_id = req.incident_id or f"ORN-PHISH-{uuid.uuid4().hex[:6].upper()}"
    
    payload = {
        "url": req.url,
        "message": req.message,
        "html_snippet": req.html_snippet
    }
    
    fired_evidence_types, p_model, ml_insights = analyze_phishing(payload)
    
    # We pass the insights via context or we can adapt Orchestrator to take them.
    # Currently Orchestrator doesn't accept ml_insights directly in the signature, 
    # but we can pass it via context so the response/explanation logic can use it if needed,
    # or we can attach it to the incident later. 
    # Let's pass it via context.
    context = req.context.copy()
    context["ml_insights"] = ml_insights
    
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module="phishing",
            layer="human",
            input_type="url_text",
            fired_evidence_types=fired_evidence_types,
            context=context,
            p_model=p_model,
            missing_ratio=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.post("/analyze/authentication", response_model=Incident, status_code=201)
def analyze_authentication_endpoint(req: AuthAnalyzeRequest):
    """
    Triggers the Phase 3 Authentication (Module C) Engine.
    """
    incident_id = req.incident_id or f"ORN-AUTH-{uuid.uuid4().hex[:6].upper()}"
    
    fired_evidence_types, p_model, ml_insights = analyze_authentication(req.events)
    
    context = req.context.copy()
    context["ml_insights"] = ml_insights
    
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module="authentication",
            layer="behavioral",
            input_type="event_stream",
            fired_evidence_types=fired_evidence_types,
            context=context,
            p_model=p_model,
            missing_ratio=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.post("/analyze/impersonation", response_model=Incident, status_code=201)
def analyze_impersonation_endpoint(req: ImpersonationAnalyzeRequest):
    """
    Triggers the Phase 4 Impersonation (Module B1) Engine.
    """
    incident_id = req.incident_id or f"ORN-IMP-{uuid.uuid4().hex[:6].upper()}"
    
    fired_evidence_types, p_model, context_flags = check_impersonation(req.message, req.claimed_identity)
    
    context = req.context.copy()
    for flag in context_flags:
        context[flag] = True
        
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module="impersonation",
            layer="human",
            input_type="message",
            fired_evidence_types=fired_evidence_types,
            context=context,
            p_model=p_model,
            missing_ratio=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.post("/analyze/media", response_model=Incident, status_code=201)
def analyze_media_endpoint(req: MediaAnalyzeRequest):
    """
    Triggers the Phase 4 Media Authenticity (Module B2) Engine.
    """
    incident_id = req.incident_id or f"ORN-MED-{uuid.uuid4().hex[:6].upper()}"
    
    fired_evidence_types, p_model, missing_ratio = analyze_media(req.asset, req.context)
    
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module="media",
            layer="media",
            input_type="file",
            fired_evidence_types=fired_evidence_types,
            context=req.context,
            p_model=p_model,
            missing_ratio=missing_ratio
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.post("/analyze/system_activity", response_model=Incident, status_code=201)
def analyze_system_endpoint(req: SystemAnalyzeRequest):
    """
    Triggers the Phase 4 System Activity (Module D) Engine.
    """
    incident_id = req.incident_id or f"ORN-SYS-{uuid.uuid4().hex[:6].upper()}"
    
    fired_evidence_types, p_model = analyze_system_activity(req.events)
    
    orchestrator = Orchestrator()
    try:
        incident = orchestrator.process_mocked_analysis(
            incident_id=incident_id,
            module="system_activity",
            layer="system",
            input_type="event_stream",
            fired_evidence_types=fired_evidence_types,
            context=req.context,
            p_model=p_model,
            missing_ratio=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    repo = IncidentRepository()
    try:
        repo.save_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save incident: {e}")
        
    return incident

@router.get("/", response_model=List[Dict[str, Any]])
def list_incidents(limit: int = 50, offset: int = 0):
    repo = IncidentRepository()
    try:
        return repo.list_incidents(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    """
    Retrieves a canonical Incident by ID.
    """
    repo = IncidentRepository()
    incident = repo.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/{incident_id}/actions/{action_name}/simulate")
def simulate_action(incident_id: str, action_name: str):
    from datetime import datetime
    repo = IncidentRepository()
    simulated_at = datetime.utcnow().isoformat()
    success = repo.update_action_status(incident_id, action_name, "simulated", simulated_at)
    if not success:
        raise HTTPException(status_code=404, detail="Incident or action not found")
    return {"status": "ok", "action": action_name, "incident_id": incident_id, "simulated_at": simulated_at}
