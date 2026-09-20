import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_analyze_phishing_a0_safe():
    # A0 is safe URL
    payload = {
        "url": "https://www.example.com",
        "message": {
            "channel": "email",
            "body": "hello how are you doing today"
        }
    }
    response = client.post("/api/incidents/analyze/phishing", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["assessment"] == "benign"

def test_analyze_phishing_a1_credential_harvesting():
    # A1 is Credential harvesting URL
    payload = {
        "url": "http://192.168.1.100/login",
        "message": {
            "channel": "email",
            "body": "urgent action required your account is suspended please verify your login credentials immediately"
        },
        "html_snippet": "<form action='http://bad.com'><input type='password'></form>"
    }
    response = client.post("/api/incidents/analyze/phishing", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    assert data["assessment"] == "threat"
    assert data["threat_type"] == "credential_harvesting"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "ip_host" in fired
    assert "credential_path" in fired
    assert "no_https" in fired
    assert "fake_login_form" in fired
    assert "form_action_cross_domain" in fired

def test_analyze_phishing_a2_malware_delivery():
    # A2 is Malware delivery via obfuscated URL
    payload = {
        "url": "http://xn--example.com.xyz",
        "message": {
            "channel": "email",
            "body": "invoice attached please pay the outstanding amount"
        }
    }
    response = client.post("/api/incidents/analyze/phishing", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    assert data["assessment"] == "threat"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "punycode" in fired
    assert "suspicious_tld" in fired
    assert "no_https" in fired
