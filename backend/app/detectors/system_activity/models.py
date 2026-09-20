from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid

class SystemEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Literal["api_log", "system_log", "network_flow"]
    actor: str
    target_service: Optional[str] = None
    method: Optional[str] = None
    endpoint: Optional[str] = None
    status: Optional[int] = None
    bytes_out: Optional[int] = 0
    dst_ip: Optional[str] = None
    dst_port: Optional[int] = None
    file_hash: Optional[str] = None
    action: Optional[str] = None
