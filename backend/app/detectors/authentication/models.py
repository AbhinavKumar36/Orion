from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
from datetime import datetime
import uuid

class GeoLocation(BaseModel):
    country: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class AuthEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: Literal["login_success", "login_failure", "logout", "session_activity"]
    ip: str
    device_id: Optional[str] = None
    user_agent: Optional[str] = None
    geo: Optional[GeoLocation] = None
    auth_method: Optional[str] = None
    session_id: Optional[str] = None
    privileged: bool = False
