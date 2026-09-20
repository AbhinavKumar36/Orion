import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.orchestrator import Orchestrator
from backend.app.core.config import get_risk_config
from backend.app.core.database import init_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()

def test_orchestrator_directly():
    orch = Orchestrator()
    incident = orch.process_mocked_analysis(
        incident_id="TEST-1",
        module="system_activity",
        layer="technology",
        input_type="system_log",
        fired_evidence_types=["outbound_volume_spike", "new_external_destination"],
        context={"sensitive_service": True},
        p_model=0.9
    )
    
    assert incident.module == "system_activity"
    assert incident.threat_type == "data_exfiltration"
    # F5_exfil_volume_new_destination floor is 60, sensitive_service impact is HIGH (1.15)
    # The score should be at least 60
    assert incident.risk_score >= 60
    assert incident.severity in ["HIGH", "CRITICAL"]

def test_analyze_endpoint():
    payload = {
        "module": "authentication",
        "layer": "technology",
        "input_type": "auth_event",
        "fired_evidence_types": ["failed_burst", "success_after_failures"],
        "context": {"privileged_account": True},
        "p_model": 0.8
    }
    
    response = client.post("/api/incidents/analyze", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    assert data["module"] == "authentication"
    assert data["threat_type"] == "account_takeover"
    
    # Check that it got saved in DB
    incident_id = data["incident_id"]
    get_response = client.get(f"/api/incidents/{incident_id}")
    assert get_response.status_code == 200
    assert get_response.json()["incident_id"] == incident_id
