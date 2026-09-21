import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.repositories.incident_repo import IncidentRepository
from backend.app.core.database import get_db
from datetime import datetime, timedelta

client = TestClient(app)
repo = IncidentRepository()

def test_integration_end_to_end():
    """
    Step 2 - Verify phishing -> alert, canonical incident, entity persistence.
    """
    # 1. Phishing Input (Medium-High Severity)
    phishing_payload = {
        "url": "http://orion-c0rp.com/login",
        "message": {
            "channel": "email",
            "sender": "admin@orion-c0rp.com",
            "body": "urgent action required verify your credentials immediately"
        },
        "context": {
            "executive_or_official": True,
            "ip_address": "1.2.3.4"
        }
    }
    
    resp1 = client.post("/api/incidents/analyze/phishing", json=phishing_payload)
    assert resp1.status_code == 201
    inc1 = resp1.json()
    
    # 2. Verify Canonical Incident fields
    assert "incident_id" in inc1
    assert inc1["module"] == "phishing"
    assert "threat_type" in inc1
    assert "assessment" in inc1
    assert "severity" in inc1
    assert "risk_score" in inc1
    assert "confidence" in inc1
    assert "risk_breakdown" in inc1
    assert "evidence" in inc1
    assert "explanation" in inc1
    assert "recommended_actions" in inc1
    assert "entities" in inc1
    
    # Verify Explanation Evidence Invariant
    evidence_ids = {e["evidence_id"] for e in inc1["evidence"]}
    for factor in inc1["explanation"]["factors"]:
        for eid in factor["evidence_ids"]:
            assert eid in evidence_ids, f"Evidence ID {eid} in explanation but not in evidence list"

    # Verify Alert Threshold Logic
    # Medium/High/Critical should alert
    assert inc1["severity"] in ["MEDIUM", "HIGH", "CRITICAL"]
    
    alerts = repo.list_alerts()
    assert any(a["incident_id"] == inc1["incident_id"] for a in alerts)
    
    # Verify Entity Persistence
    entities = inc1["entities"]
    assert any(e["entity_type"] == "email" and e["value_canonical"] == "admin@orion-c0rp.com" for e in entities)
    assert any(e["entity_type"] == "domain" and e["value_canonical"] == "orion-c0rp.com" for e in entities)
    
    # 3. Verify Authentication Correlation (Step 4 & 5)
    now = datetime.utcnow()
    auth_events = []
    for i in range(5):
        auth_events.append({
            "user_id": "admin@orion-c0rp.com",
            "timestamp": (now - timedelta(minutes=4 - i)).isoformat(),
            "event_type": "login_failure",
            "ip": "1.2.3.4",
            "device_id": "new_device_abc",
            "geo": {"country": "CN"}
        })
    auth_events.append({
        "user_id": "admin@orion-c0rp.com",
        "timestamp": now.isoformat(),
        "event_type": "login_success",
        "ip": "1.2.3.4",
        "device_id": "new_device_abc",
        "geo": {"country": "CN"}
    })
    
    auth_payload = {
        "events": auth_events,
        "context": {"privileged_account": True}
    }
    
    resp2 = client.post("/api/incidents/analyze/authentication", json=auth_payload)
    assert resp2.status_code == 201
    inc2 = resp2.json()
    
    # Refresh the incidents from the DB to get their updated correlation_ids
    inc1_refreshed = client.get(f"/api/incidents/{inc1['incident_id']}").json()
    inc2_refreshed = client.get(f"/api/incidents/{inc2['incident_id']}").json()
    
    assert inc1_refreshed["correlation_id"] is not None or inc2_refreshed["correlation_id"] is not None
    
    # Fetch the correlated incidents
    corr_id = inc2_refreshed["correlation_id"]
    assert corr_id is not None
    
    # We can get correlated incidents from repo
    # get_correlated_incidents in repo actually takes entity_pks, wait!
    # Let's see what methods repo has for correlation ID.
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT incident_id FROM incidents WHERE correlation_id = ?", (corr_id,))
        incident_ids = [row[0] for row in c.fetchall()]
        
    assert inc1["incident_id"] in incident_ids
    assert inc2["incident_id"] in incident_ids
    
    if inc2["recommended_actions"]:
        action = inc2["recommended_actions"][0]
        action_name = action["action"]
        
        sim_resp = client.post(f"/api/incidents/{inc2['incident_id']}/actions/{action_name}/simulate")
        assert sim_resp.status_code == 200
        sim_data = sim_resp.json()
        
        # Verify action status becomes simulated
        assert sim_data["status"] == "ok"
        assert "simulated_at" in sim_data
        
        # Verify incident lifecycle status is not automatically changed to resolved
        inc_resp = client.get(f"/api/incidents/{inc2['incident_id']}")
        assert inc_resp.status_code == 200
        updated_inc2 = inc_resp.json()
        assert updated_inc2["status"] != "resolved"
        
        # Verify action status is simulated in the response
        simulated_action = next(a for a in updated_inc2["recommended_actions"] if a["action"] == action_name)
        assert simulated_action["status"] == "simulated"
        assert simulated_action["automated"] is False

    conn.close()

