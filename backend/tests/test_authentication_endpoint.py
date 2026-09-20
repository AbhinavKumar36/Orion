import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from datetime import datetime, timedelta

client = TestClient(app)

def test_analyze_auth_b0_safe():
    # B0: normal login
    now = datetime.utcnow()
    payload = {
        "events": [{
            "user_id": "user_1042",
            "timestamp": now.isoformat(),
            "event_type": "login_success",
            "ip": "10.0.0.50",
            "device_id": "corp_macbook_pro",
            "geo": {"country": "US", "city": "NY", "lat": 40.7128, "lon": -74.0060},
            "privileged": False
        }],
        "context": {}
    }
    response = client.post("/api/incidents/analyze/authentication", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["assessment"] == "benign"
    fired = [f["type"] for f in data["evidence"]]
    assert len(fired) == 0

def test_analyze_auth_b1_account_takeover():
    # B1: failed_burst + success_after_failures + new_device + new_location + unusual_time + ip_novelty
    now = datetime.utcnow()
    
    # Generate 5 failures in the last 2 minutes
    events = []
    for i in range(5):
        events.append({
            "user_id": "user_1042",
            "timestamp": (now - timedelta(minutes=4 - i)).isoformat(),
            "event_type": "login_failure",
            "ip": "1.2.3.4", # New IP
            "device_id": "unknown_device", # New device
            "geo": {"country": "CN", "lat": 39.9, "lon": 116.4}, # New location
            "privileged": False
        })
        
    # Then a success
    events.append({
        "user_id": "user_1042",
        "timestamp": now.isoformat(),
        "event_type": "login_success",
        "ip": "1.2.3.4",
        "device_id": "unknown_device",
        "geo": {"country": "CN", "lat": 39.9, "lon": 116.4},
        "privileged": False
    })
    
    # We will override the clock in baselines for unusual_time by setting timestamp to an unusual hour
    # Actually, we can just let it run. The baseline says 8 to 18. Let's force the timestamp hour to 3 AM.
    unusual_time = now.replace(hour=3)
    for e in events:
        dt = datetime.fromisoformat(e["timestamp"])
        e["timestamp"] = dt.replace(hour=3).isoformat()
    
    payload = {
        "events": events,
        "context": {}
    }
    
    response = client.post("/api/incidents/analyze/authentication", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["assessment"] == "threat"
    assert data["threat_type"] == "account_takeover"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "failed_burst" in fired
    assert "success_after_failures" in fired
    assert "new_device" in fired
    assert "new_location" in fired
    assert "ip_novelty" in fired
    assert "unusual_time" in fired

def test_analyze_auth_b2_privileged():
    # B2: same as B1 but with context privileged_account = true
    now = datetime.utcnow()
    
    events = []
    for i in range(5):
        events.append({
            "user_id": "user_1042",
            "timestamp": (now - timedelta(minutes=4 - i)).isoformat(),
            "event_type": "login_failure",
            "ip": "1.2.3.4",
            "device_id": "unknown_device",
            "geo": {"country": "CN", "lat": 39.9, "lon": 116.4}
        })
    events.append({
        "user_id": "user_1042",
        "timestamp": now.isoformat(),
        "event_type": "login_success",
        "ip": "1.2.3.4",
        "device_id": "unknown_device",
        "geo": {"country": "CN", "lat": 39.9, "lon": 116.4}
    })
    
    for e in events:
        dt = datetime.fromisoformat(e["timestamp"])
        e["timestamp"] = dt.replace(hour=3).isoformat()
        
    payload = {
        "events": events,
        "context": {"privileged_account": True}
    }
    
    response = client.post("/api/incidents/analyze/authentication", json=payload)
    data = response.json()
    
    assert data["severity"] == "CRITICAL"
    assert data["threat_type"] == "account_takeover"

def test_analyze_auth_password_spraying():
    # Test password spraying specifically
    now = datetime.utcnow()
    events = []
    
    # 5 distinct users, 2 failures each from the same IP
    for i in range(5):
        for j in range(2):
            events.append({
                "user_id": f"user_spray_{i}",
                "timestamp": (now - timedelta(minutes=5)).isoformat(),
                "event_type": "login_failure",
                "ip": "9.9.9.9"
            })
            
    # The current event is a failure from that IP for the last user
    events.append({
        "user_id": "user_spray_4",
        "timestamp": now.isoformat(),
        "event_type": "login_failure",
        "ip": "9.9.9.9"
    })
    
    payload = {
        "events": events,
        "context": {}
    }
    
    response = client.post("/api/incidents/analyze/authentication", json=payload)
    data = response.json()
    
    fired = [f["type"] for f in data["evidence"]]
    assert "password_spraying" in fired
    assert data["threat_type"] == "password_spraying"
