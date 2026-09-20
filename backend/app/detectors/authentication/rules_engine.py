from typing import List, Set, Dict, Tuple
from datetime import datetime
import math
from backend.app.detectors.authentication.models import AuthEvent
from backend.app.detectors.authentication.baselines import UserBaseline

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def evaluate_rules(
    current_event: AuthEvent, 
    historical_events: List[AuthEvent], 
    baseline: UserBaseline
) -> Set[str]:
    """
    Evaluates authentication anomaly rules over a sliding window of events.
    `historical_events` should include recent events for the user (and for the IP in case of spraying).
    """
    evidence = set()
    
    # Sort history chronologically
    history = sorted(historical_events, key=lambda e: e.timestamp)
    now = current_event.timestamp
    
    # 1. Baseline comparisons
    if current_event.ip not in baseline.known_ips:
        evidence.add("ip_novelty")
        
    if current_event.device_id and current_event.device_id not in baseline.known_devices:
        evidence.add("new_device")
        
    if current_event.geo and current_event.geo.country and current_event.geo.country not in baseline.known_countries:
        evidence.add("new_location")
        
    hour = now.hour
    if not (baseline.usual_hours_start <= hour <= baseline.usual_hours_end):
        # Handle wrap-around (e.g. 22 to 6)
        if baseline.usual_hours_start > baseline.usual_hours_end:
            if baseline.usual_hours_end < hour < baseline.usual_hours_start:
                evidence.add("unusual_time")
        else:
            evidence.add("unusual_time")
            
    # Time window lists
    # failures in last 5 mins for this user
    user_failures_5m = [
        e for e in history 
        if e.user_id == current_event.user_id 
        and e.event_type == "login_failure"
        and (now - e.timestamp).total_seconds() <= 300
    ]
    if current_event.event_type == "login_failure":
        user_failures_5m.append(current_event)
        
    # failures in last 10 mins for this user
    user_failures_10m = [
        e for e in history 
        if e.user_id == current_event.user_id 
        and e.event_type == "login_failure"
        and (now - e.timestamp).total_seconds() <= 600
    ]
    
    # 2. failed_burst
    if len(user_failures_5m) >= 5:
        evidence.add("failed_burst")
        
    # 3. success_after_failures
    if current_event.event_type == "login_success":
        # Check if there was a failed_burst in the last 10 mins
        # A burst means 5 failures in *some* 5-minute window within the last 10 mins.
        # Approximation: if total failures in last 10 mins >= 5, call it a burst.
        if len(user_failures_10m) >= 5:
            evidence.add("success_after_failures")
            
    # 4. password_spraying
    # one source IP fails against >= 5 distinct users within 10 min, >= 2 attempts per user
    ip_failures_10m = [
        e for e in history
        if e.ip == current_event.ip
        and e.event_type == "login_failure"
        and (now - e.timestamp).total_seconds() <= 600
    ]
    if current_event.event_type == "login_failure":
        ip_failures_10m.append(current_event)
        
    users_failed = {}
    for e in ip_failures_10m:
        users_failed[e.user_id] = users_failed.get(e.user_id, 0) + 1
        
    sprayed_users = [uid for uid, count in users_failed.items() if count >= 2]
    if len(sprayed_users) >= 5:
        evidence.add("password_spraying")
        
    # 5. impossible_travel
    if current_event.event_type == "login_success" and current_event.geo and current_event.geo.lat and current_event.geo.lon:
        # Find last success
        last_success = None
        for e in reversed(history):
            if e.user_id == current_event.user_id and e.event_type == "login_success" and e.geo and e.geo.lat and e.geo.lon:
                last_success = e
                break
        
        if last_success:
            hours_diff = (now - last_success.timestamp).total_seconds() / 3600.0
            if hours_diff > 0:
                dist = haversine(last_success.geo.lat, last_success.geo.lon, current_event.geo.lat, current_event.geo.lon)
                speed = dist / hours_diff
                if speed > 900: # 900 km/h
                    evidence.add("impossible_travel")
                    
    # 6. login_velocity
    user_successes_60m = [
        e for e in history
        if e.user_id == current_event.user_id
        and e.event_type == "login_success"
        and (now - e.timestamp).total_seconds() <= 3600
    ]
    if current_event.event_type == "login_success":
        user_successes_60m.append(current_event)
        
    current_velocity = len(user_successes_60m) / 60.0 # per minute over last hour
    if current_velocity > (baseline.avg_logins_per_minute * 5):
        evidence.add("login_velocity")
        
    # 7. session_anomaly
    if current_event.session_id:
        session_events = [
            e for e in history
            if e.session_id == current_event.session_id
            and (now - e.timestamp).total_seconds() <= 3600
        ]
        session_events.append(current_event)
        
        ips = {e.ip for e in session_events}
        devices = {e.device_id for e in session_events if e.device_id}
        
        if len(ips) >= 2 or len(devices) >= 2:
            evidence.add("session_anomaly")
            
    # 8. sudden_behavior_change
    # Z-score >= 3. Assuming standard deviation = max(0.01, avg * 0.5)
    std_dev = max(0.01, baseline.avg_logins_per_minute * 0.5)
    z_score = (current_velocity - baseline.avg_logins_per_minute) / std_dev
    if z_score >= 3.0:
        evidence.add("sudden_behavior_change")

    return evidence
