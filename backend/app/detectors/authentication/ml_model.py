import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any, Set

class AuthAnomalyModel:
    """
    Lightweight IsolationForest for authentication anomaly scoring.
    Fitted on synthetic data to satisfy the 'SHOULD' benchmark requirement.
    """
    def __init__(self):
        # Synthetic data: [failures_in_10m, distinct_ips_in_1h, distinct_devices_in_1h, logins_per_minute]
        # Normal behavior
        X_train = [
            [0, 1, 1, 0.05],
            [0, 1, 1, 0.1],
            [1, 1, 1, 0.05],
            [0, 1, 2, 0.05],
            [0, 2, 1, 0.05],
        ]
        # Anomalies
        X_train.extend([
            [5, 1, 1, 0.1],   # failed burst
            [0, 5, 2, 0.5],   # session anomaly / velocity
            [0, 1, 5, 1.0],   # multiple devices
            [10, 10, 1, 0.1], # spraying
        ])
        
        self.clf = IsolationForest(contamination=0.2, random_state=42)
        self.clf.fit(X_train)

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
        
        # score_samples gives raw anomaly score. Usually between -1.0 and 0.5.
        score = self.clf.score_samples(vec)[0]
        
        # Normalize to 0-1 (rough heuristic mapping)
        # Normal scores are around 0, anomalies are negative
        # If score = 0, p = 0
        # If score = -1, p = 1
        p = max(0.0, min(1.0, -score))
        return float(p)
        
    def get_ml_insight(self, features_dict: Dict[str, float]) -> List[Dict[str, float]]:
        # Isolation forest doesn't have linear coefficients, but we can just return 
        # the feature that is highest.
        insights = []
        for k, v in features_dict.items():
            if v > 1.0: # threshold to report as insight
                insights.append({"feature": k, "weight": float(v)})
        return insights

auth_anomaly_model = AuthAnomalyModel()
