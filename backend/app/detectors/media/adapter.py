from typing import Literal, List, Dict, Any, Protocol
from dataclasses import dataclass
import json

@dataclass(frozen=True)
class AdapterResult:
    status: Literal["ok", "degraded", "unavailable"]
    p_manipulated: float | None            # None => rules-only mode
    evidence: List[str]
    missing_checks: List[str]              # feeds M = len(missing)/len(expected)
    artifacts: List[str]                   # e.g. ELA heatmap

class MediaAnalysisAdapter(Protocol):
    name: str
    version: str
    def supports(self, media_type: str) -> bool: ...
    def analyze(self, asset: Dict[str, Any], context: dict) -> AdapterResult: ...

class MockTier0Adapter:
    name: str = "Tier0-Mock-Adapter"
    version: str = "1.0"
    
    def supports(self, media_type: str) -> bool:
        return media_type in ["image", "video", "audio"]
        
    def analyze(self, asset: Dict[str, Any], context: dict) -> AdapterResult:
        # For our Phase 4 tests, we look at the 'flags' in the asset to determine evidence,
        # and 'force_status' to simulate adapter degradation or unavailability (e.g. C2 case).
        
        status = asset.get("force_status", "ok")
        evidence = asset.get("flags", [])
        
        # In Tier 0, P is always None, so it's rules-only mode.
        p_manipulated = None
        
        # Calculate missing checks
        expected_checks = ["file_signature", "exif", "editing_software", "ela"]
        missing_checks = []
        if status == "unavailable":
            # If unavailable, all checks might be missing
            missing_checks = expected_checks.copy()
        elif status == "degraded":
            missing_checks = ["ela", "editing_software"] # Mocking some missing checks
        else:
            # We can force missing checks from the payload if needed
            missing_checks = asset.get("force_missing_checks", [])
            
        artifacts = []
        if "ela_inconsistency" in evidence:
            artifacts.append("ela_heatmap.png")
            
        return AdapterResult(
            status=status,
            p_manipulated=p_manipulated,
            evidence=evidence,
            missing_checks=missing_checks,
            artifacts=artifacts
        )