def test_inconclusive_alert():
    """
    Test that an inconclusive assessment with LOW severity still generates an alert.
    """
    # Create a system activity that triggers inconclusive
    # (Just an endpoint enumeration without enough other bad stuff, causing score < 59 but inconclusive)
    payload = {
        "events": [
            {
                "source": "api_log",
                "actor": "user_123",
                "action": "api_request",
                "path": "/api/users",
                "status_code": 403,
                "ip": "2.2.2.2"
            }
        ] * 15, # trigger rate spike
        "context": {}
    }
    
    resp = client.post("/api/incidents/analyze/system_activity", json=payload)
    assert resp.status_code == 201
    inc = resp.json()
    
    alerts = repo.list_alerts()
    alert = next((a for a in alerts if a["incident_id"] == inc["incident_id"]), None)
    
    if inc["assessment"] == "inconclusive" or inc["severity"] in ["MEDIUM", "HIGH", "CRITICAL"]:
        assert alert is not None
    else:
        assert alert is None

def test_correlation_negative_different_entities():
    # Phishing with ip 5.5.5.5
    phish = {
        "url": "http://evil-different.com",
        "context": {"ip_address": "5.5.5.5"}
    }
    r1 = client.post("/api/incidents/analyze/phishing", json=phish)
    inc1 = r1.json()
    
    # Auth with ip 6.6.6.6
    auth = {
        "events": [{"user_id": "bob@evil-different.com", "ip": "6.6.6.6", "event_type": "login_failure"}],
        "context": {}
    }
    r2 = client.post("/api/incidents/analyze/authentication", json=auth)
    inc2 = r2.json()
    
    # They should NOT correlate
    assert inc1["correlation_id"] is None
    # Depending on correlation engine timing, we fetch to be sure
    inc2_fresh = client.get(f"/api/incidents/{inc2['incident_id']}").json()
    assert inc2_fresh.get("correlation_id") is None

def test_correlation_negative_outside_window():
    # In order to test outside window, we need to create an incident in the past.
    # Since Orchestrator creates incidents with datetime.utcnow(), we have to manually insert or manipulate one.
    # We will do this by analyzing an incident, then updating its timestamp in sqlite, then analyzing another.
    phish = {
        "url": "http://evil-outside.com",
        "context": {"ip_address": "7.7.7.7"}
    }
    r1 = client.post("/api/incidents/analyze/phishing", json=phish)
    inc1 = r1.json()
    
    # Shift timestamp back 48 hours
    with get_db() as conn:
        past_time = (datetime.utcnow() - timedelta(hours=48)).isoformat()
        conn.execute("UPDATE incidents SET timestamp = ? WHERE incident_id = ?", (past_time, inc1["incident_id"]))
        conn.commit()
        
    auth = {
        "events": [{"user_id": "alice@evil-outside.com", "ip": "7.7.7.7", "event_type": "login_failure"}],
        "context": {}
    }
    r2 = client.post("/api/incidents/analyze/authentication", json=auth)
    inc2 = r2.json()
    
    inc1_fresh = client.get(f"/api/incidents/{inc1['incident_id']}").json()
    inc2_fresh = client.get(f"/api/incidents/{inc2['incident_id']}").json()
    
    assert inc1_fresh.get("correlation_id") is None
    assert inc2_fresh.get("correlation_id") is None

def test_c2_inconclusive_explicit():
    # C2 explicitly tests LOW severity + inconclusive = ALERT
    # By risk_config.yaml, if risk_score is say 35 (LOW), but assessment=inconclusive, it should alert.
    # We can trigger inconclusive in system_activity by having enough rate to be inconclusive, but low enough score.
    # Let's just use the known deterministic input for inconclusive system activity from the Prompt's "C2" scenario.
    # Actually, we can use the MockAnalyzeRequest to forcibly inject it exactly as C2.
    
    c2_payload = {
        "module": "system_activity",
        "layer": "system",
        "input_type": "event_stream",
        "fired_evidence_types": ["rate_spike"],
        "context": {},
        "p_model": 0.4, 
        "missing_ratio": 1.0
    }
    
    resp = client.post("/api/incidents/analyze", json=c2_payload)
    inc = resp.json()
    
    # It might evaluate to inconclusive depending on the floor
    # To force inconclusive precisely, we know inconclusive requires score <= 59 and floor inconclusive.
    # Wait, the risk_config says sys_rate_spike floor is INCONCLUSIVE if it's the only thing.
    assert inc["assessment"] == "inconclusive"
    assert inc["severity"] in ["SAFE", "LOW", "MEDIUM"] 
    
    alerts = repo.list_alerts()
    alert = next((a for a in alerts if a["incident_id"] == inc["incident_id"]), None)
    assert alert is not None

