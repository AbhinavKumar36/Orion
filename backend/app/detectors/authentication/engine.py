from typing import List, Dict, Any, Tuple
from backend.app.detectors.authentication.models import AuthEvent
from backend.app.detectors.authentication.baselines import get_user_baseline
from backend.app.detectors.authentication.rules_engine import evaluate_rules
from backend.app.detectors.authentication.ml_model import auth_anomaly_model

def analyze_authentication(events: List[Dict[str, Any]]) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """
    Module C: Authentication Anomaly Engine.
    Takes a batch of events (historical window + current event).
    The last event in the list is considered the 'current' event for analysis.
    """
    if not events:
        return [], 0.0, []
        
    auth_events = [AuthEvent(**e) for e in events]
    current_event = auth_events[-1]
    baseline = get_user_baseline(current_event.user_id)
    
    # 1. Evaluate rules over sliding window
    fired_evidence = evaluate_rules(current_event, auth_events, baseline)
    
    # 2. Extract features for ML model
    # We will build a simple feature dictionary for Isolation Forest
    now = current_event.timestamp
    
    user_failures_10m = len([e for e in auth_events if e.user_id == current_event.user_id and e.event_type == "login_failure" and (now - e.timestamp).total_seconds() <= 600])
    
    user_events_1h = [e for e in auth_events if e.user_id == current_event.user_id and (now - e.timestamp).total_seconds() <= 3600]
    distinct_ips = len({e.ip for e in user_events_1h})
    distinct_devices = len({e.device_id for e in user_events_1h if e.device_id})
    logins_per_minute = len([e for e in user_events_1h if e.event_type == "login_success"]) / 60.0
    
    features = {
        "failures_in_10m": user_failures_10m,
        "distinct_ips_in_1h": distinct_ips,
        "distinct_devices_in_1h": distinct_devices,
        "logins_per_minute": logins_per_minute
    }
    
    # 3. Get probability from Isolation Forest
    p_model = auth_anomaly_model.predict_proba(features)
    ml_insights = auth_anomaly_model.get_ml_insight(features)
    
    return list(fired_evidence), p_model, ml_insights
