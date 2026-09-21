import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

import json


def test_analyze_media_c1():
    # C1: Test that without real engine, we get inconclusive
    context = {
        "executive_or_official": True,
    }

    response = client.post(
        "/api/incidents/analyze/media",
        data={"context": json.dumps(context)},
        files={"file": ("dummy.jpg", b"fakebytes", "image/jpeg")}
    )
    assert response.status_code == 201
    
    data = response.json()
    assert data["assessment"] == "benign"

def test_analyze_media_c2_inconclusive():
    # C2: Video format triggers inconclusive because adapter doesn't support video yet
    context = {}
    
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
