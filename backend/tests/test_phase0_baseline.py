"""
Phase 0 Baseline Tests:
1. Configuration loader validation
2. SQLite schema creation, foreign key enforcement, WAL mode
3. Health check and system info FastAPI endpoints
"""
import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import get_risk_config, risk_config_loader
from backend.app.core.database import get_db, init_db, check_db_health


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_risk_config_version():
    cfg = get_risk_config()
    assert cfg["version"] == "risk-cfg-1.1"
    assert "formula" in cfg
    assert "severity_bands" in cfg
    assert "policy" in cfg
    assert "classification" in cfg


def test_database_initialization():
    init_db()
    health = check_db_health()
    assert health["connected"] is True
    assert health["foreign_keys_on"] is True
    assert health["journal_mode"] == "wal"
    assert health["schema_initialized"] is True


def test_database_foreign_key_enforcement():
    init_db()
    with pytest.raises(sqlite3.IntegrityError):
        with get_db() as conn:
            # Attempt to insert an evidence row with a non-existent incident_id
            conn.execute(
                """
                INSERT INTO evidence (evidence_id, incident_id, type, category, value_json, weight, direction, source_engine, description)
                VALUES ('EV-TEST-1', 'NON-EXISTENT-INCIDENT', 'ip_host', 'url', '{}', 0.5, 'supports_threat', 'test', 'test description')
                """
            )


def test_api_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["risk_config_version"] == "risk-cfg-1.1"
    assert data["database"]["connected"] is True


def test_api_system_info_endpoint(client):
    response = client.get("/api/system/info")
    assert response.status_code == 200
    data = response.json()
    assert data["product_name"] == "ORION"
    assert data["specification_version"] == "3.3"
    assert data["contract_version"] == "1.2"
    assert data["risk_config_version"] == "risk-cfg-1.1"
    assert "human" in data["layers"]
    assert "technology" in data["layers"]
    assert "phishing" in data["supported_modules"]
    assert "system_activity" in data["supported_modules"]
