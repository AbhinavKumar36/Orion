from pydantic import BaseModel
from typing import Set, Tuple
import hashlib

class UserBaseline(BaseModel):
    user_id: str
    known_ips: Set[str]
    known_devices: Set[str]
    known_countries: Set[str]
    usual_hours_start: int # 0-23
    usual_hours_end: int # 0-23
    avg_logins_per_minute: float

def get_user_baseline(user_id: str) -> UserBaseline:
    """
    Mock deterministic baseline generator.
    Uses the user_id hash to generate a stable baseline for testing/demo.
    """
    h = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    
    # Deterministic generation
    base_ip_prefix = f"192.168.{h % 255}"
    known_ips = {f"{base_ip_prefix}.10", f"{base_ip_prefix}.11"}
    
    known_devices = {f"dev_{h % 1000}", "dev_mobile_1"}
    
    countries = ["US", "UK", "CA", "DE", "FR", "IN", "JP", "AU"]
    known_countries = {countries[h % len(countries)]}
    
    # Usual hours, e.g., 8 to 18
    start_hour = 6 + (h % 6)
    end_hour = start_hour + 8 + (h % 4)
    
    # Typical volume: e.g., 0.1 logins per minute
    avg_logins = 0.05 + ((h % 10) / 100.0)

    # For the specific B1-B4 golden cases, if user_id == "user_1042", we can hardcode 
    # specific baseline if needed, but the rules are evaluated relative to this baseline anyway.
    if user_id == "user_1042":
        known_ips = {"10.0.0.50"}
        known_devices = {"corp_macbook_pro"}
        known_countries = {"US"}
        start_hour = 8
        end_hour = 18
        avg_logins = 0.1
        
    return UserBaseline(
        user_id=user_id,
        known_ips=known_ips,
        known_devices=known_devices,
        known_countries=known_countries,
        usual_hours_start=start_hour,
        usual_hours_end=end_hour,
        avg_logins_per_minute=avg_logins
    )
