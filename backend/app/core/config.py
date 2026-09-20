"""
Core configuration loader for ORION.
Strictly loads and validates risk_config.yaml at application startup.
Missing, malformed, or incompatible risk configuration is a fatal startup error.
Never falls back to hardcoded defaults.
"""
from pathlib import Path
from typing import Any, Dict
import yaml


class ConfigError(Exception):
    """Raised when configuration is missing, malformed, or incompatible."""
    pass


class RiskConfigLoader:
    def __init__(self, config_path: str | Path = "risk_config.yaml"):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] | None = None

    def load(self) -> Dict[str, Any]:
        if not self.config_path.exists():
            raise ConfigError(f"Critical configuration file missing: {self.config_path.resolve()}")

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
        except Exception as e:
            raise ConfigError(f"Failed to parse YAML from {self.config_path}: {e}") from e

        if not isinstance(cfg, dict):
            raise ConfigError(f"Invalid risk configuration structure: expected dict, got {type(cfg)}")

        self._validate(cfg)
        self._config = cfg
        return self._config

    def get_config(self) -> Dict[str, Any]:
        if self._config is None:
            return self.load()
        return self._config

    def _validate(self, cfg: Dict[str, Any]) -> None:
        required_root_keys = [
            "version",
            "formula",
            "severity_bands",
            "impact_multipliers",
            "impact_rules",
            "evidence_weights",
            "policy",
            "classification",
            "alerts",
            "safety",
        ]
        for key in required_root_keys:
            if key not in cfg:
                raise ConfigError(f"Missing required root key in risk_config.yaml: '{key}'")

        if cfg.get("version") != "risk-cfg-1.1":
            raise ConfigError(
                f"Incompatible risk config version: expected 'risk-cfg-1.1', found '{cfg.get('version')}'"
            )

        # Validate formula keys
        formula = cfg["formula"]
        if "evidence" not in formula or "probability" not in formula or "confidence" not in formula:
            raise ConfigError("Invalid formula specification in risk_config.yaml")

        # Validate policy floors
        floors = cfg.get("policy", {}).get("floors", {})
        required_floors = ["F1_ato_privileged_success_after_failures", "F2_ato_takeover_pattern", "F3_phish_ip_cred_lookalike"]
        for f in required_floors:
            if f not in floors:
                raise ConfigError(f"Missing required policy floor in risk_config.yaml: '{f}'")


# Singleton instance
risk_config_loader = RiskConfigLoader()


def get_risk_config() -> Dict[str, Any]:
    return risk_config_loader.get_config()
