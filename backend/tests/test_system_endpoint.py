import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from datetime import datetime, timedelta

client = TestClient(app)

def test_analyze_system_activity_d1():
    # D1: outbound_volume_spike, new_external_destination, off_hours_transfer, bulk_file_access
    # We use "svc_backup" as actor because we hardcoded baseline for it
    now = datetime.utcnow()
    # Baseline for svc_backup: hours 2-6. Let's make it hour 14 (off hours)
    now = now.replace(hour=14)
    
    events = []
    
    # Generate bulk file access (>=50 distinct endpoints in 10 mins)
    for i in range(55):
        events.append({
            "timestamp": (now - timedelta(seconds=i)).isoformat(),
            "source": "api_log",
            "actor": "svc_backup",
            "action": "read",
            "endpoint": f"/api/files/doc_{i}",
            "bytes_out": 100 # Total 5500 bytes (baseline is 1000/min, so this triggers spike > 3 std devs)
        })
        
    # The last event will hit a new external destination
    events.append({
        "timestamp": now.isoformat(),
        "source": "network_flow",
        "actor": "svc_backup",
        "dst_ip": "1.2.3.4", # New external
        "bytes_out": 2000
    })
    
    payload = {
        "events": events,
        "context": {
            "sensitive_service": True
        }
    }
    
    response = client.post("/api/incidents/analyze/system_activity", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["assessment"] == "threat"
    assert data["severity"] == "HIGH"
    assert data["threat_type"] == "data_exfiltration"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "outbound_volume_spike" in fired
    assert "new_external_destination" in fired
    assert "off_hours_transfer" in fired
    assert "bulk_file_access" in fired
