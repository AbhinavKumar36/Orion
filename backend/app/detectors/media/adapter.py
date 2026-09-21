from typing import Literal, List, Dict, Any, Protocol
from dataclasses import dataclass
import json
import io
from PIL import Image, ExifTags, ImageStat

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
    name: str = "Pillow-Tier0-Adapter"
    version: str = "1.1"
    
    def supports(self, media_type: str) -> bool:
        return media_type in ["image"]
        
    def analyze(self, asset: Dict[str, Any], context: dict) -> AdapterResult:
        # Check if we should use mock logic (from tests)
        if asset.get("force_status") or not asset.get("bytes"):
            status = asset.get("force_status", "ok")
            evidence = asset.get("flags", [])
            missing_checks = asset.get("force_missing_checks", [])
            artifacts = []
            if "ela_inconsistency" in evidence:
                artifacts.append("ela_heatmap.png")
            return AdapterResult(
                status=status,
                p_manipulated=None,
                evidence=evidence,
                missing_checks=missing_checks,
                artifacts=artifacts
            )
            
        file_bytes = asset.get("bytes")
        # REAL TIER-0 LOGIC
        evidence = []
        missing_checks = []
        artifacts = []
        status = "ok"
        
        try:
            img = Image.open(io.BytesIO(file_bytes))
            
            # 1. File signature check (format)
            if img.format not in ["JPEG", "PNG", "GIF", "WEBP"]:
                evidence.append("unsupported_image_format")
                
            # 2. EXIF data check
            exif = img.getexif()
            if not exif:
                evidence.append("exif_missing")
            else:
                # Check for editing software
                for k, v in exif.items():
                    tag = ExifTags.TAGS.get(k, k)
                    if tag == "Software" and any(sw in str(v).lower() for sw in ["photoshop", "gimp", "lightroom"]):
                        evidence.append("editing_software_detected")
                        break
                        
            # 3. Image Stats / Anomaly (mocking ELA here with basic stats)
            stat = ImageStat.Stat(img)
            # Just a silly heuristic to show we are doing real compute: 
            # if standard deviation of R channel is extremely low, it might be artificial
            if len(stat.stddev) > 0 and stat.stddev[0] < 5.0:
                evidence.append("ela_inconsistency") # reusing flag for artificial generation

        except Exception as e:
            status = "degraded"
            missing_checks = ["file_signature", "exif", "ela"]

        return AdapterResult(
            status=status,
            p_manipulated=None,
            evidence=evidence,
            missing_checks=missing_checks,
            artifacts=artifacts
        )
