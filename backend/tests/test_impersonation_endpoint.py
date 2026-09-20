import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_analyze_impersonation_e1():
    # E1: display_name_spoof, official_domain_mismatch, executive_claim, payment_request_text, urgency_language, first_time_sender
    payload = {
        "message": {
            "sender_name": "Alice Smith",
            "sender_domain": "orion-c0rp.com", # Mismatch from orion-corp.com
            "role_claim": "CEO",
            "body": "Please wire the payment immediately. It's urgent.",
            "is_first_time": True
        }
    }
    
    response = client.post("/api/incidents/analyze/impersonation", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["assessment"] == "threat"
    assert data["severity"] == "CRITICAL"
    assert data["threat_type"] == "executive_impersonation"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "display_name_spoof" in fired
    assert "official_domain_mismatch" in fired
    assert "executive_claim" in fired
    assert "payment_request_text" in fired
    assert "urgency_language" in fired
    assert "first_time_sender" in fired
