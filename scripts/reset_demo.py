import os
import sys
from pathlib import Path

# Add project root to python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.app.core.database import get_db_path, init_db

def reset_demo():
    print("Resetting demo database...")
    db_path = get_db_path()
    
    if db_path.exists():
        try:
            os.remove(db_path)
            print(f"Deleted existing database at {db_path}")
        except Exception as e:
            print(f"Failed to delete database: {e}")
            sys.exit(1)
            
    try:
        init_db()
        print("Database re-initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        sys.exit(1)

    print("Seeding Threat Constellation...")
    
    # We use FastAPI TestClient to simulate HTTP requests to our own API
    from fastapi.testclient import TestClient
    from backend.app.main import app
    
    client = TestClient(app)
    
    # Incident 1: Phishing Email
    phishing_payload = {
        "incident_id": "ORN-PHISH-001",
        "url": "http://secure-login-update-orion.com",
        "message": {
            "subject": "Urgent: Update your credentials",
            "body": "Please click here to update your credentials immediately.",
            "sender": "admin@it-support-internal.com"
        },
        "context": {
            "recipient": "jdoe@company.com",
            "source_ip": "192.168.1.100"
        }
    }
    client.post("/api/incidents/analyze/phishing", json=phishing_payload)

    # Incident 2: Authentication Anomaly (Same User, Same IP)
    auth_payload = {
        "incident_id": "ORN-AUTH-002",
        "events": [
            {"timestamp": "2023-10-27T10:00:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_failure"},
            {"timestamp": "2023-10-27T10:01:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_failure"},
            {"timestamp": "2023-10-27T10:02:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_failure"},
            {"timestamp": "2023-10-27T10:03:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_failure"},
            {"timestamp": "2023-10-27T10:04:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_failure"},
            {"timestamp": "2023-10-27T10:05:00Z", "ip": "192.168.1.100", "user_id": "jdoe@company.com", "event_type": "login_success"}
        ],
        "context": {
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    }
    client.post("/api/incidents/analyze/authentication", json=auth_payload)

    # Incident 3: System Activity (Same IP)
    sys_payload = {
        "incident_id": "ORN-SYS-003",
        "events": [
            {"timestamp": "2023-10-27T10:10:00Z", "source": "system_log", "actor": "jdoe@company.com", "process": "powershell.exe", "command_line": "powershell -enc JABz...", "ip": "192.168.1.100"}
        ],
        "context": {
            "hostname": "DESKTOP-JDOE",
            "source_ip": "192.168.1.100"
        }
    }
    client.post("/api/incidents/analyze/system_activity", json=sys_payload)

    print("Demo reset complete and Constellation seeded.")

if __name__ == "__main__":
    reset_demo()
