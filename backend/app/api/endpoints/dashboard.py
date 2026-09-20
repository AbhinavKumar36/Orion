from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.app.repositories.incident_repo import IncidentRepository

router = APIRouter()

@router.get("/metrics", response_model=Dict[str, Any])
def get_dashboard_metrics():
    repo = IncidentRepository()
    try:
        return repo.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timeline", response_model=List[Dict[str, Any]])
def get_dashboard_timeline():
    repo = IncidentRepository()
    try:
        return repo.get_dashboard_timeline()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/targets", response_model=List[Dict[str, Any]])
def get_dashboard_targets():
    repo = IncidentRepository()
    try:
        return repo.get_dashboard_targets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
