import numpy as np
import joblib
from pathlib import Path
from typing import List, Dict

class AuthAnomalyModel:
    """
    Loads a pre-trained IsolationForest for authentication anomaly scoring.
    """
    def __init__(self):
        model_path = Path("backend/models/artifacts/auth_anomaly_model.pkl")
        if not model_path.exists():
            raise FileNotFoundError(f"Missing model artifact: {model_path}")
            
        model_data = joblib.load(model_path)
        self.clf = model_data["classifier"]

    def predict_proba(self, features_dict: Dict[str, float]) -> float:
        """
        Calculates an anomaly score normalized to 0.0 - 1.0.
        IsolationForest score_samples returns negative scores (lower = more anomalous).
        We invert this so higher = more anomalous (threat).
        """
        vec = np.array([[
            features_dict.get("failures_in_10m", 0.0),
            features_dict.get("distinct_ips_in_1h", 1.0),
            features_dict.get("distinct_devices_in_1h", 1.0),
            features_dict.get("logins_per_minute", 0.05)
        ]])
        
        score = self.clf.score_samples(vec)[0]
        
        p = max(0.0, min(1.0, -score))
        return float(p)
        
    def get_ml_insight(self, features_dict: Dict[str, float]) -> List[Dict[str, float]]:
        insights = []
        for k, v in features_dict.items():
            if v > 1.0: # threshold to report as insight
                insights.append({"feature": k, "weight": float(v)})
        return insights

auth_anomaly_model = AuthAnomalyModel()
