import os
import json
import sys
from pydantic import RootModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))
from app.services.orchestrator import Orchestrator
from app.models.domain import Entity

def generate_fixture():
    orch = Orchestrator()
    # A1 is a credential harvesting phishing case
    incident = orch.process_mocked_analysis(
        incident_id="ORN-DEMO-A1",
        module="phishing",
        layer="human",
        input_type="url_text",
        fired_evidence_types=["ip_host", "credential_path", "brand_lookalike"],
        context={"sandbox_or_test": False},
        p_model=0.95,
        missing_ratio=0.0,
        entities=[
            Entity(entity_type="domain", value_canonical="192.168.1.100", role="subject", criticality="standard")
        ]
    )

    fixture_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "ORN-DEMO-A1.json"))
    with open(fixture_path, "w") as f:
        f.write(incident.model_dump_json(indent=2))
        
    print(f"Generated {fixture_path}")

if __name__ == "__main__":
    generate_fixture()
