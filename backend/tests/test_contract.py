import json
import os
import pytest
from backend.app.models.domain import Incident
from backend.app.main import app
from fastapi.testclient import TestClient

def test_canonical_incident_fixture_validation():
    """
    Test that the generated ORN-DEMO-A1 fixture adheres to the v1.2 contract.
    """
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "ORN-DEMO-A1.json")
    with open(fixture_path, "r") as f:
        data = json.load(f)
        
    incident = Incident(**data)
    assert incident.incident_id == "ORN-DEMO-A1"
    assert incident.schema_version == "1.2"
    assert incident.module == "phishing"
    assert incident.layer == "human"
    assert incident.threat_type == "credential_harvesting"
    assert incident.assessment == "threat"
    
    # Check explanation completeness
    assert len(incident.explanation.factors) == 3
    assert len(incident.explanation.top_factors) == 3
    
    # Check recommended actions
    assert len(incident.recommended_actions) > 0
    assert incident.recommended_actions[0].status == "suggested"

def test_openapi_schema_generation():
    """
    Test that the OpenAPI schema generates correctly.
    """
    schema = app.openapi()
    assert schema["info"]["title"] == "ORION Cyber Threat Intelligence API"
    assert "paths" in schema
    assert "/api/incidents/analyze" in schema["paths"]
