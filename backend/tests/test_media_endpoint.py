import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

import json
def test_analyze_media_c1():
    # C1: High missing ratio is false (0.2), p_model=0.71, executive context
    asset_mock = {
        "type": "image",
        "force_status": "ok",
        "flags": ["exif_missing", "editing_software_tag", "ela_inconsistency", "lookalike_sender_identity", "payment_or_urgent_request_context"],
        "force_missing_ratio": 0.2,
        "force_p_model": 0.71
    }
    context = {
        "executive_or_official": True,
        "asset_mock": asset_mock
    }
    
    response = client.post(
        "/api/incidents/analyze/media",
        data={"context": json.dumps(context)},
        files={"file": ("dummy.jpg", b"fakebytes", "image/jpeg")}
    )
    assert response.status_code == 201
    
    data = response.json()
    assert data["assessment"] == "threat"
    assert data["severity"] == "HIGH"
    assert data["threat_type"] == "executive_impersonation"
    
    fired = [f["type"] for f in data["evidence"]]
    assert "ela_inconsistency" in fired
    assert "exif_missing" in fired

def test_analyze_media_c2_inconclusive():
    # C2: Missing ratio = 0.7 (high), triggers inconclusive
    asset_mock = {
        "type": "video",
        "force_status": "degraded",
        "flags": ["exif_missing"],
        "force_missing_ratio": 0.7,
        "force_p_model": 0.55
    }
    context = {
        "asset_mock": asset_mock
    }
    
    response = client.post(
        "/api/incidents/analyze/media",
        data={"context": json.dumps(context)},
        files={"file": ("dummy.mp4", b"fakebytes", "video/mp4")}
    )
    assert response.status_code == 201
    
    data = response.json()
    assert data["assessment"] == "inconclusive"
    assert data["severity"] == "LOW"
    assert data["threat_type"] == "synthetic_media"
